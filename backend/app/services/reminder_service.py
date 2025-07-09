from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from datetime import datetime, timedelta
import os
import json
import asyncio
import pytz
from app.config.database import get_database

client = MistralClient(api_key=os.getenv("MISTRAL_API_KEY"))
INDIA_TZ = pytz.timezone("Asia/Kolkata")

def build_prompt(message: str) -> str:
    # This prompt is unchanged and correct.
    return f"""
Extract a JSON array of objects, where each object has exactly two fields: "task" and "duration".
- "task": What the user should be reminded about (example: "check the hand").
- "duration": When to remind them from now (example: "1 hour", "3 minutes", "30 seconds", "2 days").
- Each task in the input should correspond to one object in the output array.
- Only support the following duration units: seconds, minutes, hours, days.
- Use lowercase for units in the output.
- Do NOT return absolute times like "5:30 PM" or "July 8".
- If no duration is given for a task, default to "1 hour".
- If the input is unclear or contains no valid tasks, return an empty array.
- Handle variations like "to", "for", or "after" in the input gracefully.
- For multiple tasks, extract each task and its corresponding duration.
- If a duration is malformed, use "1 hour" for that task.
Input: "set reminder after 3 minutes to check BP and 2 hours to check sugar"
Output: [{{"task": "check BP", "duration": "3 minutes"}}, {{"task": "check sugar", "duration": "2 hours"}}]
Now extract from:
"{message}"
"""

async def process_message_for_reminder(message: str, websocket):
    keywords = ["reminder", "remind me", "set reminder", "worklist remind me"]
    if not any(k in message.lower() for k in keywords):
        await websocket.send_json({"type": "error", "message": "Please use keywords like 'remind me'"})
        return

    # STEP 1: Capture the current "live" time in the user's timezone.
    base_time = datetime.now(INDIA_TZ)
    print(f"[Live Time Captured]: {base_time.isoformat()}")

    try:
        response = client.chat(
            model="mistral-small",
            messages=[ChatMessage(role="user", content=build_prompt(message))],
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        await websocket.send_json({"type": "error", "message": f"AI extraction failed: {str(e)}"})
        return

    if not isinstance(result, list):
        await websocket.send_json({"type": "error", "message": "Invalid AI response format"})
        return
    if not result:
        await websocket.send_json({"type": "error", "message": "No valid tasks found"})
        return

    for item in result:
        task = item.get("task", "untitled task")
        duration_str = item.get("duration", "1 hour")

        try:
            # STEP 2: Calculate the absolute future time based on the "live" time.
            reminder_time_local = parse_duration(duration_str, base_time)
            print(f"[Target Time Calculated]: {task} → {reminder_time_local.isoformat()} (Local)")

            if reminder_time_local <= base_time:
                raise ValueError("Reminder time must be in the future")
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Duration parse failed: {str(e)}"})
            continue

        try:
            db = get_database()
            
            # =========================================================================
            # == EXPLICIT ISO 8601 CONVERSION ==
            # 1. Convert the calculated local time to UTC.
            # 2. Format it as an ISO 8601 string. The 'Z' indicates UTC.
            # =========================================================================
            reminder_time_utc = reminder_time_local.astimezone(pytz.utc)
            iso_timestamp_string = reminder_time_utc.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            
            db.reminders.insert_one({
                "task": task,
                "reminder_time": iso_timestamp_string, # Store the string
                "completed": False
            })
            print(f"[DB Saved as ISO String]: {task} → {iso_timestamp_string}")
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Database error: {str(e)}"})
            continue

        await websocket.send_json({
            "type": "confirmation",
            "message": f"Reminder set for '{task}' at {reminder_time_local.strftime('%I:%M %p')}"
        })

        # STEP 3: Schedule the notification. Pass the absolute local time.
        asyncio.create_task(schedule_notification(task, reminder_time_local, websocket))

def parse_duration(duration_str: str, base_time: datetime) -> datetime:
    # This function correctly calculates the future time from the base time.
    duration_str = duration_str.lower().strip()
    parts = duration_str.split()
    if len(parts) < 2: return base_time + timedelta(hours=1)
    try:
        value = float(parts[0])
        unit = parts[1]
    except Exception:
        return base_time + timedelta(hours=1)
    if "second" in unit: return base_time + timedelta(seconds=value)
    elif "minute" in unit: return base_time + timedelta(minutes=value)
    elif "hour" in unit: return base_time + timedelta(hours=value)
    elif "day" in unit: return base_time + timedelta(days=value)
    return base_time + timedelta(hours=1)

async def schedule_notification(task: str, reminder_time: datetime, websocket):
    # This function's logic is the key to correct timing.
    # It calculates the remaining seconds to wait from "now".
    now = datetime.now(reminder_time.tzinfo) # Use the same timezone as the target time
    wait_seconds = (reminder_time - now).total_seconds()

    print(f"[Scheduler] Waiting {wait_seconds:.1f}s for task: {task}")

    if wait_seconds > 0:
        await asyncio.sleep(wait_seconds)

    try:
        if websocket.client_state.name != "CONNECTED":
            print(f"[⛔] WebSocket closed before notification: {task}")
            return
        await websocket.send_json({"type": "notification", "task": task})
        print(f"[🔔 Notification Sent] {task} at {datetime.now(INDIA_TZ).strftime('%I:%M:%S %p')} IST")
    except Exception as e:
        print(f"[WebSocket Error] Failed to send notification: {e}")