from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
import os

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://transactions_db:27017"))
db = client.transactions_db

@app.post("/transactions")
def add_transaction(data: dict):
    db.transactions.insert_one(data)
    return {"msg": "added"}

@app.get("/transactions")
def list_transactions(user_id: str, month: str = None):
    query = {"user_id": user_id}
    if month:
        query["date"] = {"$regex": f"^{month}-"}
    transactions = list(db.transactions.find(query))
    for t in transactions:
        t["_id"] = str(t["_id"])
    return transactions

@app.put("/transactions/{id}")
def update_transaction(id: str, data: dict):
    result = db.transactions.update_one({"_id": id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(404, "Transaction not found")
    return {"msg": "updated"}

@app.delete("/transactions/{id}")
def delete_transaction(id: str):
    result = db.transactions.delete_one({"_id": id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Transaction not found")
    return {"msg": "deleted"}