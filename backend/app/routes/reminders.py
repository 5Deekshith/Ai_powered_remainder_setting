from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.database import Database
from app.models.reminder import Reminder
from typing import List
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def get_db(request: Request) -> Database:
    return request.app.db

def serialize_reminder(reminder):
    reminder["id"] = str(reminder["_id"])
    del reminder["_id"]
    return Reminder(**reminder)

# GET all reminders
@router.get("/reminders", response_model=List[Reminder])
async def get_reminders(db: Database = Depends(get_db)):
    reminders_cursor = db.reminders.find()
    reminders = await reminders_cursor.to_list(length=100)
    return [serialize_reminder(r) for r in reminders]

# PATCH: toggle complete/incomplete
@router.patch("/reminders/{id}", response_model=Reminder)
async def toggle_reminder(id: str, db: Database = Depends(get_db)):
    try:
        object_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    reminder = await db.reminders.find_one({"_id": object_id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    new_completed = not reminder.get("completed", False)
    update_data = {
        "completed": new_completed,
        "completed_at": datetime.utcnow() if new_completed else None
    }

    await db.reminders.update_one({"_id": object_id}, {"$set": update_data})
    updated = await db.reminders.find_one({"_id": object_id})
    return serialize_reminder(updated)

# PUT: edit reminder (task or reminder_time)
@router.put("/reminders/{id}", response_model=Reminder)
async def edit_reminder(id: str, data: dict, db: Database = Depends(get_db)):
    try:
        object_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db.reminders.update_one({"_id": object_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")

    updated = await db.reminders.find_one({"_id": object_id})
    return serialize_reminder(updated)

# DELETE reminder
@router.delete("/reminders/{id}")
async def delete_reminder(id: str, db: Database = Depends(get_db)):
    try:
        object_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db.reminders.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")

    return {"message": "Reminder deleted"}
