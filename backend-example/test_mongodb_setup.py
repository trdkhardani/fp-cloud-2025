#!/usr/bin/env python3
"""
MongoDB Setup Test for FaceAttend
This script tests the MongoDB integration and shows what features are available.
"""

import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.insert(0, '.')

def test_imports():
    """Test if all required modules can be imported"""
    print("🔍 Testing MongoDB Integration Components...")
    
    try:
        from database import db_manager, PYMONGO_AVAILABLE, EmployeeDB, AttendanceDB
        print("✅ Database module imported successfully")
        print(f"   PyMongo available: {PYMONGO_AVAILABLE}")
        
        # Test model creation
        sample_employee = EmployeeDB(
            employee_id="EMP001",
            name="Test Employee",
            department="Engineering",
            email="test@company.com",
            face_enrolled=True
        )
        print("✅ Employee model creation successful")
        
        sample_attendance = AttendanceDB(
            attendance_id="ATT001",
            employee_id="EMP001",
            employee_name="Test Employee",
            type="check-in",
            confidence=95.5
        )
        print("✅ Attendance model creation successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False

def test_database_connection():
    """Test database connection if MongoDB is available"""
    print("\n🔗 Testing Database Connection...")
    
    try:
        from database import db_manager
        
        # Try to connect
        success = db_manager.connect()
        
        if success:
            print("✅ MongoDB connection successful!")
            
            # Test basic database operations
            try:
                stats = db_manager.db.command("ping")
                print("✅ Database ping successful")
                
                # Get database stats
                collections = db_manager.db.list_collection_names()
                print(f"✅ Database accessible (collections: {len(collections)})")
                
                # Test collection creation
                test_doc = {"test": "document", "created_at": datetime.now()}
                result = db_manager.db.test_collection.insert_one(test_doc)
                print("✅ Document insertion test successful")
                
                # Clean up test document
                db_manager.db.test_collection.delete_one({"_id": result.inserted_id})
                print("✅ Document deletion test successful")
                
                db_manager.disconnect()
                print("✅ Database test completed successfully")
                return True
                
            except Exception as e:
                print(f"❌ Database operation failed: {e}")
                return False
                
        else:
            print("⚠️  MongoDB connection failed")
            print("💡 This is normal if MongoDB is not installed/running")
            print("📖 See MONGODB_SETUP.md for installation instructions")
            return False
            
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def show_features():
    """Show available MongoDB features"""
    print("\n🎯 MongoDB Features Available:")
    print("   📊 Employee Management:")
    print("      • Create employees with face enrollment")
    print("      • Store face images in GridFS")
    print("      • Update employee information")
    print("      • Delete employees and associated data")
    print("   📝 Attendance Tracking:")
    print("      • Record check-in/check-out events")
    print("      • Store confidence scores")
    print("      • Query attendance history")
    print("      • Filter by employee or date")
    print("   🗄️  Data Persistence:")
    print("      • Face images stored in GridFS")
    print("      • Indexed collections for performance")
    print("      • Automatic timestamps")
    print("      • Database statistics")

def show_schema():
    """Show the database schema"""
    print("\n📋 Database Schema:")
    print("   🏢 Collections:")
    print("      • employees    - Employee records with metadata")
    print("      • attendance   - Attendance records with timestamps")
    print("      • fs.files     - GridFS face image files")
    print("      • fs.chunks    - GridFS file chunks")
    
    print("\n   👤 Employee Document:")
    print("      {")
    print('        "_id": ObjectId("..."),')
    print('        "employee_id": "EMP001",')
    print('        "name": "John Doe",')
    print('        "department": "Engineering",')
    print('        "email": "john@company.com",')
    print('        "face_enrolled": true,')
    print('        "face_image_id": "64a1b2c3...",')
    print('        "created_at": ISODate("..."),')
    print('        "updated_at": ISODate("...")')
    print("      }")
    
    print("\n   📅 Attendance Document:")
    print("      {")
    print('        "_id": ObjectId("..."),')
    print('        "attendance_id": "ATT_001_001",')
    print('        "employee_id": "EMP001",')
    print('        "employee_name": "John Doe",')
    print('        "type": "check-in",')
    print('        "timestamp": ISODate("..."),')
    print('        "confidence": 95.67,')
    print('        "created_at": ISODate("...")')
    print("      }")

def main():
    """Main test function"""
    print("🎯 FaceAttend MongoDB Integration Test")
    print("=" * 50)
    
    # Test imports
    imports_ok = test_imports()
    
    if not imports_ok:
        print("\n❌ Basic imports failed. Please install dependencies:")
        print("   pip install pymongo motor fastapi pydantic")
        return False
    
    # Test database connection
    db_ok = test_database_connection()
    
    # Show features regardless of database status
    show_features()
    show_schema()
    
    print("\n" + "=" * 50)
    print("🎉 Test Summary:")
    print(f"   ✅ MongoDB imports: {'✅ Working' if imports_ok else '❌ Failed'}")
    print(f"   🔗 Database connection: {'✅ Working' if db_ok else '⚠️  Not available'}")
    
    if not db_ok:
        print("\n💡 Next Steps:")
        print("   1. Install MongoDB (see MONGODB_SETUP.md)")
        print("   2. Start MongoDB service")
        print("   3. Run this test again")
        print("   4. Install remaining dependencies:")
        print("      pip install opencv-python deepface tensorflow")
    else:
        print("\n🚀 MongoDB is ready! Your FaceAttend system can now:")
        print("   • Store employee data persistently")
        print("   • Save face images in the database")
        print("   • Track attendance with full history")
        print("   • Maintain data across server restarts")
    
    return db_ok

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 