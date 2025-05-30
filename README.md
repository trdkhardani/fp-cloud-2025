# ITScence - ITS Smart Presence
## Face Recognition Attendance System

ITScence is a comprehensive face recognition attendance system built with React, FastAPI, and MongoDB. It provides real-time face detection and recognition capabilities for efficient attendance tracking.

## 🌟 Features

- **Real-time Face Recognition**: Advanced face detection and recognition using DeepFace
- **Employee Management**: Complete CRUD operations for employee records
- **Attendance Tracking**: Automatic attendance logging with timestamps
- **Anti-Spoofing**: Liveness detection to prevent photo-based attacks
- **Dual Interface**: Admin panel and kiosk mode for different use cases
- **MongoDB Integration**: Persistent storage for all employee and attendance data
- **Docker Support**: Easy deployment with Docker containers
- **GPU Acceleration**: Optional NVIDIA GPU support for faster processing
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.8+ with pip
- **Docker** (optional, for containerized deployment)
- **MongoDB** (local or cloud instance)

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd itscence-smart-presence

# Deploy with Docker
chmod +x docker-deploy.sh
./docker-deploy.sh auto
```

### Option 2: Local Development

1. **Frontend Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

2. **Backend Setup**
```bash
# Navigate to backend
cd backend-example

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
python main.py
```

3. **MongoDB Setup**
```bash
# Start MongoDB (if running locally)
mongod

# Or use MongoDB connection string
export MONGODB_URL="mongodb://admin:password123@mongodb:27017/itscence?authSource=admin"
```

## 📱 Access Points

After deployment:
- **Admin Interface**: http://localhost:9090
- **Kiosk Mode**: http://localhost:9090/kiosk
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Configuration

### Environment Variables

```bash
# MongoDB Configuration
MONGODB_URL=mongodb://admin:password123@mongodb:27017/itscence?authSource=admin
DATABASE_NAME=itscence

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Face Recognition Settings
DEFAULT_MODEL=VGG-Face
DEFAULT_DETECTOR=opencv
DEFAULT_DISTANCE_METRIC=cosine
```

## 📋 Features

### 🎯 Dual Interface System
- **Desktop Interface**: Employee enrollment and management
- **Kiosk Mode**: Real-time face recognition for attendance

### 🔧 Technical Features
- **MediaPipe Integration**: Local face detection before backend processing
- **MongoDB Persistence**: GridFS for face images, structured data storage
- **GPU Acceleration**: Optional NVIDIA GPU support for 10x faster recognition
- **Docker Deployment**: One-command deployment with CPU/GPU auto-detection
- **Real-time Processing**: Optimized face recognition pipeline

### 🖥️ Interface Components
- Real-time camera capture with face detection feedback
- Employee enrollment with photo capture
- Attendance tracking with check-in/check-out
- Admin dashboard for employee management
- RESTful API with comprehensive documentation

## 🐳 Docker Deployment Options

### 1. Smart Deployment Script
```bash
./docker-deploy.sh auto     # Auto-detect GPU and deploy optimal version
./docker-deploy.sh cpu      # Force CPU deployment
./docker-deploy.sh gpu      # Force GPU deployment
./docker-deploy.sh status   # Check deployment status
./docker-deploy.sh logs     # View logs
./docker-deploy.sh stop     # Stop all services
```

### 2. Manual Docker Compose
```bash
# Start services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# GPU version
docker compose -f docker-compose.gpu.yml up --build -d
```

### 3. Development Mode
```bash
# Development with hot reloading
npm run dev                              # Frontend (port 8082)
cd backend-example && python main.py    # Backend (port 8000)
```

## 🏗️ Architecture

### Services
- **Frontend**: React + TypeScript + Vite + shadcn/ui
- **Backend**: FastAPI + DeepFace + TensorFlow
- **Database**: MongoDB with GridFS for face images
- **Proxy**: Nginx reverse proxy with optimization

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Python 3.10, FastAPI, DeepFace, TensorFlow, OpenCV
- **Database**: MongoDB 7.0 with GridFS
- **Face Recognition**: VGG-Face model with MediaPipe local detection
- **Deployment**: Docker Compose with GPU support

## 📊 Performance

### MediaPipe Optimization
- **Local Face Detection**: 2-3ms response time
- **Reduced API Calls**: 70-80% reduction in backend requests
- **Real-time Feedback**: Visual indicators for face presence

### GPU Acceleration
- **CPU Mode**: 200-500ms per recognition
- **GPU Mode**: 20-50ms per recognition (10x faster)
- **Memory Management**: Configurable GPU memory limits

## 📝 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB (local or Docker)

### Frontend Development
```bash
npm install
npm run dev
```

### Backend Development
```bash
cd backend-example
pip install -r requirements.txt
python main.py
```

### Database Setup
```bash
# Using Docker
docker run -d -p 27017:27017 mongo:7.0

# Or see MONGODB_SETUP.md for local installation
```

## 📚 Documentation

- **Docker Deployment**: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **MongoDB Setup**: [MONGODB_SETUP.md](MONGODB_SETUP.md)
- **Complete Integration**: [MONGODB_INTEGRATION_COMPLETE.md](MONGODB_INTEGRATION_COMPLETE.md)
- **Dual Interface Guide**: [DUAL_INTERFACE_GUIDE.md](DUAL_INTERFACE_GUIDE.md)
- **Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 🚀 Production Deployment

### Cloud Deployment
- **AWS**: ECS with Fargate
- **Azure**: Container Instances
- **GCP**: Cloud Run
- **DigitalOcean**: App Platform

### Scaling
```bash
# Horizontal scaling
docker compose up --scale backend=3 --scale frontend=2

# Load balancing with nginx
# See DOCKER_GUIDE.md for configuration
```

## 🛠️ Troubleshooting

### Common Issues
```bash
# Check service status
./docker-deploy.sh status

# View logs
./docker-deploy.sh logs

# Restart services
./docker-deploy.sh stop
./docker-deploy.sh auto

# GPU issues
nvidia-smi  # Check GPU availability
docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu22.04 nvidia-smi
```

### Development Issues
```bash
# Frontend port conflicts
# Vite automatically finds available ports (8080, 8081, 8082...)

# Backend dependencies
cd backend-example
pip install -r requirements.txt

# Database connection
# Check MongoDB is running and accessible
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for modern attendance systems**
