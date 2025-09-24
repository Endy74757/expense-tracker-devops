from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
import os

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://categories_db:27017"))
db = client.categories_db

@app.get("/categories")
def get_categories(type: str = None):
    query = {}
    if type:
        query["type"] = type
    categories = list(db.categories.find(query))
    for c in categories:
        c["_id"] = str(c["_id"])
    return categories

@app.post("/categories")
def add_category(data: dict):
    db.categories.insert_one(data)
    return {"msg": "added"}

@app.put("/categories/{id}")
def update_category(id: str, data: dict):
    result = db.categories.update_one({"_id": id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(404, "Category not found")
    return {"msg": "updated"}

@app.delete("/categories/{id}")
def delete_category(id: str):
    result = db.categories.delete_one({"_id": id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Category not found")
    return {"msg": "deleted"}