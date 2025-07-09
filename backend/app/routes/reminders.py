# app/routes/reminders.py

from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.database import Database
from app.models.reminder import Reminder
from typing import List
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def get_db(request: Request) -> Database:
    return request.app.db

# Utility to convert MongoDB document to Reminder model
def serialize_reminder(reminder):
    reminder["id"] = str(reminder["_id"])
    del reminder["_id"]
    return Reminder(**reminder)

@router.get("/reminders", response_model=List[Reminder])
async def get_reminders(db: Database = Depends(get_db)):
    reminders_cursor = db.reminders.find()
    reminders = await reminders_cursor.to_list(length=100)
    return [serialize_reminder(r) for r in reminders]

@router.patch("/reminders/{id}", response_model=Reminder)
async def update_reminder(id: str, db: Database = Depends(get_db)):
    try:
        object_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    reminder = await db.reminders.find_one({"_id": object_id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Toggle completed status
    new_completed = not reminder.get("completed", False)
    update_data = {
        "completed": new_completed,
        "completed_at": datetime.utcnow() if new_completed else None
    }

    await db.reminders.update_one({"_id": object_id}, {"$set": update_data})

    updated_reminder = await db.reminders.find_one({"_id": object_id})
    return serialize_reminder(updated_reminder)
