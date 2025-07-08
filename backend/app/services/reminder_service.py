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

Examples:
Input: "set the reminder to 1 hour for check the hand"
Output: [{{"task": "check the hand", "duration": "1 hour"}}]

Input: "set reminder after 3 minutes to check BP and 2 hours to check sugar"
Output: [{{"task": "check BP", "duration": "3 minutes"}}, {{"task": "check sugar", "duration": "2 hours"}}]

Input: "remind me to take medicine"
Output: [{{"task": "take medicine", "duration": "1 hour"}}]

Input: "set reminder to 2 hours for check the hand"
Output: [{{"task": "check the hand", "duration": "2 hours"}}]

Input: "hello world"
Output: []

Now extract from:
"{message}"
"""

async def process_message_for_reminder(message: str, websocket):
    # Validate input
    keywords = ["reminder", "remind me", "set reminder", "worklist remind me"]
    if not any(k in message.lower() for k in keywords):
        await websocket.send_json({
            "type": "error",
            "message": "Please use keywords like 'remind me' or 'set reminder'"
        })
        return

    # Get current time in IST
    now = datetime.now(INDIA_TZ)
    print(f"[Current Time]: {now.strftime('%B %d, %Y %I:%M:%S %p')} IST")

    # Ask Mistral to extract tasks and durations
    try:
        response = client.chat(
            model="mistral-small",
            messages=[ChatMessage(role="user", content=build_prompt(message))],
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        print("[Mistral AI]:", result)
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"AI extraction failed: {str(e)}"
        })
        return

    # Ensure result is a list
    if not isinstance(result, list):
        await websocket.send_json({
            "type": "error",
            "message": "Invalid AI response format: Expected a list of tasks"
        })
        return

    if not result:
        await websocket.send_json({
            "type": "error",
            "message": "No valid tasks found in the message"
        })
        return

    # Process each task
    for item in result:
        task = item.get("task", "untitled task")
        duration_str = item.get("duration", "1 hour")

        # Parse the duration
        try:
            reminder_time = parse_duration(duration_str, now)
            print(f"[Parsed Reminder Time]: {task} → {reminder_time.strftime('%B %d, %Y %I:%M:%S %p')} IST")
            if reminder_time <= now:
                raise ValueError("Reminder time must be in the future")
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Duration parse failed for task '{task}': {str(e)}"
            })
            continue

        # Save to DB (store as UTC)
        try:
            db = get_database()
            reminder_time_utc = reminder_time.astimezone(pytz.utc)
            db.reminders.insert_one({
                "task": task,
                "reminder_time": reminder_time_utc,
                "completed": False
            })
            print(f"[DB Saved]: {task} → {reminder_time_utc.strftime('%B %d, %Y %I:%M:%S %p')} UTC")
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Database error for task '{task}': {str(e)}"
            })
            continue

        # Send confirmation in IST
        await websocket.send_json({
            "type": "confirmation",
            "message": f"Reminder set for '{task}' at {reminder_time.strftime('%B %d, %Y %I:%M:%S %p')} IST"
        })

        # Schedule async notification
        asyncio.create_task(schedule_notification(task, reminder_time, websocket, now))

def parse_duration(duration_str: str, base_time: datetime) -> datetime:
    duration_str = duration_str.lower().strip()
    parts = duration_str.split()

    if len(parts) < 2:
        print(f"[Parse Duration]: Defaulting to 1 hour for '{duration_str}'")
        return base_time + timedelta(hours=1)

    try:
        value = float(parts[0])
        unit = parts[1]
    except Exception as e:
        print(f"[Parse Duration Error]: Invalid format '{duration_str}', defaulting to 1 hour. Error: {str(e)}")
        return base_time + timedelta(hours=1)

    if "second" in unit:
        return base_time + timedelta(seconds=value)
    elif "minute" in unit:
        return base_time + timedelta(minutes=value)
    elif "hour" in unit:
        return base_time + timedelta(hours=value)
    elif "day" in unit:
        return base_time + timedelta(days=value)

    print(f"[Parse Duration]: Unknown unit in '{duration_str}', defaulting to 1 hour")
    return base_time + timedelta(hours=1)

async def schedule_notification(task: str, reminder_time: datetime, websocket, start_time: datetime):
    wait_time = (reminder_time - start_time).total_seconds()
    print(f"[Scheduler] Waiting {wait_time:.1f}s for: {task}")

    if wait_time > 0:
        await asyncio.sleep(wait_time)

    try:
        if websocket.client_state.name != "CONNECTED":
            print(f"[⛔] WebSocket closed before notification: {task}")
            return

        await websocket.send_json({
            "type": "notification",
            "task": task
        })
        print(f"[🔔 Notification Sent] {task} at {datetime.now(INDIA_TZ).strftime('%B %d, %Y %I:%M:%S %p')} IST")
    except Exception as e:
        print(f"[WebSocket Error] Failed to send: {e}")