from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from datetime import datetime, timedelta
import os
import json
import asyncio
import pytz
from app.config.database import get_database

# --- Setup ---
# Ensure you have set the MISTRAL_API_KEY environment variable
# pip install mistralai pytz pymongo

client = MistralClient(api_key=os.getenv("MISTRAL_API_KEY"))
INDIA_TZ = pytz.timezone("Asia/Kolkata")

def build_prompt(message: str, current_time_iso: str) -> str:
    """
    Builds a highly specific prompt for a medical reminder assistant.
    """
    return f"""
You are an intelligent AI assistant for a doctor in India (Timezone: Asia/Kolkata).
Your primary function is to extract structured reminders from a doctor's notes.
You must return a JSON array of objects. Each object must have exactly two keys: "task" and "remind_at".

- "task": A string containing the full, descriptive action item for the doctor.
- "remind_at": A string containing the EXACT future reminder time. This MUST be a full ISO 8601 timestamp string for the Asia/Kolkata timezone (e.g., "2024-07-09T13:00:00+05:30").

You MUST calculate the "remind_at" value based on the provided current time and the following strict rules:

CURRENT TIME: {current_time_iso}

--- RULES FOR CALCULATING 'remind_at' ---

1.  **Rule for "today" keyword:**
    If the user says "today", "morning", "evening" or implies the current day, use the doctor's standard schedule based on the CURRENT TIME:
    - If the CURRENT TIME is between 00:00 and 10:59 AM, set the reminder for 1:00 PM (13:00) on the same day.
    - If the CURRENT TIME is between 11:00 AM and 3:59 PM (15:59), set the reminder for 4:00 PM (16:00) on the same day.
    - If the CURRENT TIME is between 4:00 PM (16:00) and 7:59 PM (19:59), set the reminder for 8:00 PM (20:00) on the same day.
    - If the CURRENT TIME is 8:00 PM (20:00) or later, set the reminder for 1:00 PM (13:00) the NEXT day.

2.  **Rule for "tomorrow" keyword:**
    If the user says "tomorrow", set the reminder for 1:00 PM (13:00) on the NEXT calendar day.

3.  **Rule for Relative Times:**
    If the user gives a relative time like "after 2 hours", "in 30 minutes", "after 3 days", calculate the exact time from the CURRENT TIME.

4.  **Default Rule (No Time Specified):**
    If a task is mentioned but has NO time information (e.g., "Explain patient party about cost consent"), set the reminder for exactly 1 hour from the CURRENT TIME.

5.  **Task Extraction & Medical Shorthand:**
    - The "task" description should be complete.
    - Understand medical abbreviations:
      - OT: Operation Theatre
      - Hb: Hemoglobin
      - Tc: Total Count
      - S.Creat: Serum Creatinine
      - DM: Diabetes Mellitus
      - Foleys: Foley's Catheter

--- EXAMPLES ---

- Current Time: 2024-07-09T10:30:00+05:30
- Input: "Collect blood and urine culture today. And post for SETON removal tomorrow in OT 7"
- Output: [
    {{"task": "Collect blood and urine culture", "remind_at": "2024-07-09T13:00:00+05:30"}},
    {{"task": "Post for SETON removal in OT 7", "remind_at": "2024-07-10T13:00:00+05:30"}}
  ]

- Current Time: 2024-07-09T14:00:00+05:30
- Input: "remind me to check sugars after two hours. also send Hb, Tc, S.Creat today"
- Output: [
    {{"task": "check sugars", "remind_at": "2024-07-09T16:00:00+05:30"}},
    {{"task": "Send Hb, Tc, S.Creat", "remind_at": "2024-07-09T16:00:00+05:30"}}
  ]

- Current Time: 2024-07-09T09:00:00+05:30
- Input: "Remove Foleys after clamping"
- Output: [{{"task": "Remove Foleys after clamping", "remind_at": "2024-07-09T10:00:00+05:30"}}]

- Current Time: 2024-07-09T21:00:00+05:30
- Input: "check BP today"
- Output: [{{"task": "check BP", "remind_at": "2024-07-10T13:00:00+05:30"}}]

--- FINAL INSTRUCTIONS ---
- If the input is unclear or contains no valid tasks, return an empty JSON array: [].
- Adhere strictly to the JSON format specified. Do not add any extra explanations.

Now extract reminders from the following message:
"{message}"
"""

async def process_message_for_reminder(message: str, websocket):
    keywords = ["reminder", "remind me", "set reminder", "worklist", "today", "tomorrow", "collect", "post", "send", "remove", "explain"]
    if not any(k in message.lower() for k in keywords):
        await websocket.send_json({"type": "error", "message": "Please provide a task to be reminded about."})
        return

    # STEP 1: Capture the current "live" time and format it for the prompt.
    base_time = datetime.now(INDIA_TZ)
    base_time_iso = base_time.isoformat()
    print(f"[Live Time Captured]: {base_time_iso}")

    try:
        # Create the new, more powerful prompt
        prompt = build_prompt(message, base_time_iso)

        response = client.chat(
            model="mistral-large-latest", # Use a more powerful model for better logical reasoning
            messages=[ChatMessage(role="user", content=prompt)],
            response_format={"type": "json_object"}
        )
        # The AI is expected to return a JSON object with a single key "output" that contains the array.
        # This can sometimes happen. We'll handle both cases: a direct array or an object containing it.
        raw_content = response.choices[0].message.content
        data = json.loads(raw_content)
        
        # Check if the result is a dictionary containing the list (e.g., {"output": [...]}) or the list itself
        result = data if isinstance(data, list) else data.get("output", [])
        
    except Exception as e:
        await websocket.send_json({"type": "error", "message": f"AI extraction failed: {str(e)}"})
        return

    if not isinstance(result, list):
        await websocket.send_json({"type": "error", "message": "Invalid AI response format. Expected a list."})
        return
    if not result:
        await websocket.send_json({"type": "error", "message": "No valid tasks found in your message."})
        return

    for item in result:
        task = item.get("task")
        remind_at_str = item.get("remind_at")

        if not task or not remind_at_str:
            print(f"[Skipping Invalid Item]: {item}")
            continue

        try:
            # STEP 2: The AI has done the hard work. We just parse its result.
            # datetime.fromisoformat() correctly parses the timezone-aware ISO string.
            reminder_time_local = datetime.fromisoformat(remind_at_str)
            print(f"[Target Time Parsed]: {task} → {reminder_time_local.isoformat()} (Local)")

            if reminder_time_local <= datetime.now(INDIA_TZ):
                raise ValueError("Reminder time must be in the future.")

        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Time calculation error for task '{task}': {str(e)}"})
            continue

        try:
            db = get_database()
            
            # For MongoDB, it's best practice to store dates as native BSON Date objects.
            # The ISO string approach also works, but native dates are better for queries.
            # We already have a timezone-aware datetime object, which the driver handles correctly.
            db.reminders.insert_one({
                "task": task,
                "reminder_time": reminder_time_local, # Store as native BSON Date
                "created_at": base_time,
                "completed": False
            })
            print(f"[DB Saved as BSON Date]: {task} → {reminder_time_local}")
            
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Database error: {str(e)}"})
            continue

        await websocket.send_json({
            "type": "confirmation",
            "message": f"Reminder set for '{task}' at {reminder_time_local.strftime('%-I:%M %p on %b %d')}"
        })

        # STEP 3: Schedule the notification. This function works perfectly with the absolute time.
        asyncio.create_task(schedule_notification(task, reminder_time_local, websocket))


async def schedule_notification(task: str, reminder_time: datetime, websocket):
    """
    Schedules a notification to be sent at the specified absolute time.
    This function's logic is correct and does not need changes.
    """
    # Use the same timezone as the target time for an accurate comparison
    now = datetime.now(reminder_time.tzinfo)
    wait_seconds = (reminder_time - now).total_seconds()

    print(f"[Scheduler] Waiting {wait_seconds:.1f}s for task: '{task}'")

    if wait_seconds > 0:
        await asyncio.sleep(wait_seconds)

    try:
        if websocket.client_state.name != "CONNECTED":
            print(f"[⛔] WebSocket closed before notification for '{task}' could be sent.")
            return
            
        await websocket.send_json({"type": "notification", "task": task})
        print(f"[🔔 Notification Sent] '{task}' at {datetime.now(INDIA_TZ).strftime('%I:%M:%S %p')} IST")
        
    except Exception as e:
        print(f"[WebSocket Error] Failed to send notification for '{task}': {e}")