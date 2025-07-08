from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.reminder_service import process_message_for_reminder
import json

router = APIRouter()

# Store active WebSocket connections
active_connections = set()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process message for reminder
            response = await process_message_for_reminder(data, websocket)
            # Echo user message back
            user_message = {
                "type": "message",
                "text": data,
                "isBot": False
            }
            await websocket.send_json(user_message)
            # Send bot response if any
            if response:
                bot_message = {
                    "type": "message",
                    "text": response,
                    "isBot": True
                }
                await websocket.send_json(bot_message)
    except WebSocketDisconnect:
        active_connections.remove(websocket)