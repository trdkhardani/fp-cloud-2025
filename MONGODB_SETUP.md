# MongoDB Setup Guide for FaceAttend

## 🎯 Overview

FaceAttend now uses MongoDB for persistent storage of employee data and face images. This guide helps you install and configure MongoDB for your system.

## 📋 Prerequisites

- **Operating System**: Windows, macOS, or Linux
- **RAM**: At least 4GB recommended
- **Storage**: At least 2GB free space
- **Network**: Internet connection for initial setup

## 🚀 Quick Installation

### Option 1: Local MongoDB Installation

#### 🍎 **macOS (Homebrew)**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Verify installation
mongosh --eval "db.runCommand({ping: 1})"
```

#### 🐧 **Ubuntu/Debian Linux**
```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongosh --eval "db.runCommand({ping: 1})"
```

#### 🪟 **Windows**
```powershell
# Download MongoDB Community Server from:
# https://www.mongodb.com/try/download/community

# Install the MSI package with default settings
# MongoDB will be installed as a Windows service

# Add MongoDB to PATH (optional)
# Add C:\Program Files\MongoDB\Server\7.0\bin to your PATH

# Verify installation (in Command Prompt)
mongosh --eval "db.runCommand({ping: 1})"
```

### Option 2: MongoDB Atlas (Cloud) - **Recommended for Production**

1. **Sign up for MongoDB Atlas**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account

2. **Create a Cluster**
   - Choose "Build a Database"
   - Select "Free" tier (M0)
   - Choose your preferred region
   - Name your cluster

3. **Configure Access**
   - Create a database user
   - Add your IP address to the IP Access List
   - Get your connection string

4. **Update Environment Variables**
   ```bash
   # In your .env file
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/faceattend?retryWrites=true&w=majority
   DATABASE_NAME=faceattend
   ```

## ⚙️ Configuration

### Local MongoDB Configuration

Create a configuration file `mongod.conf`:

```yaml
# mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
```

### Environment Variables

Create or update your `.env` file:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=faceattend

# Optional: Authentication (if enabled)
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password

# Connection Options
MONGODB_OPTIONS=retryWrites=true&w=majority
```

## 🔧 Testing Your Setup

### 1. Test MongoDB Connection
```bash
# Using mongosh (MongoDB Shell)
mongosh

# Test commands in the shell
use faceattend
db.test.insertOne({message: "Hello FaceAttend!"})
db.test.find()
db.test.drop()
```

### 2. Test with FaceAttend Backend
```bash
# Navigate to backend directory
cd backend-example

# Run setup script
python setup.py

# The script will test database connectivity
```

### 3. Manual Python Test
```python
# test_mongodb.py
from pymongo import MongoClient
from datetime import datetime

try:
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client.faceattend
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful")
    
    # Test collections
    test_collection = db.test
    result = test_collection.insert_one({
        "message": "Test from FaceAttend",
        "timestamp": datetime.now()
    })
    print(f"✅ Document inserted with ID: {result.inserted_id}")
    
    # Clean up
    test_collection.delete_one({"_id": result.inserted_id})
    client.close()
    print("✅ Test completed successfully")
    
except Exception as e:
    print(f"❌ MongoDB test failed: {e}")
```

## 📊 Database Schema

FaceAttend creates the following collections:

### Employees Collection
```javascript
{
  "_id": ObjectId("..."),
  "employee_id": "EMP001",
  "name": "John Doe",
  "department": "Engineering",
  "email": "john@company.com",
  "face_enrolled": true,
  "face_image_id": "64a1b2c3d4e5f6789abcdef0",
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}
```

### Attendance Collection
```javascript
{
  "_id": ObjectId("..."),
  "attendance_id": "ATT_001_20240101_001",
  "employee_id": "EMP001",
  "employee_name": "John Doe",
  "type": "check-in",
  "timestamp": ISODate("2024-01-01T09:00:00Z"),
  "confidence": 95.67,
  "image_id": "64a1b2c3d4e5f6789abcdef1",
  "created_at": ISODate("2024-01-01T09:00:00Z")
}
```

### GridFS Files (Face Images)
```javascript
// fs.files collection
{
  "_id": ObjectId("..."),
  "filename": "EMP001_face.jpg",
  "contentType": "image/jpeg",
  "length": 45672,
  "uploadDate": ISODate("2024-01-01T00:00:00Z"),
  "metadata": {
    "employee_id": "EMP001"
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. **Connection Refused**
```
Error: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Make sure MongoDB is running: `brew services start mongodb/brew/mongodb-community` (macOS)
- Check if port 27017 is available: `lsof -i :27017`
- Try restarting MongoDB service

#### 2. **Authentication Failed**
```
Error: Authentication failed
```
**Solution:**
- Check your username and password in the connection string
- Ensure the user has proper permissions
- For Atlas: verify IP whitelist settings

#### 3. **Database Not Found**
```
Error: Database 'faceattend' not found
```
**Solution:**
- MongoDB creates databases automatically when first written to
- This is normal for new installations

#### 4. **GridFS Errors**
```
Error: GridFS file not found
```
**Solution:**
- Check if the face image was properly uploaded
- Verify GridFS indexes are created
- Run database cleanup: `db.fs.files.createIndex({filename: 1})`

### Performance Optimization

#### 1. **Indexes**
```javascript
// Create recommended indexes
db.employees.createIndex({"employee_id": 1}, {unique: true})
db.attendance.createIndex({"employee_id": 1, "timestamp": -1})
db.attendance.createIndex({"timestamp": -1})
db.fs.files.createIndex({"metadata.employee_id": 1})
```

#### 2. **Memory Settings**
```yaml
# In mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2  # Adjust based on available RAM
```

## 🔒 Security Best Practices

### 1. **Enable Authentication**
```bash
# Add to mongod.conf
security:
  authorization: enabled

# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "your_secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})
```

### 2. **Network Security**
```yaml
# In mongod.conf - restrict connections
net:
  bindIp: 127.0.0.1,192.168.1.100  # Add specific IPs only
  port: 27017
```

### 3. **Firewall Rules**
```bash
# Ubuntu/Debian
sudo ufw allow from 192.168.1.0/24 to any port 27017

# CentOS/RHEL
sudo firewall-cmd --add-rich-rule="rule family='ipv4' source address='192.168.1.0/24' port protocol='tcp' port='27017' accept" --permanent
```

## 📈 Monitoring

### 1. **Database Statistics**
```javascript
// Monitor database size
db.stats()

// Monitor collection statistics
db.employees.stats()
db.attendance.stats()

// Monitor GridFS usage
db.fs.files.stats()
```

### 2. **Performance Monitoring**
```javascript
// Check current operations
db.currentOp()

// Monitor slow queries
db.setProfilingLevel(2, {slowms: 100})
db.system.profile.find().sort({ts: -1}).limit(5)
```

## 🔄 Backup and Restore

### Backup
```bash
# Full database backup
mongodump --host localhost:27017 --db faceattend --out ./backup

# Backup with compression
mongodump --host localhost:27017 --db faceattend --gzip --out ./backup
```

### Restore
```bash
# Restore database
mongorestore --host localhost:27017 --db faceattend ./backup/faceattend

# Restore with drop existing
mongorestore --host localhost:27017 --db faceattend --drop ./backup/faceattend
```

## 🎉 Next Steps

After MongoDB is set up:

1. **Run Backend Setup**
   ```bash
   cd backend-example
   python setup.py
   ```

2. **Start the API Server**
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Test the API**
   - Visit: http://localhost:8000/health
   - Check database stats in the response

4. **Use the Frontend**
   - Login to admin panel: http://localhost:8080/login
   - Add employees and test face recognition
   - All data will now persist in MongoDB!

Your FaceAttend system is now ready with persistent MongoDB storage! 🚀 