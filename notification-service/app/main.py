from fastapi import FastAPI
from pymongo import MongoClient
import os

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://notifications_db:27017"))
db = client.notifications_db

@app.post("/notifications")
def post_notification(data: dict):
    db.notifications.insert_one(data)
    return {"msg": "notified"}

@app.get("/notifications")
def get_notifications(user_id: str):
    notifications = list(db.notifications.find({"user_id": user_id}))
    for n in notifications:
        n["_id"] = str(n["_id"])
    return notifications