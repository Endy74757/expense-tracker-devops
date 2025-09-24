from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pymongo import MongoClient
from passlib.hash import bcrypt
import jwt
import os

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://users_db:27017"))
db = client.users_db
SECRET = "secret"

@app.post("/users/register")
def register(data: dict):
    if db.users.find_one({"email": data["email"]}):
        raise HTTPException(400, "Email exists")
    data["password_hash"] = bcrypt.hash(data["password"])
    del data["password"]
    db.users.insert_one(data)
    return {"msg": "registered"}

@app.post("/users/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.users.find_one({"email": form_data.username})
    if not user or not bcrypt.verify(form_data.password, user["password_hash"]):
        raise HTTPException(400, "Invalid credentials")
    token = jwt.encode({"user_id": str(user["_id"])}, SECRET, algorithm="HS256")
    return {"access_token": token}

@app.get("/users/{user_id}")
def get_user(user_id: str):
    user = db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    user["_id"] = str(user["_id"])
    del user["password_hash"]
    return user