from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.database import Database
from app.models.reminder import Reminder
from typing import List

router = APIRouter()

def get_db(request: Request):
    return request.app.db

@router.get("/reminders", response_model=List[Reminder])
async def get_reminders(db: Database = Depends(get_db)):
    reminders = db.reminders.find()
    return [Reminder(**r) for r in reminders]

@router.patch("/reminders/{id}", response_model=Reminder)
async def update_reminder(id: str, db: Database = Depends(get_db)):
    reminder = db.reminders.find_one({"_id": id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    # Toggle the completed field
    new_completed = not reminder.get("completed", False)
    db.reminders.update_one({"_id": id}, {"$set": {"completed": new_completed}})
    
    # Fetch updated reminder
    updated_reminder = db.reminders.find_one({"_id": id})
    return Reminder(**updated_reminder)
