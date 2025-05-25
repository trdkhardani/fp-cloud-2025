"""
Face Recognition API Backend using FastAPI, DeepFace, and MongoDB
Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import cv2
import numpy as np
import base64
import os
import uuid
import json
import tempfile
from datetime import datetime
import logging

# Database imports
from database import db_manager, get_database

# Import DeepFace
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    print("✅ DeepFace loaded successfully")
except ImportError as e:
    DEEPFACE_AVAILABLE = False
    print(f"❌ DeepFace not available: {e}")
    print("Install with: pip install deepface")

app = FastAPI(title="FaceAttend API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080", 
        "http://localhost:8082", 
        "http://localhost:3000",
        "http://frontend",  # Docker service name
        "http://frontend:80",  # Docker service with port
        os.getenv("FRONTEND_URL", "http://localhost"),  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Employee(BaseModel):
    id: str
    name: str
    department: Optional[str] = None
    email: Optional[str] = None
    face_enrolled: Optional[bool] = False

class AttendanceRecord(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    type: str  # "check-in" or "check-out"
    timestamp: str
    confidence: float
    image_url: Optional[str] = None

class RecognitionResult(BaseModel):
    success: bool
    employee: Optional[Employee] = None
    confidence: Optional[float] = None
    message: Optional[str] = None
    timestamp: str

class DeepFaceConfig(BaseModel):
    model_name: str = "VGG-Face"  # VGG-Face, Facenet, OpenFace, DeepFace, DeepID, ArcFace, Dlib, SFace
    distance_metric: str = "cosine"  # cosine, euclidean, euclidean_l2
    detector_backend: str = "opencv"  # opencv, ssd, dlib, mtcnn, retinaface, mediapipe
    enforce_detection: bool = True
    confidence_threshold: float = 0.85
    align: bool = True

# Global configuration
config = DeepFaceConfig()

# Directories for temporary files
TEMP_DIR = "temp_images"
CONFIG_FILE = "deepface_config.json"

os.makedirs(TEMP_DIR, exist_ok=True)

# Load configuration
def load_config():
    global config
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config_data = json.load(f)
                config = DeepFaceConfig(**config_data)
            print(f"✅ Configuration loaded: {config.model_name}")
    except Exception as e:
        print(f"⚠️ Error loading config: {e}, using defaults")

def save_config():
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config.dict(), f, indent=2)
        print("✅ Configuration saved")
    except Exception as e:
        print(f"❌ Error saving config: {e}")

# Load config on startup
load_config()

# Database startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    success = db_manager.connect()
    if success:
        print("✅ Database connected successfully")
    else:
        print("⚠️ Database connection failed - will use fallback mode")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    db_manager.disconnect()

# Helper functions
def save_temp_image(image_data: str) -> str:
    """Save base64 image data to temporary file"""
    try:
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        temp_path = os.path.join(TEMP_DIR, temp_filename)
        
        with open(temp_path, 'wb') as f:
            f.write(image_bytes)
        
        return temp_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save temp image: {str(e)}")

def cleanup_temp_file(file_path: str):
    """Clean up temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Warning: Could not cleanup temp file {file_path}: {e}")

def verify_face_in_image(image_path: str) -> bool:
    """Verify that there's a valid face in the image"""
    try:
        if not DEEPFACE_AVAILABLE:
            return True  # Skip verification if DeepFace not available
            
        # Try to detect faces
        faces = DeepFace.extract_faces(
            img_path=image_path,
            detector_backend=config.detector_backend,
            enforce_detection=False
        )
        return len(faces) > 0
    except Exception as e:
        print(f"Face verification error: {e}")
        return False

# API Endpoints
@app.get("/")
async def root():
    db_stats = await db_manager.get_stats()
    return {
        "message": "FaceAttend API is running",
        "version": "1.0.0",
        "deepface_available": DEEPFACE_AVAILABLE,
        "current_model": config.model_name,
        "database": db_stats
    }

@app.get("/api/config", response_model=DeepFaceConfig)
async def get_config():
    """Get current DeepFace configuration"""
    return config

@app.post("/api/config", response_model=DeepFaceConfig)
async def update_config(new_config: DeepFaceConfig):
    """Update DeepFace configuration"""
    try:
        global config
        
        # Validate model name
        valid_models = ["VGG-Face", "Facenet", "OpenFace", "DeepFace", "DeepID", "ArcFace", "Dlib", "SFace"]
        if new_config.model_name not in valid_models:
            raise HTTPException(status_code=400, detail=f"Invalid model. Must be one of: {valid_models}")
        
        # Validate distance metric
        valid_metrics = ["cosine", "euclidean", "euclidean_l2"]
        if new_config.distance_metric not in valid_metrics:
            raise HTTPException(status_code=400, detail=f"Invalid distance metric. Must be one of: {valid_metrics}")
        
        # Validate detector backend
        valid_detectors = ["opencv", "ssd", "dlib", "mtcnn", "retinaface", "mediapipe"]
        if new_config.detector_backend not in valid_detectors:
            raise HTTPException(status_code=400, detail=f"Invalid detector. Must be one of: {valid_detectors}")
        
        config = new_config
        save_config()
        
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def get_available_models():
    """Get available DeepFace models and settings"""
    return {
        "models": ["VGG-Face", "Facenet", "OpenFace", "DeepFace", "DeepID", "ArcFace", "Dlib", "SFace"],
        "distance_metrics": ["cosine", "euclidean", "euclidean_l2"],
        "detector_backends": ["opencv", "ssd", "dlib", "mtcnn", "retinaface", "mediapipe"],
        "deepface_available": DEEPFACE_AVAILABLE
    }

@app.post("/api/recognize-face", response_model=RecognitionResult)
async def recognize_face(file: UploadFile = File(...)):
    """Recognize face from uploaded image"""
    temp_path = None
    temp_files = []
    
    try:
        if not DEEPFACE_AVAILABLE:
            return RecognitionResult(
                success=False,
                message="DeepFace is not available. Please install: pip install deepface",
                timestamp=datetime.now().isoformat()
            )

        # Save uploaded file temporarily
        temp_path = os.path.join(TEMP_DIR, f"recognition_{uuid.uuid4()}.jpg")
        temp_files.append(temp_path)
        
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Verify there's a face in the image
        if not verify_face_in_image(temp_path):
            return RecognitionResult(
                success=False,
                message="No face detected in the image",
                timestamp=datetime.now().isoformat()
            )

        # Get all enrolled face images from database
        face_images = await db_manager.get_all_face_images()
        
        if not face_images:
            return RecognitionResult(
                success=False,
                message="No enrolled faces found. Please enroll employees first.",
                timestamp=datetime.now().isoformat()
            )

        # Create temporary face database for recognition
        face_db_dir = os.path.join(TEMP_DIR, f"face_db_{uuid.uuid4()}")
        os.makedirs(face_db_dir, exist_ok=True)
        
        try:
            # Save all face images to temporary directory
            for face_data in face_images:
                face_file_path = os.path.join(face_db_dir, f"{face_data['employee_id']}_face.jpg")
                with open(face_file_path, 'wb') as f:
                    f.write(face_data['image_data'])
                temp_files.append(face_file_path)

            # Perform face recognition
            result = DeepFace.find(
                img_path=temp_path,
                db_path=face_db_dir,
                model_name=config.model_name,
                distance_metric=config.distance_metric,
                detector_backend=config.detector_backend,
                enforce_detection=config.enforce_detection,
                align=config.align,
                silent=True
            )

            if len(result) > 0 and not result[0].empty:
                # Face found - extract employee info
                best_match = result[0].iloc[0]
                identity_path = best_match['identity']
                
                # Try to get distance from different possible column names
                distance = None
                possible_distance_columns = [config.distance_metric, 'distance', f'{config.distance_metric}_distance']
                
                for col_name in possible_distance_columns:
                    if col_name in best_match.index:
                        distance = best_match[col_name]
                        break
                
                if distance is None:
                    # Fallback: use the last numeric column (usually the distance)
                    numeric_columns = [col for col in best_match.index if isinstance(best_match[col], (int, float))]
                    if numeric_columns:
                        distance = best_match[numeric_columns[-1]]
                    else:
                        distance = 0.5
                        print(f"⚠️ Could not find distance column. Available columns: {list(best_match.index)}")
                
                # Convert distance to confidence based on metric type
                if config.distance_metric == "cosine":
                    confidence = (1 - distance) * 100
                elif config.distance_metric in ["euclidean", "euclidean_l2"]:
                    confidence = max(0, (1 - min(distance, 2) / 2) * 100)
                else:
                    confidence = max(0, (1 - distance) * 100)
                
                # Ensure confidence is within valid range
                confidence = max(0, min(100, confidence))
                
                if confidence >= config.confidence_threshold * 100:
                    # Extract employee ID from filename
                    filename_base = os.path.basename(identity_path)
                    employee_id = filename_base.split('_')[0]
                    
                    # Find employee in database
                    employee_data = await db_manager.get_employee(employee_id)
                    
                    if employee_data:
                        employee = Employee(
                            id=employee_data["employee_id"],
                            name=employee_data["name"],
                            department=employee_data.get("department"),
                            email=employee_data.get("email"),
                            face_enrolled=employee_data.get("face_enrolled", False)
                        )
                        
                        return RecognitionResult(
                            success=True,
                            employee=employee,
                            confidence=round(confidence, 2),
                            timestamp=datetime.now().isoformat()
                        )

            return RecognitionResult(
                success=False,
                message=f"Face not recognized or confidence below {config.confidence_threshold * 100}%",
                timestamp=datetime.now().isoformat()
            )

        finally:
            # Clean up temporary face database
            try:
                import shutil
                if os.path.exists(face_db_dir):
                    shutil.rmtree(face_db_dir)
            except Exception as e:
                print(f"Warning: Could not cleanup face database: {e}")

    except Exception as e:
        error_message = str(e)
        logging.error(f"Face recognition error: {error_message}")
        
        # Provide more specific error messages
        if "No face could be detected" in error_message:
            return RecognitionResult(
                success=False,
                message="No face detected in the image. Please ensure good lighting and face visibility.",
                timestamp=datetime.now().isoformat()
            )
        elif "Face recognition model" in error_message:
            return RecognitionResult(
                success=False,
                message=f"Face recognition model error. Try changing the model in settings.",
                timestamp=datetime.now().isoformat()
            )
        else:
            return RecognitionResult(
                success=False,
                message=f"Recognition failed: {error_message}",
                timestamp=datetime.now().isoformat()
            )
    
    finally:
        # Clean up all temporary files
        for temp_file in temp_files:
            cleanup_temp_file(temp_file)

@app.post("/api/attendance", response_model=AttendanceRecord)
async def record_attendance(
    employee_id: str = Form(...),
    type: str = Form(...),
    confidence: float = Form(...)
):
    """Record attendance for an employee"""
    try:
        # Find employee in database
        employee_data = await db_manager.get_employee(employee_id)
        if not employee_data:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Create attendance record
        attendance_data = {
            "attendance_id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "employee_name": employee_data["name"],
            "type": type,
            "timestamp": datetime.now(),
            "confidence": confidence
        }
        
        # Store in database
        attendance_record = await db_manager.create_attendance(attendance_data)
        
        # Convert to response format
        return AttendanceRecord(
            id=attendance_record["attendance_id"],
            employee_id=attendance_record["employee_id"],
            employee_name=attendance_record["employee_name"],
            type=attendance_record["type"],
            timestamp=attendance_record["timestamp"].isoformat(),
            confidence=attendance_record["confidence"]
        )
        
    except Exception as e:
        logging.error(f"Attendance recording error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/attendance", response_model=List[AttendanceRecord])
async def get_attendance_history(limit: int = 50):
    """Get attendance history"""
    try:
        attendance_records = await db_manager.get_attendance_history(limit=limit)
        
        # Convert to response format
        return [
            AttendanceRecord(
                id=record.get("attendance_id", str(record.get("_id", ""))),
                employee_id=record["employee_id"],
                employee_name=record["employee_name"],
                type=record["type"],
                timestamp=record["timestamp"].isoformat() if isinstance(record["timestamp"], datetime) else record["timestamp"],
                confidence=record["confidence"]
            )
            for record in attendance_records
        ]
    except Exception as e:
        logging.error(f"Error getting attendance history: {str(e)}")
        return []

@app.get("/api/employees", response_model=List[Employee])
async def get_employees():
    """Get all employees"""
    try:
        employees_data = await db_manager.get_all_employees()
        
        # Convert to response format
        return [
            Employee(
                id=emp["employee_id"],
                name=emp["name"],
                department=emp.get("department"),
                email=emp.get("email"),
                face_enrolled=emp.get("face_enrolled", False)
            )
            for emp in employees_data
        ]
    except Exception as e:
        logging.error(f"Error getting employees: {str(e)}")
        return []

@app.post("/api/employees/enroll", response_model=Employee)
async def enroll_employee(
    name: str = Form(...),
    department: str = Form(""),
    email: str = Form(""),
    file: UploadFile = File(...)
):
    """Enroll a new employee with their face"""
    temp_path = None
    
    try:
        # Validate input
        if not name.strip():
            raise HTTPException(status_code=400, detail="Employee name is required")
        
        if not DEEPFACE_AVAILABLE:
            raise HTTPException(status_code=500, detail="DeepFace is not available")
        
        # Generate employee ID
        existing_employees = await db_manager.get_all_employees()
        employee_id = f"EMP{len(existing_employees) + 1:03d}"
        
        # Save uploaded file temporarily
        temp_path = os.path.join(TEMP_DIR, f"enroll_{uuid.uuid4()}.jpg")
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Verify there's a valid face in the image
        if not verify_face_in_image(temp_path):
            raise HTTPException(status_code=400, detail="No valid face detected in the image")
        
        # Read image data for storage
        with open(temp_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Create employee data
        employee_data = {
            "employee_id": employee_id,
            "name": name,
            "department": department if department else None,
            "email": email if email else None,
            "face_enrolled": True
        }
        
        # Store employee and face image in database
        created_employee = await db_manager.create_employee(employee_data, image_data)
        
        # Convert to response format
        return Employee(
            id=created_employee["employee_id"],
            name=created_employee["name"],
            department=created_employee.get("department"),
            email=created_employee.get("email"),
            face_enrolled=created_employee.get("face_enrolled", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Employee enrollment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")
    
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)

@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str):
    """Delete an employee and their face data"""
    try:
        # Check if employee exists
        employee = await db_manager.get_employee(employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Delete employee (will also delete associated face image)
        success = await db_manager.delete_employee(employee_id)
        
        if success:
            return {"message": f"Employee {employee['name']} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete employee")
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Employee deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_stats = await db_manager.get_stats()
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "deepface_available": DEEPFACE_AVAILABLE,
        "config": config.dict(),
        "database": db_stats
    }

# Debug endpoint for troubleshooting
@app.post("/api/debug-face")
async def debug_face_recognition(file: UploadFile = File(...)):
    """Debug face recognition - shows detailed information about the process"""
    temp_path = None
    temp_files = []
    
    try:
        if not DEEPFACE_AVAILABLE:
            return {"error": "DeepFace is not available"}
        
        # Save uploaded file
        temp_path = os.path.join(TEMP_DIR, f"debug_{uuid.uuid4()}.jpg")
        temp_files.append(temp_path)
        
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        debug_info = {
            "config": config.dict(),
            "steps": [],
            "database_stats": await db_manager.get_stats()
        }
        
        # Step 1: Face detection
        try:
            faces = DeepFace.extract_faces(
                img_path=temp_path,
                detector_backend=config.detector_backend,
                enforce_detection=False
            )
            debug_info["steps"].append({
                "step": "face_detection",
                "success": True,
                "faces_found": len(faces)
            })
        except Exception as e:
            debug_info["steps"].append({
                "step": "face_detection",
                "success": False,
                "error": str(e)
            })
            return debug_info
        
        # Step 2: Get enrolled faces
        face_images = await db_manager.get_all_face_images()
        debug_info["enrolled_faces"] = len(face_images)
        
        if not face_images:
            debug_info["steps"].append({
                "step": "face_recognition",
                "success": False,
                "error": "No enrolled faces in database"
            })
            return debug_info
        
        # Step 3: Face recognition (simplified test)
        try:
            debug_info["steps"].append({
                "step": "database_faces_loaded",
                "success": True,
                "count": len(face_images)
            })
            
            # Just test if we can process the uploaded image
            embedding = DeepFace.represent(
                img_path=temp_path,
                model_name=config.model_name,
                detector_backend=config.detector_backend,
                enforce_detection=config.enforce_detection,
                align=config.align
            )
            
            debug_info["steps"].append({
                "step": "embedding_generation",
                "success": True,
                "embedding_size": len(embedding[0]["embedding"])
            })
            
        except Exception as e:
            debug_info["steps"].append({
                "step": "face_processing", 
                "success": False,
                "error": str(e)
            })
        
        return debug_info
        
    except Exception as e:
        return {"error": f"Debug failed: {str(e)}"}
    
    finally:
        for temp_file in temp_files:
            cleanup_temp_file(temp_file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 