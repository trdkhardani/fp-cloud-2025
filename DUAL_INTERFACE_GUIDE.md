# FaceAttend - Dual Interface System

## 🎯 Overview

Your FaceAttend system now has **two separate interfaces** designed for different use cases:

1. **🖥️ Admin Interface** - Full management system with authentication
2. **📱 Kiosk Interface** - Simple door-mounted face recognition terminal

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

## 🖥️ Admin Interface

### URL: `http://localhost:8080/admin`
**Requires Authentication** ✅

### Features:
- **👥 Employee Management**
  - Add new employees with face enrollment
  - View all employees with search/filter
  - Delete employees with confirmation
  - Face enrollment status tracking

- **📸 Camera Tab**
  - Manual face recognition testing
  - Real-time camera preview with manual capture
  - Last recognition result display
  - Today's statistics dashboard

- **📊 Attendance History**
  - Complete attendance records
  - Filter by date/employee
  - Export capabilities
  - Confidence scores tracking

- **⚙️ Settings & Configuration**
  - DeepFace model selection (VGG-Face, Facenet, etc.)
  - Confidence threshold adjustment (50-99%)
  - Detector backend configuration
  - Distance metric settings
  - System health monitoring

- **🛡️ Admin Features**
  - User session management
  - System status monitoring
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

- **🎯 Automatic Face Recognition**
  - Continuous camera monitoring
  - Auto-capture every 2 seconds
  - No manual intervention required
  - Wide-screen optimized layout

- **✅ Recognition Results**
  - Green success screen for recognized faces
  - Red denial screen for unrecognized faces
  - Employee name and check-in time display
  - 5-second auto-clear of results

- **🔊 Audio Feedback** (Optional)
  - Success sound on recognition
  - Error sound on failure
  - Requires `success.mp3` and `error.mp3` in public folder

- **📋 Usage Instructions**
  - Built-in step-by-step instructions
  - Visual face positioning guide
  - System status indicator

### Design Features:
- **Dark theme** optimized for door mounting
- **Touch-friendly** large elements
- **Auto-recovery** from errors
- **Professional appearance** for office environments

## 🚀 Deployment Scenarios

### 1. Office Door Setup
```bash
# Start both frontend and backend
npm run dev  # Frontend on :8080
cd backend-example && python setup.py  # Backend on :8000

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
```

### 3. Production Deployment
```bash
# Build for production
npm run build

# Serve static files
# Configure reverse proxy (nginx/apache)
# Point kiosk devices to /kiosk
# Point admin workstations to /admin
```

## 🔄 Workflow

### Typical Usage Flow:

1. **Admin Setup**:
   - Login to admin panel (`/login`)
   - Configure DeepFace settings (`Settings` tab)
   - Enroll employees (`Employees` tab → `Add New Employee`)
   - Test recognition (`Camera` tab)

2. **Kiosk Operation**:
   - Navigate to kiosk interface (`/kiosk`)
   - Mount on entrance door/wall
   - Employees simply approach and look at camera
   - Automatic recognition and attendance logging

3. **Daily Management**:
   - Check attendance history (`History` tab)
   - Monitor system health (`Settings` tab)
   - Add/remove employees as needed

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

### API Integration:
- Both interfaces use the same backend API
- Admin interface: Full CRUD operations
- Kiosk interface: Recognition and attendance only
- Health monitoring on both interfaces

## 🔧 Customization

### Kiosk Interface:
- Modify recognition interval in `src/components/CameraCapture.tsx` (line 65)
- Change result display duration in `src/pages/Kiosk.tsx` (line 27)
- Update company branding/colors as needed

### Admin Interface:
- Modify session duration in `src/lib/auth.ts` (line 56)
- Change default credentials via environment variables
- Customize tabs and features as needed

## 🚨 Security Considerations

### Production Setup:
- Change default admin credentials
- Use HTTPS for all interfaces
- Implement proper session management
- Consider network isolation for kiosk devices
- Regular security updates

### Network Setup:
- Admin interface: Internal network only
- Kiosk interface: Can be on isolated VLAN
- API backend: Internal network only
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

Your FaceAttend system is now ready for production deployment with proper separation between administrative functions and day-to-day attendance tracking! 