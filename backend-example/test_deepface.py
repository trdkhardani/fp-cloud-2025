#!/usr/bin/env python3
"""
DeepFace Test Script
Tests DeepFace installation and shows available configuration options.
"""

import os
import sys

def test_deepface_import():
    """Test if DeepFace can be imported"""
    try:
        from deepface import DeepFace
        print("✅ DeepFace imported successfully")
        return True
    except ImportError as e:
        print(f"❌ DeepFace import failed: {e}")
        print("Install with: pip install deepface")
        return False

def test_models():
    """Test available models"""
    try:
        from deepface import DeepFace
        
        models = ["VGG-Face", "Facenet", "OpenFace", "DeepFace", "DeepID", "ArcFace", "Dlib", "SFace"]
        print("\n🔍 Testing models:")
        
        for model in models:
            try:
                print(f"  Testing {model}...")
                # Try to build the model (this will download if needed)
                from deepface.commons import functions
                functions.initialize_detector(detector_backend="opencv")
                print(f"  ✅ {model} - OK")
            except Exception as e:
                print(f"  ❌ {model} - Error: {e}")
                
    except Exception as e:
        print(f"❌ Model testing failed: {e}")

def test_detectors():
    """Test available detector backends"""
    try:
        from deepface import DeepFace
        
        detectors = ["opencv", "ssd", "dlib", "mtcnn", "retinaface", "mediapipe"]
        print("\n🔍 Testing detector backends:")
        
        for detector in detectors:
            try:
                print(f"  Testing {detector}...")
                from deepface.commons import functions
                functions.initialize_detector(detector_backend=detector)
                print(f"  ✅ {detector} - OK")
            except Exception as e:
                print(f"  ❌ {detector} - Error: {e}")
                
    except Exception as e:
        print(f"❌ Detector testing failed: {e}")

def test_basic_functionality():
    """Test basic DeepFace functionality"""
    try:
        from deepface import DeepFace
        import numpy as np
        from PIL import Image
        
        print("\n🔍 Testing basic functionality:")
        
        # Create a simple test image
        test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        test_path = "test_image.jpg"
        Image.fromarray(test_image).save(test_path)
        
        try:
            # Test face extraction
            faces = DeepFace.extract_faces(test_path, enforce_detection=False)
            print(f"  ✅ Face extraction - Found {len(faces)} faces")
            
            # Test representation
            embedding = DeepFace.represent(test_path, enforce_detection=False)
            print(f"  ✅ Face representation - Embedding size: {len(embedding[0]['embedding'])}")
            
        except Exception as e:
            print(f"  ❌ Basic functionality test failed: {e}")
        finally:
            if os.path.exists(test_path):
                os.remove(test_path)
                
    except Exception as e:
        print(f"❌ Basic functionality testing failed: {e}")

def show_system_info():
    """Show system information"""
    import platform
    
    print("📊 System Information:")
    print(f"  Python: {sys.version}")
    print(f"  Platform: {platform.platform()}")
    print(f"  Architecture: {platform.architecture()}")
    
    try:
        import tensorflow as tf
        print(f"  TensorFlow: {tf.__version__}")
        print(f"  GPU Available: {tf.config.list_physical_devices('GPU')}")
    except ImportError:
        print("  TensorFlow: Not installed")
    
    try:
        import cv2
        print(f"  OpenCV: {cv2.__version__}")
    except ImportError:
        print("  OpenCV: Not installed")

def main():
    print("🧪 DeepFace Test Suite")
    print("=" * 40)
    
    # Show system info
    show_system_info()
    print()
    
    # Test DeepFace import
    if not test_deepface_import():
        return
    
    # Test models
    test_models()
    
    # Test detectors
    test_detectors()
    
    # Test basic functionality
    test_basic_functionality()
    
    print("\n✅ Testing completed!")
    print("\n💡 Tips:")
    print("- If models fail to load, they may need to be downloaded first")
    print("- Use 'opencv' detector for fastest performance")
    print("- Use 'VGG-Face' model for best balance of speed and accuracy")
    print("- Ensure good lighting and face visibility for best results")

if __name__ == "__main__":
    main() 