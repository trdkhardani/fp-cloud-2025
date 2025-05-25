"""
Face Recognition API Backend using FastAPI and DeepFace
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
from datetime import datetime
import logging
import pandas as pd

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

# Enable CORS for your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
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

# In-memory storage (replace with database in production)
employees_db = []
attendance_db = []

# Directories for storing face data
FACE_DB_DIR = "face_database"
UPLOADS_DIR = "uploads"
CONFIG_FILE = "deepface_config.json"

os.makedirs(FACE_DB_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

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

# Helper functions
def save_uploaded_file(file: UploadFile, filename: str) -> str:
    """Save uploaded file and return path"""
    try:
        file_path = os.path.join(UPLOADS_DIR, filename)
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
        return file_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

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

def get_face_embedding(image_path: str) -> Optional[np.ndarray]:
    """Get face embedding for the image"""
    try:
        if not DEEPFACE_AVAILABLE:
            return None
            
        embedding = DeepFace.represent(
            img_path=image_path,
            model_name=config.model_name,
            detector_backend=config.detector_backend,
            enforce_detection=config.enforce_detection,
            align=config.align
        )
        return np.array(embedding[0]["embedding"])
    except Exception as e:
        print(f"Embedding error: {e}")
        return None

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "FaceAttend API is running",
        "version": "1.0.0",
        "deepface_available": DEEPFACE_AVAILABLE,
        "current_model": config.model_name
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
    file_path = None
    try:
        if not DEEPFACE_AVAILABLE:
            return RecognitionResult(
                success=False,
                message="DeepFace is not available. Please install: pip install deepface",
                timestamp=datetime.now().isoformat()
            )
        
        # Save uploaded file
        filename = f"temp_{uuid.uuid4()}.jpg"
        file_path = save_uploaded_file(file, filename)
        
        # Verify there's a face in the image
        if not verify_face_in_image(file_path):
            return RecognitionResult(
                success=False,
                message="No face detected in the image",
                timestamp=datetime.now().isoformat()
            )
        
        # Check if we have any enrolled faces
        if not os.listdir(FACE_DB_DIR):
            return RecognitionResult(
                success=False,
                message="No enrolled faces found. Please enroll employees first.",
                timestamp=datetime.now().isoformat()
            )
        
        # Find face in database
        result = DeepFace.find(
            img_path=file_path,
            db_path=FACE_DB_DIR,
            model_name=config.model_name,
            distance_metric=config.distance_metric,
            detector_backend=config.detector_backend,
            enforce_detection=config.enforce_detection,
            align=config.align,
            silent=True
        )
        
        if len(result) > 0 and not result[0].empty:
            # Face found - extract employee info from filename/path
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
                    # Default to a medium distance if we can't find it
                    distance = 0.5
                    print(f"⚠️ Could not find distance column. Available columns: {list(best_match.index)}")
            
            # Convert distance to confidence based on metric type
            if config.distance_metric == "cosine":
                confidence = (1 - distance) * 100
            elif config.distance_metric in ["euclidean", "euclidean_l2"]:
                # For euclidean metrics, smaller distance = higher confidence
                # Normalize roughly (this may need adjustment based on your data)
                confidence = max(0, (1 - min(distance, 2) / 2) * 100)
            else:
                # Default handling for unknown metrics
                confidence = max(0, (1 - distance) * 100)
            
            # Ensure confidence is within valid range
            confidence = max(0, min(100, confidence))
            
            if confidence >= config.confidence_threshold * 100:
                # Extract employee ID from filename
                filename_base = os.path.basename(identity_path)
                employee_id = filename_base.split('_')[0]
                
                # Find employee in database
                employee = next((emp for emp in employees_db if emp.id == employee_id), None)
                
                if employee:
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
        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error removing temp file: {e}")

@app.post("/api/attendance", response_model=AttendanceRecord)
async def record_attendance(
    employee_id: str = Form(...),
    type: str = Form(...),
    confidence: float = Form(...)
):
    """Record attendance for an employee"""
    try:
        # Find employee
        employee = next((emp for emp in employees_db if emp.id == employee_id), None)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Create attendance record
        attendance_record = AttendanceRecord(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            employee_name=employee.name,
            type=type,
            timestamp=datetime.now().isoformat(),
            confidence=confidence
        )
        
        # Store in database
        attendance_db.append(attendance_record)
        
        return attendance_record
        
    except Exception as e:
        logging.error(f"Attendance recording error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/attendance", response_model=List[AttendanceRecord])
async def get_attendance_history(limit: int = 50):
    """Get attendance history"""
    return sorted(attendance_db, key=lambda x: x.timestamp, reverse=True)[:limit]

@app.get("/api/employees", response_model=List[Employee])
async def get_employees():
    """Get all employees"""
    return employees_db

@app.post("/api/employees/enroll", response_model=Employee)
async def enroll_employee(
    name: str = Form(...),
    department: str = Form(""),
    email: str = Form(""),
    file: UploadFile = File(...)
):
    """Enroll a new employee with their face"""
    face_path = None
    try:
        # Validate input
        if not name.strip():
            raise HTTPException(status_code=400, detail="Employee name is required")
        
        if not DEEPFACE_AVAILABLE:
            raise HTTPException(status_code=500, detail="DeepFace is not available")
        
        # Generate employee ID
        employee_id = f"EMP{len(employees_db) + 1:03d}"
        
        # Save face image temporarily for verification
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        temp_path = save_uploaded_file(file, temp_filename)
        
        # Verify there's a valid face in the image
        if not verify_face_in_image(temp_path):
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="No valid face detected in the image")
        
        # Save face image for future recognition
        face_filename = f"{employee_id}_{name.replace(' ', '_').replace('/', '_')}.jpg"
        face_path = os.path.join(FACE_DB_DIR, face_filename)
        
        # Copy temp file to face database
        import shutil
        shutil.move(temp_path, face_path)
        
        # Test if we can generate embedding (validation)
        if get_face_embedding(face_path) is None:
            if os.path.exists(face_path):
                os.remove(face_path)
            raise HTTPException(status_code=400, detail="Failed to process face embedding")
        
        # Create employee record
        new_employee = Employee(
            id=employee_id,
            name=name,
            department=department if department else None,
            email=email if email else None,
            face_enrolled=True
        )
        
        # Add to database
        employees_db.append(new_employee)
        
        print(f"✅ Employee enrolled: {name} ({employee_id})")
        return new_employee
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if face_path and os.path.exists(face_path):
            os.remove(face_path)
        logging.error(f"Employee enrollment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")

@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str):
    """Delete an employee and their face data"""
    try:
        # Find employee
        employee = next((emp for emp in employees_db if emp.id == employee_id), None)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Remove face file
        for filename in os.listdir(FACE_DB_DIR):
            if filename.startswith(f"{employee_id}_"):
                face_path = os.path.join(FACE_DB_DIR, filename)
                os.remove(face_path)
                break
        
        # Remove from database
        employees_db.remove(employee)
        
        return {"message": f"Employee {employee.name} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Employee deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/debug-face")
async def debug_face_recognition(file: UploadFile = File(...)):
    """Debug face recognition - shows detailed information about the process"""
    file_path = None
    try:
        if not DEEPFACE_AVAILABLE:
            return {"error": "DeepFace is not available"}
        
        # Save uploaded file
        filename = f"debug_{uuid.uuid4()}.jpg"
        file_path = save_uploaded_file(file, filename)
        
        debug_info = {
            "config": config.dict(),
            "face_db_files": os.listdir(FACE_DB_DIR) if os.path.exists(FACE_DB_DIR) else [],
            "steps": []
        }
        
        # Step 1: Face detection
        try:
            faces = DeepFace.extract_faces(
                img_path=file_path,
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
        
        # Step 2: Face recognition
        if not os.listdir(FACE_DB_DIR):
            debug_info["steps"].append({
                "step": "face_recognition",
                "success": False,
                "error": "No enrolled faces in database"
            })
            return debug_info
        
        try:
            result = DeepFace.find(
                img_path=file_path,
                db_path=FACE_DB_DIR,
                model_name=config.model_name,
                distance_metric=config.distance_metric,
                detector_backend=config.detector_backend,
                enforce_detection=config.enforce_detection,
                align=config.align,
                silent=True
            )
            
            if len(result) > 0 and not result[0].empty:
                best_match = result[0].iloc[0]
                debug_info["steps"].append({
                    "step": "face_recognition",
                    "success": True,
                    "result_columns": list(best_match.index),
                    "result_data": {col: str(val) for col, val in best_match.items()},
                    "identity": best_match['identity'] if 'identity' in best_match.index else "Not found"
                })
            else:
                debug_info["steps"].append({
                    "step": "face_recognition",
                    "success": True,
                    "result": "No matches found"
                })
                
        except Exception as e:
            debug_info["steps"].append({
                "step": "face_recognition", 
                "success": False,
                "error": str(e)
            })
        
        return debug_info
        
    except Exception as e:
        return {"error": f"Debug failed: {str(e)}"}
    
    finally:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "deepface_available": DEEPFACE_AVAILABLE,
        "enrolled_employees": len(employees_db),
        "config": config.dict()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 