from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Reminder(BaseModel):
    id: Optional[str] = None  # string version of MongoDB's ObjectId
    task: str
    reminder_time: datetime
    completed: bool = False
    completed_at: Optional[datetime] = None  # for future auto-deletion

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
