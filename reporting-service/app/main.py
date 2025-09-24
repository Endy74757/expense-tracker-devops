from fastapi import FastAPI
from pymongo import MongoClient
import os

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://transactions_db:27017"))
db = client.transactions_db

@app.get("/reports/monthly")
def monthly_report(user_id: str):
    # Example: summary by month
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}}
    ]
    report = list(db.transactions.aggregate(pipeline))
    return report

@app.get("/reports/category")
def category_report(user_id: str, month: str):
    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$regex": f"^{month}-"}}},
        {"$group": {"_id": "$category_id", "total": {"$sum": "$amount"}}}
    ]
    report = list(db.transactions.aggregate(pipeline))
    return report