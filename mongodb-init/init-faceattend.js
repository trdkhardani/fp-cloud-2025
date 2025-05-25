// FaceAttend MongoDB Initialization Script
// =========================================

// Switch to the faceattend database
db = db.getSiblingDB('faceattend');

// Create collections with validation
db.createCollection('employees', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['employee_id', 'name', 'email'],
            properties: {
                employee_id: {
                    bsonType: 'string',
                    description: 'Employee ID must be a string and is required'
                },
                name: {
                    bsonType: 'string',
                    description: 'Name must be a string and is required'
                },
                email: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                    description: 'Email must be a valid email address'
                },
                department: {
                    bsonType: 'string',
                    description: 'Department must be a string'
                },
                position: {
                    bsonType: 'string',
                    description: 'Position must be a string'
                },
                face_encoding: {
                    bsonType: 'array',
                    description: 'Face encoding must be an array'
                },
                face_image_id: {
                    bsonType: 'objectId',
                    description: 'Face image ID must be an ObjectId'
                },
                enrolled_at: {
                    bsonType: 'date',
                    description: 'Enrollment date must be a date'
                },
                is_active: {
                    bsonType: 'bool',
                    description: 'Active status must be a boolean'
                }
            }
        }
    }
});

db.createCollection('attendance', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['employee_id', 'timestamp', 'status'],
            properties: {
                employee_id: {
                    bsonType: 'string',
                    description: 'Employee ID must be a string and is required'
                },
                employee_name: {
                    bsonType: 'string',
                    description: 'Employee name must be a string'
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Timestamp must be a date and is required'
                },
                status: {
                    bsonType: 'string',
                    enum: ['check_in', 'check_out'],
                    description: 'Status must be either check_in or check_out'
                },
                confidence: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Confidence must be between 0 and 1'
                },
                location: {
                    bsonType: 'string',
                    description: 'Location must be a string'
                },
                device_id: {
                    bsonType: 'string',
                    description: 'Device ID must be a string'
                }
            }
        }
    }
});

// Create indexes for better performance
db.employees.createIndex({ 'employee_id': 1 }, { unique: true });
db.employees.createIndex({ 'email': 1 }, { unique: true });
db.employees.createIndex({ 'name': 1 });
db.employees.createIndex({ 'department': 1 });
db.employees.createIndex({ 'is_active': 1 });
db.employees.createIndex({ 'enrolled_at': 1 });

db.attendance.createIndex({ 'employee_id': 1 });
db.attendance.createIndex({ 'timestamp': -1 });
db.attendance.createIndex({ 'employee_id': 1, 'timestamp': -1 });
db.attendance.createIndex({ 'status': 1 });
db.attendance.createIndex({ 'timestamp': -1, 'status': 1 });

// Create a compound index for efficient queries
db.attendance.createIndex({ 
    'employee_id': 1, 
    'timestamp': -1, 
    'status': 1 
});

print('✅ FaceAttend database initialized successfully');
print('📊 Collections created: employees, attendance');
print('🔍 Indexes created for optimal performance');
print('🚀 Ready for FaceAttend application'); 