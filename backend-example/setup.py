#!/usr/bin/env python3
"""
FaceAttend Backend Setup Script with MongoDB Support
This script sets up the complete FaceAttend backend environment including MongoDB.
"""

import sys
import subprocess
import os
import platform
import importlib.util
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n🔧 Step {step}: {description}")
    print("-" * 50)

def run_command(command, description, capture_output=False):
    """Run a command and handle errors"""
    print(f"  ➤ {description}")
    try:
        if capture_output:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            return result.returncode == 0, result.stdout, result.stderr
        else:
            result = subprocess.run(command, shell=True)
            return result.returncode == 0, "", ""
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False, "", str(e)

def check_python_version():
    """Check if Python version is compatible"""
    print_step(1, "Checking Python Version")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"  ❌ Python {version.major}.{version.minor} detected")
        print("  ⚠️  Python 3.8 or higher is required")
        return False
    
    print(f"  ✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_mongodb():
    """Check if MongoDB is installed and running"""
    print_step(2, "Checking MongoDB Installation")
    
    # Check if MongoDB is installed
    success, stdout, stderr = run_command("mongod --version", "Checking MongoDB installation", capture_output=True)
    
    if not success:
        print("  ❌ MongoDB not found")
        print("\n  📖 MongoDB Installation Guide:")
        
        system = platform.system().lower()
        if system == "darwin":  # macOS
            print("  For macOS (using Homebrew):")
            print("    brew tap mongodb/brew")
            print("    brew install mongodb-community")
            print("    brew services start mongodb/brew/mongodb-community")
        elif system == "linux":
            print("  For Ubuntu/Debian:")
            print("    sudo apt update")
            print("    sudo apt install -y mongodb-org")
            print("    sudo systemctl start mongod")
            print("    sudo systemctl enable mongod")
        elif system == "windows":
            print("  For Windows:")
            print("    Download from: https://www.mongodb.com/try/download/community")
            print("    Install and start the MongoDB service")
        
        print("\n  Or use MongoDB Atlas (cloud):")
        print("    1. Sign up at https://www.mongodb.com/cloud/atlas")
        print("    2. Create a free cluster")
        print("    3. Get your connection string")
        print("    4. Set MONGODB_URL environment variable")
        
        return False
    
    print(f"  ✅ MongoDB found")
    
    # Check if MongoDB is running
    success, stdout, stderr = run_command("mongosh --eval 'db.runCommand({ping: 1})' --quiet", "Testing MongoDB connection", capture_output=True)
    
    if not success:
        print("  ⚠️  MongoDB installed but not running")
        print("  💡 Try starting MongoDB:")
        
        system = platform.system().lower()
        if system == "darwin":
            print("    brew services start mongodb/brew/mongodb-community")
        elif system == "linux":
            print("    sudo systemctl start mongod")
        elif system == "windows":
            print("    net start MongoDB")
        
        return False
    
    print("  ✅ MongoDB is running")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print_step(3, "Installing Python Dependencies")
    
    # Upgrade pip first
    success, _, _ = run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip")
    if not success:
        print("  ⚠️  Could not upgrade pip, continuing...")
    
    # Install requirements
    if os.path.exists("requirements.txt"):
        success, _, _ = run_command(f"{sys.executable} -m pip install -r requirements.txt", "Installing dependencies from requirements.txt")
        if not success:
            print("  ❌ Failed to install dependencies")
            return False
        print("  ✅ Dependencies installed successfully")
    else:
        print("  ❌ requirements.txt not found")
        return False
    
    return True

def test_imports():
    """Test if all required packages can be imported"""
    print_step(4, "Testing Package Imports")
    
    packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("pymongo", "PyMongo"),
        ("gridfs", "GridFS"),
        ("cv2", "OpenCV"),
        ("numpy", "NumPy"),
        ("PIL", "Pillow"),
        ("deepface", "DeepFace")
    ]
    
    all_success = True
    for package, name in packages:
        try:
            __import__(package)
            print(f"  ✅ {name}")
        except ImportError as e:
            print(f"  ❌ {name} - {e}")
            all_success = False
    
    return all_success

def test_database_connection():
    """Test database connection and operations"""
    print_step(5, "Testing Database Connection")
    
    try:
        # Test database import
        from database import db_manager
        print("  ✅ Database module imported")
        
        # Test connection
        success = db_manager.connect()
        if not success:
            print("  ❌ Could not connect to MongoDB")
            print("  💡 Make sure MongoDB is running or set MONGODB_URL environment variable")
            return False
        
        print("  ✅ Database connection successful")
        
        # Test basic operations
        try:
            stats = db_manager.db.command("ping")
            print("  ✅ Database ping successful")
        except Exception as e:
            print(f"  ❌ Database ping failed: {e}")
            return False
        
        # Check collections can be created
        try:
            collections = db_manager.db.list_collection_names()
            print(f"  ✅ Database access successful (collections: {len(collections)})")
        except Exception as e:
            print(f"  ❌ Database access failed: {e}")
            return False
        
        db_manager.disconnect()
        print("  ✅ Database test completed")
        return True
        
    except Exception as e:
        print(f"  ❌ Database test failed: {e}")
        return False

def test_deepface():
    """Test DeepFace functionality"""
    print_step(6, "Testing DeepFace")
    
    try:
        from deepface import DeepFace
        print("  ✅ DeepFace imported successfully")
        
        # Test model loading (this might take a while on first run)
        print("  🔄 Testing model initialization (this may take a moment)...")
        
        try:
            # Create a small test image
            import numpy as np
            from PIL import Image
            import tempfile
            
            # Create a simple test image
            test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                Image.fromarray(test_image).save(tmp.name)
                temp_path = tmp.name
            
            try:
                # Test face extraction (should not find faces in random image)
                faces = DeepFace.extract_faces(temp_path, enforce_detection=False)
                print(f"  ✅ DeepFace face extraction test completed")
                
                # Test representation
                embedding = DeepFace.represent(temp_path, enforce_detection=False)
                print(f"  ✅ DeepFace representation test completed")
                
            finally:
                os.unlink(temp_path)
                
        except Exception as e:
            print(f"  ⚠️  DeepFace test warning: {e}")
            print("  💡 This might be normal for the first run - models need to download")
        
        return True
        
    except ImportError as e:
        print(f"  ❌ DeepFace import failed: {e}")
        print("  💡 Try: pip install deepface tensorflow")
        return False
    except Exception as e:
        print(f"  ❌ DeepFace test failed: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    print_step(7, "Creating Directories")
    
    directories = [
        "temp_images",
        "logs"
    ]
    
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"  ✅ Created/verified directory: {directory}")
        except Exception as e:
            print(f"  ❌ Failed to create directory {directory}: {e}")
            return False
    
    return True

def create_env_file():
    """Create environment file with MongoDB settings"""
    print_step(8, "Creating Environment Configuration")
    
    env_content = """# FaceAttend Backend Configuration

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=faceattend

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# DeepFace Configuration
DEFAULT_MODEL=VGG-Face
DEFAULT_DETECTOR=opencv
DEFAULT_DISTANCE_METRIC=cosine

# Logging
LOG_LEVEL=INFO
"""
    
    try:
        with open(".env", "w") as f:
            f.write(env_content)
        print("  ✅ Environment file created (.env)")
        print("  💡 You can customize these settings in the .env file")
        return True
    except Exception as e:
        print(f"  ❌ Failed to create .env file: {e}")
        return False

def run_server():
    """Start the server"""
    print_step(9, "Starting Server")
    
    print("  🚀 Starting FaceAttend API server...")
    print("  📡 Server will be available at: http://localhost:8000")
    print("  📖 API Documentation: http://localhost:8000/docs")
    print("  🛑 Press Ctrl+C to stop the server")
    print("")
    
    try:
        success, _, _ = run_command(f"{sys.executable} -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload", "Starting server")
        return success
    except KeyboardInterrupt:
        print("\n  🛑 Server stopped by user")
        return True
    except Exception as e:
        print(f"  ❌ Failed to start server: {e}")
        return False

def main():
    """Main setup function"""
    print_header("FaceAttend Backend Setup with MongoDB")
    print("This script will set up your FaceAttend backend environment.")
    print("Please ensure you have MongoDB installed and running.")
    
    # Track success of each step
    steps = [
        ("Python Version Check", check_python_version),
        ("MongoDB Check", check_mongodb),
        ("Dependencies Installation", install_dependencies),
        ("Package Import Test", test_imports),
        ("Database Connection Test", test_database_connection),
        ("DeepFace Test", test_deepface),
        ("Directory Creation", create_directories),
        ("Environment Configuration", create_env_file),
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                failed_steps.append(step_name)
        except Exception as e:
            print(f"  ❌ Unexpected error in {step_name}: {e}")
            failed_steps.append(step_name)
    
    # Summary
    print_header("Setup Summary")
    
    if failed_steps:
        print("❌ Setup completed with issues:")
        for step in failed_steps:
            print(f"   • {step}")
        print("\n💡 Please resolve the above issues before starting the server.")
        print("📖 Check the documentation for troubleshooting tips.")
        return False
    else:
        print("✅ All setup steps completed successfully!")
        print("\n🎉 FaceAttend backend is ready!")
        print("\n📋 Quick Start:")
        print("   • MongoDB database: Ready")
        print("   • Face recognition: Ready")
        print("   • API endpoints: Ready")
        print("\n🚀 To start the server:")
        print("   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
        
        # Ask if user wants to start server now
        try:
            response = input("\n❓ Start the server now? (y/N): ").strip().lower()
            if response in ['y', 'yes']:
                run_server()
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
        
        return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n👋 Setup interrupted by user. Goodbye!")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error during setup: {e}")
        sys.exit(1) 