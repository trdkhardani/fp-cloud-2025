"""
MongoDB Database Configuration and Models for FaceAttend
"""

import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
import gridfs
import io
import base64
from PIL import Image

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    print("❌ PyMongo not available. Install with: pip install pymongo motor gridfs")

from pydantic import BaseModel, Field, ConfigDict
from typing_extensions import Annotated

# Timezone utilities
from timezone_utils import get_local_now, get_local_date_start

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "faceattend")
EMPLOYEES_COLLECTION = "employees"
ATTENDANCE_COLLECTION = "attendance"
FACES_COLLECTION = "faces"

# Database Models
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class Employee(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    department: Optional[str] = None
    email: Optional[str] = None
    face_enrolled: bool = False
    face_encoding_path: Optional[str] = None
    created_at: datetime = Field(default_factory=get_local_now)
    updated_at: datetime = Field(default_factory=get_local_now)

class AttendanceRecord(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    id: str = Field(default_factory=lambda: str(ObjectId()))
    employee_id: str
    employee_name: str
    type: str  # "check-in" or "check-out"
    confidence: float
    timestamp: datetime = Field(default_factory=get_local_now)
    image_id: Optional[str] = None  # GridFS file ID for attendance image
    created_at: datetime = Field(default_factory=get_local_now)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.fs = None
        self.connected = False
        
    def connect(self):
        """Connect to MongoDB"""
        if not PYMONGO_AVAILABLE:
            logging.error("PyMongo not available")
            return False
            
        try:
            self.client = MongoClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            self.db = self.client[DATABASE_NAME]
            self.fs = gridfs.GridFS(self.db)
            
            # Create indexes for better performance
            self.db[EMPLOYEES_COLLECTION].create_index("employee_id", unique=True)
            self.db[ATTENDANCE_COLLECTION].create_index([("employee_id", 1), ("timestamp", -1)])
            
            self.connected = True
            logging.info(f"✅ Connected to MongoDB: {DATABASE_NAME}")
            return True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logging.error(f"❌ MongoDB connection failed: {e}")
            self.connected = False
            return False
        except Exception as e:
            logging.error(f"❌ Database initialization error: {e}")
            self.connected = False
            return False
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.connected = False
            logging.info("📤 Disconnected from MongoDB")

    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self.connected and self.client is not None

    # Employee Operations
    async def create_employee(self, employee_data: Dict[str, Any], face_image_data: Optional[str] = None) -> Dict[str, Any]:
        """Create a new employee with optional face image"""
        try:
            if not self.is_connected():
                raise Exception("Database not connected")

            # Store face image in GridFS if provided
            face_image_id = None
            if face_image_data:
                face_image_id_str = await self.store_face_image(employee_data["employee_id"], face_image_data)
                # Convert string ID back to ObjectId for database storage
                employee_data["face_image_id"] = ObjectId(face_image_id_str)
                employee_data["face_enrolled"] = True

            # Create employee document
            employee_data["created_at"] = get_local_now()
            employee_data["updated_at"] = get_local_now()
            
            result = self.db[EMPLOYEES_COLLECTION].insert_one(employee_data)
            
            # Retrieve and return the created employee
            employee = self.db[EMPLOYEES_COLLECTION].find_one({"_id": result.inserted_id})
            employee["_id"] = str(employee["_id"])
            
            # Convert face_image_id back to string for API response
            if employee.get("face_image_id"):
                employee["face_image_id"] = str(employee["face_image_id"])
            
            logging.info(f"✅ Employee created: {employee_data['name']} ({employee_data['employee_id']})")
            return employee

        except Exception as e:
            logging.error(f"❌ Error creating employee: {e}")
            raise

    async def get_employee(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Get employee by ID"""
        try:
            if not self.is_connected():
                return None
                
            employee = self.db[EMPLOYEES_COLLECTION].find_one({"employee_id": employee_id})
            if employee:
                employee["_id"] = str(employee["_id"])
                # Convert face_image_id to string if present
                if employee.get("face_image_id"):
                    employee["face_image_id"] = str(employee["face_image_id"])
            return employee
        except Exception as e:
            logging.error(f"❌ Error getting employee: {e}")
            return None

    async def get_all_employees(self) -> List[Dict[str, Any]]:
        """Get all employees"""
        try:
            if not self.is_connected():
                return []
                
            employees = list(self.db[EMPLOYEES_COLLECTION].find({}))
            for emp in employees:
                emp["_id"] = str(emp["_id"])
                # Convert face_image_id to string if present
                if emp.get("face_image_id"):
                    emp["face_image_id"] = str(emp["face_image_id"])
            return employees
        except Exception as e:
            logging.error(f"❌ Error getting employees: {e}")
            return []

    async def update_employee(self, employee_id: str, update_data: Dict[str, Any]) -> bool:
        """Update employee data"""
        try:
            if not self.is_connected():
                return False
                
            update_data["updated_at"] = get_local_now()
            result = self.db[EMPLOYEES_COLLECTION].update_one(
                {"employee_id": employee_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logging.error(f"❌ Error updating employee: {e}")
            return False

    async def delete_employee(self, employee_id: str) -> bool:
        """Delete employee and associated face image"""
        try:
            if not self.is_connected():
                return False
                
            # Get employee to find face image ID
            employee = await self.get_employee(employee_id)
            if employee and employee.get("face_image_id"):
                # Delete face image from GridFS
                await self.delete_face_image(employee["face_image_id"])
            
            # Delete employee record
            result = self.db[EMPLOYEES_COLLECTION].delete_one({"employee_id": employee_id})
            
            if result.deleted_count > 0:
                logging.info(f"✅ Employee deleted: {employee_id}")
                return True
            return False
        except Exception as e:
            logging.error(f"❌ Error deleting employee: {e}")
            return False

    # Face Image Operations
    async def store_face_image(self, employee_id: str, image_data: str) -> str:
        """Store face image in GridFS"""
        try:
            if not self.is_connected():
                raise Exception("Database not connected")

            # Decode base64 image
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Store in GridFS
            file_id = self.fs.put(
                image_bytes,
                filename=f"{employee_id}_face.jpg",
                employee_id=employee_id,
                content_type="image/jpeg",
                upload_date=get_local_now()
            )
            
            logging.info(f"✅ Face image stored for employee: {employee_id}")
            return str(file_id)
            
        except Exception as e:
            logging.error(f"❌ Error storing face image: {e}")
            raise

    async def get_face_image(self, image_id: str) -> Optional[bytes]:
        """Retrieve face image from GridFS"""
        try:
            if not self.is_connected():
                return None
                
            file_data = self.fs.get(ObjectId(image_id))
            return file_data.read()
        except Exception as e:
            logging.error(f"❌ Error retrieving face image: {e}")
            return None

    async def delete_face_image(self, image_id: str) -> bool:
        """Delete face image from GridFS"""
        try:
            if not self.is_connected():
                return False
                
            self.fs.delete(ObjectId(image_id))
            return True
        except Exception as e:
            logging.error(f"❌ Error deleting face image: {e}")
            return False

    async def get_all_face_images(self) -> List[Dict[str, Any]]:
        """Get all face images for recognition"""
        try:
            if not self.is_connected():
                return []
                
            images = []
            employees = await self.get_all_employees()
            
            for employee in employees:
                if employee.get("face_image_id") and employee.get("face_enrolled"):
                    image_data = await self.get_face_image(employee["face_image_id"])
                    if image_data:
                        images.append({
                            "employee_id": employee["employee_id"],
                            "name": employee["name"],
                            "image_data": image_data,
                            "image_id": employee["face_image_id"]
                        })
            
            return images
        except Exception as e:
            logging.error(f"❌ Error getting face images: {e}")
            return []

    # Attendance Image Operations
    async def store_attendance_image(self, employee_id: str, attendance_type: str, image_data: str) -> str:
        """Store attendance captured image in GridFS"""
        try:
            if not self.is_connected():
                raise Exception("Database not connected")

            # Decode base64 image
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Store in GridFS with attendance-specific metadata
            file_id = self.fs.put(
                image_bytes,
                filename=f"{employee_id}_{attendance_type}_{get_local_now().strftime('%Y%m%d_%H%M%S')}.jpg",
                employee_id=employee_id,
                attendance_type=attendance_type,
                content_type="image/jpeg",
                upload_date=get_local_now(),
                image_type="attendance"
            )
            
            logging.info(f"✅ Attendance image stored for employee: {employee_id} ({attendance_type})")
            return str(file_id)
            
        except Exception as e:
            logging.error(f"❌ Error storing attendance image: {e}")
            raise

    async def get_attendance_image(self, image_id: str) -> Optional[bytes]:
        """Retrieve attendance image from GridFS"""
        try:
            if not self.is_connected():
                return None
                
            file_data = self.fs.get(ObjectId(image_id))
            return file_data.read()
        except Exception as e:
            logging.error(f"❌ Error retrieving attendance image: {e}")
            return None

    async def get_attendance_by_id(self, attendance_id: str) -> Optional[Dict[str, Any]]:
        """Get attendance record by attendance_id"""
        try:
            if not self.is_connected():
                return None
                
            attendance = self.db[ATTENDANCE_COLLECTION].find_one({"attendance_id": attendance_id})
            if attendance:
                attendance["_id"] = str(attendance["_id"])
            return attendance
        except Exception as e:
            logging.error(f"❌ Error getting attendance by ID: {e}")
            return None

    # Attendance Operations
    async def create_attendance(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create attendance record"""
        try:
            if not self.is_connected():
                raise Exception("Database not connected")

            attendance_data["created_at"] = get_local_now()
            result = self.db[ATTENDANCE_COLLECTION].insert_one(attendance_data)
            
            # Retrieve and return the created record
            attendance = self.db[ATTENDANCE_COLLECTION].find_one({"_id": result.inserted_id})
            attendance["_id"] = str(attendance["_id"])
            
            logging.info(f"✅ Attendance recorded: {attendance_data['employee_name']} - {attendance_data['type']}")
            return attendance

        except Exception as e:
            logging.error(f"❌ Error creating attendance: {e}")
            raise

    async def get_attendance_history(self, limit: int = 50, employee_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get attendance history"""
        try:
            if not self.is_connected():
                return []

            query = {}
            if employee_id:
                query["employee_id"] = employee_id
                
            attendance = list(
                self.db[ATTENDANCE_COLLECTION]
                .find(query)
                .sort("timestamp", -1)
                .limit(limit)
            )
            
            for record in attendance:
                record["_id"] = str(record["_id"])
                
            return attendance
        except Exception as e:
            logging.error(f"❌ Error getting attendance history: {e}")
            return []

    # Database Statistics
    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            if not self.is_connected():
                return {"connected": False}

            total_employees = self.db[EMPLOYEES_COLLECTION].count_documents({})
            enrolled_employees = self.db[EMPLOYEES_COLLECTION].count_documents({"face_enrolled": True})
            total_attendance = self.db[ATTENDANCE_COLLECTION].count_documents({})
            
            # Today's attendance
            today_start = get_local_date_start()
            today_attendance = self.db[ATTENDANCE_COLLECTION].count_documents({
                "timestamp": {"$gte": today_start}
            })

            return {
                "connected": True,
                "total_employees": total_employees,
                "enrolled_employees": enrolled_employees,
                "total_attendance": total_attendance,
                "today_attendance": today_attendance,
                "database_name": DATABASE_NAME,
                "mongodb_url": MONGODB_URL.replace("mongodb://", "").split("@")[-1] if "@" in MONGODB_URL else MONGODB_URL.replace("mongodb://", "")
            }
        except Exception as e:
            logging.error(f"❌ Error getting stats: {e}")
            return {"connected": False, "error": str(e)}

# Global database instance
db_manager = DatabaseManager()

# Helper functions for backward compatibility
async def init_database():
    """Initialize database connection"""
    return db_manager.connect()

async def close_database():
    """Close database connection"""
    db_manager.disconnect()

def get_database():
    """Get database instance"""
    return db_manager 