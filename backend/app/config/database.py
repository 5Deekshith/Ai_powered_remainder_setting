from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def get_database():
    client = MongoClient(os.getenv("MONGO_URI"))
    return client["chat_app"]