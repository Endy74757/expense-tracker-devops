from fastapi import FastAPI, HTTPException
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import motor.motor_asyncio
import os
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

# --------------------------------
# Config
# --------------------------------
try:
    MONGO_URI = os.environ["MONGO_URI"]
except KeyError:
    # This will cause the application to crash on startup if the MONGO_URI is not set,
    # which is a good practice for required configurations.
    raise RuntimeError("MONGO_URI environment variable not set. Application cannot start.")
DB_NAME = "transactions_service"
COLLECTION_NAME = "transactions_db"

# --- Security ---
SECRET_KEY = os.environ.get("SECRET_KEY", "a_default_secret_key_for_development")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="Transaction Service")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
transactions_collection = db[COLLECTION_NAME]

origins = [
    "http://localhost:5173",  # Origin ของ React App
    "http://127.0.0.1:5173",
    # เพิ่ม Origin อื่นๆ หากมีการรัน React ด้วย IP หรือ Port อื่น
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # อนุญาตทุก Method
    allow_headers=["*"], # อนุญาตทุก Header
)


# --------------------------------
# Helper for ObjectId
# --------------------------------
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler: GetCoreSchemaHandler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema()
        )

    @classmethod
    def validate(cls, value):
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")
        return ObjectId(value)

# Helper function for converting ObjectId in documents to string
def fix_obj_id(doc):
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    return doc

def fix_obj_id_list(docs):
    return [fix_obj_id(d) for d in docs]

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



# --------------------------------
# Pydantic Models
# --------------------------------
class TransactionBase(BaseModel):
    user_id: str
    category_id: Optional[str] = None
    type: str = Field(..., pattern="^(income|expense)$") # ✅ เปลี่ยนจาก regex เป็น pattern
    amount: float
    date: datetime
    note: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    type: Optional[str]
    amount: Optional[float]
    date: Optional[datetime]
    note: Optional[str]


class TransactionOut(TransactionBase):
    id: str = Field(default=None, alias="_id")

    class Config:
        allow_population_by_field_name = True


# --------------------------------
# API Endpoints
# --------------------------------

# ➕ Add transaction
@app.post("/transactions", response_model=TransactionOut)
async def create_transaction(transaction: TransactionCreate, current_user_id: str = Depends(get_current_user_id)):
    # Verify that the user_id in the payload matches the one from the token
    if transaction.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create transaction for this user")

    new_txn = transaction.model_dump()
    result = await transactions_collection.insert_one(new_txn)
    created_txn = await transactions_collection.find_one({"_id": result.inserted_id})
    return fix_obj_id(created_txn)  


# 📖 Get transactions (filter by user + month)
@app.get("/transactions", response_model=List[TransactionOut])
async def get_transactions(
    month: Optional[int] = None,
    current_user_id: str = Depends(get_current_user_id)):
    query = {"user_id": current_user_id}
    if month:
        # filter transactions in that month
        start_date = datetime(datetime.now().year, month, 1)
        if month == 12:
            end_date = datetime(datetime.now().year + 1, 1, 1)
        else:
            end_date = datetime(datetime.now().year, month + 1, 1)
        query["date"] = {"$gte": start_date, "$lt": end_date}

    cursor = transactions_collection.find(query)
    results = await cursor.to_list(length=1000)
    return fix_obj_id_list(results)


# ✏️ Update transaction
@app.put("/transactions/{id}", response_model=TransactionOut)
async def update_transaction(id: str, transaction: TransactionUpdate, current_user_id: str = Depends(get_current_user_id)):
    # First, verify the transaction belongs to the current user
    existing_txn = await transactions_collection.find_one({"_id": ObjectId(id)})
    if not existing_txn or existing_txn.get("user_id") != current_user_id:
        raise HTTPException(status_code=404, detail="Transaction not found or not authorized")

    update_data = {k: v for k, v in transaction.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await transactions_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": update_data}
    )
    # It's possible modified_count is 0 if the data is the same.
    # The check for existence above is sufficient.
    # We only raise an error if the document was not found initially.
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")

    updated_txn = await transactions_collection.find_one({"_id": ObjectId(id)})
    return fix_obj_id(updated_txn)


# ❌ Delete transaction
@app.delete("/transactions/{id}")
async def delete_transaction(id: str, current_user_id: str = Depends(get_current_user_id)):
    # First, verify the transaction belongs to the current user
    existing_txn = await transactions_collection.find_one({"_id": ObjectId(id)})
    if not existing_txn or existing_txn.get("user_id") != current_user_id:
        raise HTTPException(status_code=404, detail="Transaction not found or not authorized")

    result = await transactions_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"} # This will be a 200 OK with a body
