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
MEDICAL TASK EXTRACTION SYSTEM

You are an AI assistant specialized in extracting medical tasks and reminders from doctor's chat messages. 
Your role is to automatically identify actionable medical tasks and schedule appropriate reminders

CORE RULES:
1. **Automatic Task Detection**: Extract tasks from ANY medical instruction, order, or note - even without explicit "remind me" keywords
2. **Medical Context Priority**: Focus ONLY on medical tasks, procedures, patient care instructions, and clinical activities
3. **Chat-Specific Extraction**: Only extract tasks from the current chat message, ignore other conversations
4. **Actionable Items Only**: Extract tasks that require future action, follow-up, or monitoring

MEDICAL TASK CATEGORIES TO DETECT:
- Laboratory orders (blood work, cultures, imaging)
- Medication administration or changes
- Patient monitoring (vitals, symptoms, drainage)
- Procedure scheduling (surgery, interventions)
- Follow-up appointments or consultations
- Patient education or counseling
- Equipment management (catheters, drains, devices)
- Discharge planning activities
- Clinical documentation requirements

TIMING RULES:
1. **"Today" Scheduling** (based on current time):
   - 00:00-10:59 AM → Remind at 1:00 PM same day
   - 11:00 AM-3:59 PM → Remind at 4:00 PM same day
   - 4:00 PM-7:59 PM → Remind at 8:00 PM same day
   - 8:00 PM+ → Remind at 1:00 PM next day

2. **"Tomorrow" Scheduling**: Always 1:00 PM next calendar day

3. **Relative Time Calculation**: Calculate exact future time from current time
   - "in 2 hours" → current_time + 2 hours
   - "after 30 minutes" → current_time + 30 minutes
   - "in 3 days" → current_time + 3 days

4. **Default Timing**: If no time specified, set reminder for 1 hour from current time

5. **Urgent Tasks**: For critical tasks without time, set reminder for 15 minutes from current time

MEDICAL ABBREVIATIONS DICTIONARY:
- OT: Operation Theatre
- Hb: Hemoglobin
- Tc: Total Count (WBC count)
- S.Creat: Serum Creatinine
- DM: Diabetes Mellitus
- HTN: Hypertension
- Foleys: Foley's Catheter
- BP: Blood Pressure
- HR: Heart Rate
- RR: Respiratory Rate
- O2 Sat: Oxygen Saturation
- IV: Intravenous
- IM: Intramuscular
- PO: Per Oral (by mouth)
- PRN: As needed
- QID: Four times daily
- TID: Three times daily
- BID: Twice daily
- NPO: Nothing by mouth
- DVT: Deep Vein Thrombosis
- ICU: Intensive Care Unit
- CCU: Coronary Care Unit
- ECG/EKG: Electrocardiogram
- CT: Computed Tomography
- MRI: Magnetic Resonance Imaging
- X-ray: Radiograph

TASK EXTRACTION PATTERNS:
- Action verbs: collect, send, check, monitor, review, schedule, remove, insert, administer, prescribe
- Medical procedures: surgery, biopsy, endoscopy, catheterization
- Lab orders: blood work, cultures, imaging studies
- Patient care: positioning, feeding, medication, wound care
- Documentation: consent, notes, reports, discharge summary

OUTPUT FORMAT:
Return a JSON array of objects with exactly these fields:
- "task": Clear, complete description of the medical task
- "remind_at": ISO datetime string with timezone (+05:30 for IST)
- "priority": "high", "medium", or "low" based on clinical urgency
- "category": Medical category (lab, medication, procedure, monitoring, etc.)

EXAMPLES:

Current Time: 2024-07-09T10:30:00+05:30
Input: "Patient in bed 5 needs blood culture and urine culture collected today. Schedule for SETON removal tomorrow in OT 7"
Output: [
    {{
        "task": "Collect blood culture and urine culture for patient in bed 5",
        "remind_at": "2024-07-09T13:00:00+05:30",
        "priority": "high",
        "category": "lab"
    }},
    {{
        "task": "Schedule SETON removal in OT 7",
        "remind_at": "2024-07-10T13:00:00+05:30",
        "priority": "medium",
        "category": "procedure"
    }}
]

Current Time: 2024-07-09T14:00:00+05:30
Input: "Check patient's sugars after two hours. Send Hb, Tc, S.Creat today"
Output: [
    {{
        "task": "Check patient's blood sugar levels",
        "remind_at": "2024-07-09T16:00:00+05:30",
        "priority": "medium",
        "category": "monitoring"
    }},
    {{
        "task": "Send Hb, Tc, S.Creat lab orders",
        "remind_at": "2024-07-09T16:00:00+05:30",
        "priority": "medium",
        "category": "lab"
    }}
]

Current Time: 2024-07-09T09:00:00+05:30
Input: "Remove Foleys after clamping for 4 hours"
Output: [
    {{
        "task": "Remove Foley's catheter after clamping",
        "remind_at": "2024-07-09T10:00:00+05:30",
        "priority": "high",
        "category": "procedure"
    }}
]

Current Time: 2024-07-09T21:00:00+05:30
Input: "Monitor BP every 2 hours overnight"
Output: [
    {{
        "task": "Monitor blood pressure every 2 hours overnight",
        "remind_at": "2024-07-09T23:00:00+05:30",
        "priority": "high",
        "category": "monitoring"
    }}
]

IMPORTANT NOTES:
- Extract ALL actionable medical tasks, even without explicit reminder keywords
- Prioritize patient safety and clinical urgency
- Use complete, clear task descriptions
- Include patient identifiers when mentioned (bed number, name, etc.)
- Consider medical context and standard protocols
- Handle multiple tasks in a single message
- Ignore non-medical conversations or casual chat

Now extract medical tasks from this message:
"{message}"
"""

async def process_message_for_reminder(message: str, websocket):
    keywords = ["collect", "send", "check", "monitor", "review", "schedule", "remove", "insert",
        "administer", "prescribe", "order", "request", "obtain", "perform", "conduct",
        

        "surgery", "operation", "biopsy", "endoscopy", "catheterization", "intubation",
        "extubation", "tracheostomy", "dialysis", "chemotherapy", "radiotherapy",
        

        "blood work", "lab", "culture", "biopsy", "x-ray", "ct", "mri", "ultrasound",
        "ecg", "ekg", "echo", "stress test", "holter", "eeg", "emg",
        

        "medication", "dose", "infusion", "injection", "wound care", "dressing",
        "positioning", "feeding", "nutrition", "hydration", "oxygen", "ventilator",
        
   
        "today", "tomorrow", "after", "in", "before", "by", "at", "every", "hourly",
        "daily", "weekly", "morning", "afternoon", "evening", "night", "overnight",
        
  
        "ot", "icu", "ccu", "er", "or", "pacu", "hb", "tc", "creat", "bp", "hr",
        "rr", "o2", "spo2", "foleys", "iv", "im", "po", "prn", "qid", "tid", "bid",
        
        "consent", "discharge", "transfer", "admit", "notes", "report", "summary",
        "assessment", "plan", "follow-up", "consultation", "referral"]
    if not any(k in message.lower() for k in keywords):
        await websocket.send_json({"type": "error", "message": "Please use keywords like 'remind me'"})
        return


    base_time = datetime.now(INDIA_TZ)
    print(f"[Live Time Captured]: {base_time.isoformat()}")

    try:
        response = client.chat(
            model="mistral-large-latest",
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
            
      
            reminder_time_utc = reminder_time_local.astimezone(pytz.utc)
            iso_timestamp_string = reminder_time_utc.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            
            db.reminders.insert_one({
                "task": task,
                "reminder_time": iso_timestamp_string, 
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