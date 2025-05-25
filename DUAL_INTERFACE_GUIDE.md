# FaceAttend - Dual Interface System with MongoDB

## 🎯 Overview

Your FaceAttend system now has **two separate interfaces** with **persistent MongoDB storage** designed for different use cases:

1. **🖥️ Admin Interface** - Full management system with authentication
2. **📱 Kiosk Interface** - Simple door-mounted face recognition terminal

## 🗄️ **NEW: MongoDB Data Persistence**

### **✅ What's Persistent Now:**
- **👥 Employee Records**: All employee data survives server restarts
- **📸 Face Images**: Stored securely in GridFS database
- **📊 Attendance History**: Complete historical tracking
- **⚙️ System Configuration**: Settings maintained across sessions

### **🔒 Data Benefits:**
- **No Data Loss**: System state maintained between restarts
- **Scalable Storage**: Handle hundreds of employees efficiently
- **Professional Database**: Enterprise-grade MongoDB solution
- **Backup Ready**: Full backup and restore capabilities

## 🔑 Authentication System

### Admin Access
- **Login URL**: `http://localhost:8080/login`
- **Default Credentials**:
  - Username: `admin`
  - Password: `admin123`
- **Session**: 24-hour automatic session with remember functionality
- **Security**: Client-side authentication with localStorage session management

### Environment Variables
Create a `.env.local` file in your project root:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MIN_CONFIDENCE=85
VITE_ENVIRONMENT=development

# Authentication Settings
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=admin123

# Kiosk Mode Settings
VITE_KIOSK_MODE=false
```

### Backend Environment Variables
Create a `.env` file in `backend-example/`:

```env
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
```

## 🖥️ Admin Interface

### URL: `http://localhost:8080/admin`
**Requires Authentication** ✅

### Features:
- **👥 Employee Management** *(MongoDB Persistent)*
  - Add new employees with face enrollment → **Stored in database**
  - View all employees with search/filter → **Loaded from database**
  - Delete employees with confirmation → **Removes from database**
  - Face enrollment status tracking → **Persistent state**

- **📸 Camera Tab** *(MongoDB Enhanced)*
  - Manual face recognition testing → **Compares against stored faces**
  - Real-time camera preview with manual capture
  - Last recognition result display
  - Today's statistics dashboard → **From database**

- **📊 Attendance History** *(Fully Persistent)*
  - Complete attendance records → **Stored in MongoDB**
  - Filter by date/employee → **Database queries**
  - Export capabilities
  - Confidence scores tracking → **Historical data**

- **⚙️ Settings & Configuration** *(Persistent Settings)*
  - DeepFace model selection (VGG-Face, Facenet, etc.)
  - Confidence threshold adjustment (50-99%)
  - Detector backend configuration → **Saved to database**
  - Distance metric settings
  - System health monitoring → **Database status**

- **🛡️ Admin Features**
  - User session management
  - System status monitoring → **Database connection status**
  - Quick kiosk mode launcher
  - Secure logout functionality

### Navigation:
- Header shows current user and system status
- "Open Kiosk" button launches kiosk in new tab
- "Logout" button ends admin session
- Tabbed interface for different sections

## 📱 Kiosk Interface

### URL: `http://localhost:8080/kiosk`
**No Authentication Required** ⚡

### Features:
- **🕒 Real-time Clock Display**
  - Large digital clock with date
  - Professional appearance for door mounting

- **🎯 Automatic Face Recognition** *(MongoDB Powered)*
  - Continuous camera monitoring
  - Auto-capture every 2 seconds
  - **Compares against all enrolled faces in database**
  - No manual intervention required
  - Wide-screen optimized layout

- **✅ Recognition Results** *(Database Integrated)*
  - Green success screen for recognized faces → **Employee data from database**
  - Red denial screen for unrecognized faces
  - Employee name and check-in time display → **Stored in database**
  - 5-second auto-clear of results
  - **Attendance automatically recorded to database**

- **🔊 Audio Feedback** (Optional)
  - Success sound on recognition
  - Error sound on failure
  - Requires `success.mp3` and `error.mp3` in public folder

- **📋 Usage Instructions**
  - Built-in step-by-step instructions
  - Visual face positioning guide
  - System status indicator → **Database connection status**

### Design Features:
- **Dark theme** optimized for door mounting
- **Touch-friendly** large elements
- **Auto-recovery** from errors
- **Professional appearance** for office environments

## 🚀 Deployment Scenarios

### 1. Office Door Setup
```bash
# Start MongoDB (required)
brew services start mongodb/brew/mongodb-community  # macOS
# OR
sudo systemctl start mongod  # Linux

# Start both frontend and backend
npm run dev  # Frontend on :8080
cd backend-example && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Deploy kiosk interface
# Navigate to: http://your-server:8080/kiosk
# Mount tablet/screen at entrance door
```

### 2. Admin Workstation
```bash
# Access admin panel
# Navigate to: http://your-server:8080/login
# Login with admin credentials
# Manage employees and system configuration
# All data persists in MongoDB
```

### 3. Production Deployment
```bash
# Build for production
npm run build

# Set up MongoDB (local or Atlas)
# Configure environment variables
# Serve static files
# Configure reverse proxy (nginx/apache)
# Point kiosk devices to /kiosk
# Point admin workstations to /admin
```

## 🔄 Workflow

### Typical Usage Flow:

1. **Initial Setup**:
   - Install and start MongoDB
   - Run backend setup: `cd backend-example && python setup.py`
   - Start API server and frontend

2. **Admin Setup**:
   - Login to admin panel (`/login`)
   - Configure DeepFace settings (`Settings` tab) → **Saved to database**
   - Enroll employees (`Employees` tab → `Add New Employee`) → **Stored in MongoDB**
   - Test recognition (`Camera` tab) → **Uses database faces**

3. **Kiosk Operation**:
   - Navigate to kiosk interface (`/kiosk`)
   - Mount on entrance door/wall
   - Employees simply approach and look at camera
   - **Automatic recognition against database faces**
   - **Attendance automatically logged to database**

4. **Daily Management**:
   - Check attendance history (`History` tab) → **From database**
   - Monitor system health (`Settings` tab) → **Database status**
   - Add/remove employees as needed → **Database operations**

## 🛠️ Technical Details

### Routing Structure:
```
/                 → Redirects to /admin
/login           → Admin login page (public)
/admin           → Admin interface (protected)
/kiosk           → Kiosk interface (public)
```

### Authentication Flow:
```
1. User visits /admin → Redirected to /login (if not authenticated)
2. Login with credentials → Session stored in localStorage
3. Successful login → Redirected to /admin
4. Session expires (24h) → Auto-logout → Redirected to /login
```

### Database Integration:
```
Frontend ↔ API (FastAPI) ↔ MongoDB
    ↓           ↓            ↓
- React UI  - Face Rec.  - Employee Data
- Auth      - Attendance - Face Images
- Routing   - Config     - History
```

### API Integration:
- Both interfaces use the same backend API
- Admin interface: Full CRUD operations → **MongoDB storage**
- Kiosk interface: Recognition and attendance → **Database queries**
- Health monitoring on both interfaces → **Database status**

## 🔧 Setup Requirements

### Prerequisites:
1. **MongoDB Installation**:
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   
   # Ubuntu/Debian
   sudo apt install -y mongodb-org
   sudo systemctl start mongod
   
   # Windows
   # Download from MongoDB website
   ```

2. **Backend Dependencies**:
   ```bash
   cd backend-example
   pip install -r requirements.txt
   python setup.py  # Tests everything
   ```

3. **Frontend Dependencies**:
   ```bash
   npm install
   npm run dev
   ```

## 🔧 Customization

### Kiosk Interface:
- Modify recognition interval in `src/components/CameraCapture.tsx` (line 65)
- Change result display duration in `src/pages/Kiosk.tsx` (line 27)
- Update company branding/colors as needed

### Admin Interface:
- Modify session duration in `src/lib/auth.ts` (line 56)
- Change default credentials via environment variables
- Customize tabs and features as needed

### Database Configuration:
- MongoDB URL in `.env` file
- Database name customization
- Collection indexes and optimization

## 🚨 Security Considerations

### Production Setup:
- Change default admin credentials
- Use HTTPS for all interfaces
- Implement proper session management
- Consider network isolation for kiosk devices
- Regular security updates
- **Enable MongoDB authentication**
- **Use MongoDB Atlas for cloud deployment**

### Network Setup:
- Admin interface: Internal network only
- Kiosk interface: Can be on isolated VLAN
- API backend: Internal network only
- **MongoDB**: Secure network access
- Consider VPN for remote admin access

## 📱 Mobile Responsiveness

### Admin Interface:
- Fully responsive design
- Works on tablets and phones
- Touch-friendly controls
- Optimized layouts for all screen sizes

### Kiosk Interface:
- Optimized for larger screens (tablets/monitors)
- Portrait and landscape support
- Touch-friendly for wall-mounted use

## 🎉 Benefits

✅ **Separation of Concerns**: Admin and door access are completely separate
✅ **Security**: Authentication only where needed
✅ **Usability**: Simple kiosk interface for employees
✅ **Management**: Full admin control with proper UI
✅ **Scalability**: Can deploy multiple kiosks with one admin panel
✅ **Maintenance**: Easy to update and configure
✅ **Professional**: Enterprise-ready appearance and functionality
✅ **Data Persistence**: MongoDB ensures no data loss
✅ **Production Ready**: Full database backing for enterprise use

## 💾 **NEW: Data Management**

### **Backup & Recovery:**
```bash
# Backup database
mongodump --db faceattend --out ./backup

# Restore database  
mongorestore --db faceattend ./backup/faceattend
```

### **Database Monitoring:**
```bash
# Check database status
curl http://localhost:8000/health

# View collections
mongosh
use faceattend
show collections
```

### **Data Migration:**
- Export employee data
- Import from CSV/JSON
- Database schema upgrades
- Cloud migration support

Your FaceAttend system is now ready for production deployment with proper separation between administrative functions, day-to-day attendance tracking, and **persistent MongoDB storage**! 🚀 