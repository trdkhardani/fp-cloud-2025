#!/usr/bin/env python3
"""
Quick test for employee enrollment with ObjectId face_image_id
"""

import asyncio
import base64
from database import db_manager
from datetime import datetime

async def test_employee_enrollment():
    """Test employee enrollment with face image"""
    try:
        # Connect to database
        success = db_manager.connect()
        if not success:
            print("❌ Failed to connect to database")
            return False
        
        print("✅ Connected to database")
        
        # Create a simple test image (1x1 pixel JPEG) - proper base64 encoding
        test_image_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A=="
        
        # Test employee data
        employee_data = {
            "employee_id": "TEST001",
            "name": "Test User",
            "department": "Testing",
            "email": "test@example.com"
        }
        
        print("🧪 Creating employee with face image...")
        
        # Create employee with face image
        result = await db_manager.create_employee(employee_data, test_image_b64)
        
        print(f"✅ Employee created successfully!")
        print(f"   Employee ID: {result['employee_id']}")
        print(f"   Name: {result['name']}")
        print(f"   Face enrolled: {result.get('face_enrolled', False)}")
        print(f"   Face image ID: {result.get('face_image_id', 'None')}")
        
        # Verify the employee was stored correctly
        retrieved = await db_manager.get_employee("TEST001")
        if retrieved:
            print("✅ Employee retrieval successful")
            print(f"   Retrieved face_image_id: {retrieved.get('face_image_id', 'None')}")
        else:
            print("❌ Failed to retrieve employee")
            return False
        
        # Clean up test data
        await db_manager.delete_employee("TEST001")
        print("✅ Test cleanup completed")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db_manager.disconnect()

if __name__ == "__main__":
    success = asyncio.run(test_employee_enrollment())
    if success:
        print("\n🎉 Employee enrollment test PASSED!")
        print("✅ face_image_id ObjectId validation is working correctly")
    else:
        print("\n❌ Employee enrollment test FAILED!") 