from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Reminder(BaseModel):
    _id: Optional[str] = None
    task: str
    reminder_time: datetime
    completed: bool = False

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {datetime: lambda v: v.isoformat()}