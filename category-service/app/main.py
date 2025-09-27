from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
import motor.motor_asyncio
import os
from jose import JWTError, jwt

# --- Environment & Security ---
# SECRET_KEY ต้องตรงกับใน user-service
SECRET_KEY = os.environ.get("SECRET_KEY", "a_default_secret_key_for_development")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # URL ไม่สำคัญใน service นี้

# --- MongoDB Connection ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://mongo_categories:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["categories_db"]
categories_collection = db["categories"]

# --- Helper for ObjectId ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


# --- Pydantic Models ---
class CategoryBase(BaseModel):
    user_id: str
    name: str
    type: str = Field(..., pattern="^(income|expense)$")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(income|expense)$")

class CategoryOut(CategoryBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True

# --- Authentication Dependency ---
async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception

# --- FastAPI App ---
app = FastAPI(title="Category Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Routes ---
@app.get("/categories", response_model=List[CategoryOut])
async def get_categories(
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    current_user_id: str = Depends(get_current_user_id)
):
    """ ดึง categories ของผู้ใช้ที่ล็อกอินอยู่ """
    query = {"user_id": current_user_id}
    if type:
        query["type"] = type
    
    categories = await categories_collection.find(query).to_list(100)
    return categories


@app.post("/categories", response_model=CategoryOut)
async def create_category(category: CategoryCreate, current_user_id: str = Depends(get_current_user_id)):
    """ เพิ่ม category ใหม่ """
    # ตรวจสอบว่า user_id ที่ส่งมาตรงกับใน token หรือไม่
    if category.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create category for this user")
    
    # ตรวจสอบว่ามีหมวดหมู่ชื่อและประเภทนี้อยู่แล้วหรือไม่
    existing = await categories_collection.find_one({
        "user_id": current_user_id,
        "name": category.name,
        "type": category.type
    })
    if existing:
        raise HTTPException(status_code=400, detail="หมวดหมู่นี้มีอยู่แล้ว")


    new_category = category.model_dump()
    result = await categories_collection.insert_one(new_category)
    created = await categories_collection.find_one({"_id": result.inserted_id})
    return created


@app.put("/categories/{id}", response_model=CategoryOut)
async def update_category(id: str, category: CategoryUpdate, current_user_id: str = Depends(get_current_user_id)):
    """ อัปเดต category ตาม id """
    # ตรวจสอบก่อนว่า category นี้เป็นของผู้ใช้ที่ login อยู่หรือไม่
    existing_category = await categories_collection.find_one({"_id": ObjectId(id)})
    if not existing_category or existing_category.get("user_id") != current_user_id:
        raise HTTPException(status_code=404, detail="Category not found or not authorized")

    update_data = {k: v for k, v in category.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # ตรวจสอบว่าการอัปเดตจะทำให้เกิดข้อมูลซ้ำหรือไม่
    if 'name' in update_data or 'type' in update_data:
        check_name = update_data.get('name', existing_category['name'])
        check_type = update_data.get('type', existing_category['type'])
        
        duplicate_check = await categories_collection.find_one({
            "user_id": current_user_id,
            "name": check_name,
            "type": check_type,
            "_id": {"$ne": ObjectId(id)} # ไม่ใช่เอกสารปัจจุบัน
        })
        if duplicate_check:
            raise HTTPException(status_code=400, detail="ชื่อหมวดหมู่นี้ถูกใช้แล้ว")

    result = await categories_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": update_data}
    )
    if result.modified_count == 0:
        # This might happen if the update data is the same as the existing data
        pass

    updated = await categories_collection.find_one({"_id": ObjectId(id)})
    return updated


@app.delete("/categories/{id}")
async def delete_category(id: str, current_user_id: str = Depends(get_current_user_id)):
    """ ลบ category """
    # ตรวจสอบก่อนว่า category นี้เป็นของผู้ใช้ที่ login อยู่หรือไม่
    existing_category = await categories_collection.find_one({"_id": ObjectId(id)})
    if not existing_category or existing_category.get("user_id") != current_user_id:
        raise HTTPException(status_code=404, detail="Category not found or not authorized")

    result = await categories_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return
