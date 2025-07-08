from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import get_database
from app.routes import reminders,websocket
from dotenv import load_dotenv
import os


load_dotenv()

app = FastAPI()

# CORS configuration to allow frontend (localhost:5173 for Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(websocket.router)
app.include_router(reminders.router)

# Initialize database
@app.on_event("startup")
async def startup_event():
    app.db = get_database()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("WEBSOCKET_PORT", 8000)))