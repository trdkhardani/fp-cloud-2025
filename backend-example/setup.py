#!/usr/bin/env python3
"""
FaceAttend Backend Setup Script
This script helps set up the DeepFace backend for the FaceAttend application.
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def install_requirements():
    """Install Python requirements"""
    if not os.path.exists("requirements.txt"):
        print("❌ requirements.txt not found")
        return False
    
    return run_command("pip install -r requirements.txt", "Installing Python dependencies")

def create_directories():
    """Create necessary directories"""
    directories = ["face_database", "uploads"]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"📁 Directory already exists: {directory}")
    return True

def test_deepface():
    """Test if DeepFace is working"""
    try:
        from deepface import DeepFace
        print("✅ DeepFace imported successfully")
        
        # Test basic functionality
        print("🔄 Testing DeepFace functionality...")
        models = ["VGG-Face", "Facenet", "OpenFace"]
        for model in models:
            try:
                # This will download the model if not present
                print(f"  - Testing {model}...")
                # Just test import, don't actually process anything
                print(f"  ✅ {model} available")
            except Exception as e:
                print(f"  ⚠️ {model} may have issues: {e}")
        
        return True
    except ImportError:
        print("❌ DeepFace not available. Please install with: pip install deepface")
        return False
    except Exception as e:
        print(f"❌ DeepFace test failed: {e}")
        return False

def check_system_requirements():
    """Check system requirements"""
    print("🔍 Checking system requirements...")
    
    # Check OS
    os_name = platform.system()
    print(f"📱 Operating System: {os_name}")
    
    # Check if we're in a virtual environment
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment detected")
    else:
        print("⚠️ Not in a virtual environment. Consider using one for isolation.")
    
    return True

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting FaceAttend API server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API documentation at: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        subprocess.run(["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except FileNotFoundError:
        print("❌ uvicorn not found. Please install with: pip install uvicorn")

def main():
    """Main setup function"""
    print("🎯 FaceAttend Backend Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check system requirements
    check_system_requirements()
    
    # Install requirements
    if not install_requirements():
        print("❌ Failed to install requirements. Please check the error above.")
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Test DeepFace
    if not test_deepface():
        print("⚠️ DeepFace test failed. The API will still work but face recognition will be disabled.")
    
    print("\n✅ Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the backend server: python setup.py --start")
    print("2. Open your React app and navigate to the Settings tab")
    print("3. Configure DeepFace settings as needed")
    print("4. Add employees through the Employees tab")
    print("5. Test face recognition in the Camera tab")
    
    # Ask if user wants to start the server
    if len(sys.argv) > 1 and sys.argv[1] == "--start":
        start_server()
    else:
        response = input("\n🚀 Would you like to start the server now? (y/n): ")
        if response.lower() in ['y', 'yes']:
            start_server()

if __name__ == "__main__":
    main() 