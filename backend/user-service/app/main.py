from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# -------------------------------
# CONFIG
# -------------------------------
load_dotenv()

try:
    SECRET_KEY = os.environ["SECRET_KEY"]
except KeyError:
    # This will cause the application to crash on startup if the SECRET_KEY is not set,
    # which is a good practice for required configurations.
    raise RuntimeError("SECRET_KEY environment variable not set. Application cannot start.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

app = FastAPI(title="User Service")

# MongoDB Client (Read from environment variable)
try:
    MONGO_URI = os.environ["MONGO_URI"]
except KeyError:
    # This will cause the application to crash on startup if the MONGO_URI is not set,
    # which is a good practice for required configurations.
    raise RuntimeError("MONGO_URI environment variable not set. Application cannot start.")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["users_service"]   # database
users_collection = db["users_db"]  # collection

# CORS Middleware
origins = [
    "http://localhost:5173",  # อนุญาตให้ React Dev Server
    "http://127.0.0.1:5173",
    # เพิ่ม Origin อื่นๆ ที่คุณใช้
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# MODELS
# -------------------------------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # bcrypt has a 72-byte limit for passwords.
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password is too long')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdateName(BaseModel):
    name: str

class UserUpdatePassword(BaseModel):
    old_password: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('New password is too long')
        return v

class UserProfile(BaseModel):
    id: str
    name: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

# -------------------------------
# UTILS
# -------------------------------
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})

async def get_user_by_id(user_id: str):
    return await users_collection.find_one({"_id": ObjectId(user_id)})

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# -------------------------------
# ROUTES
# -------------------------------

# Register
@app.post("/users/register", response_model=UserProfile)
async def register(user: UserRegister):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user.password)
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password_hash": hashed_pw
    }
    result = await users_collection.insert_one(user_doc)
    return UserProfile(id=str(result.inserted_id), name=user.name, email=user.email)

# Login
@app.post("/users/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user["_id"])}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

# Profile
@app.get("/users/{user_id}", response_model=UserProfile)
async def profile(user_id: str, current_user: dict = Depends(get_current_user)):
    if str(current_user["_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")

    return UserProfile(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"]
    )

# Update user name
@app.put("/users/me/name", response_model=UserProfile)
async def update_user_name(update_data: UserUpdateName, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"name": update_data.name}}
    )
    
    updated_user = await get_user_by_id(user_id)
    return UserProfile(
        id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"]
    )

# Update user password
@app.put("/users/me/password")
async def update_user_password(update_data: UserUpdatePassword, current_user: dict = Depends(get_current_user)):
    # Verify old password
    if not verify_password(update_data.old_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="รหัสผ่านเดิมไม่ถูกต้อง")

    # Hash and update new password
    new_hashed_password = get_password_hash(update_data.new_password)
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"password_hash": new_hashed_password}}
    )

    return {"message": "อัปเดตรหัสผ่านสำเร็จ"}
