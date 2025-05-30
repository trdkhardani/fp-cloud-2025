# FaceAttend Docker Deployment Guide
# ===================================

This guide provides comprehensive instructions for deploying FaceAttend using Docker containers, offering both CPU and GPU support for maximum flexibility and performance.

## 🐳 Overview

The Docker deployment includes:
- **Frontend**: React application with nginx
- **Backend**: FastAPI with face recognition capabilities
- **Database**: MongoDB with persistent storage
- **GPU Support**: Optional NVIDIA GPU acceleration

## 📋 Prerequisites

### Required Software
- **Docker**: v24.0+ (with Compose plugin)
- **Docker Compose**: v2.0+ (plugin or standalone)
- **Git**: For cloning the repository

### For GPU Support (Optional)
- **NVIDIA GPU**: Compatible with CUDA 12.2.2+
- **NVIDIA Driver**: v535.54.03+
- **NVIDIA Container Toolkit**: For Docker GPU support
- **CUDA Toolkit**: 12.2.2 (automatically provided in container)
- **cuDNN**: 8.9+ (automatically provided in container)

### System Requirements
- **CPU Version**: 4GB RAM, 2 CPU cores
- **GPU Version**: 8GB RAM, 4GB GPU memory (recommended 6GB+)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd face-attend-mobile-capture
```

### 2. Choose Deployment Method

#### Auto-Deploy (Recommended)
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh auto
```

#### Manual CPU Deployment
```bash
docker compose up --build -d
```

#### Manual GPU Deployment
```bash
docker compose -f docker-compose.gpu.yml up --build -d
```

### 3. Access Application
- **Frontend**: http://localhost:9090
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:9090/health

## 📁 Docker Configuration Files

### Core Files
- `Dockerfile` - Frontend React app
- `backend-example/Dockerfile` - Backend API (CPU)
- `backend-example/Dockerfile.gpu` - Backend API (GPU)
- `docker-compose.yml` - CPU deployment
- `docker-compose.gpu.yml` - GPU deployment
- `docker-deploy.sh` - Deployment script
- `.dockerignore` - Exclude files from builds

### Configuration Files
- `nginx.conf` - Frontend nginx configuration
- `mongodb-init/init-faceattend.js` - Database initialization

## 🔧 Deployment Script Usage

The `docker-deploy.sh` script provides easy deployment management and automatically detects whether to use `docker compose` (plugin) or `docker-compose` (standalone):

### Commands
```bash
./docker-deploy.sh auto     # Auto-detect and deploy optimal version
./docker-deploy.sh cpu      # Deploy CPU version
./docker-deploy.sh gpu      # Deploy GPU version
./docker-deploy.sh status   # Show deployment status
./docker-deploy.sh stop     # Stop all services
./docker-deploy.sh logs     # Show service logs
```

### Examples
```bash
# Auto deployment (recommended)
./docker-deploy.sh auto

# Force CPU deployment
./docker-deploy.sh cpu

# Check status
./docker-deploy.sh status

# View logs
./docker-deploy.sh logs

# Stop services
./docker-deploy.sh stop
```

## 🐳 Manual Docker Commands

### Build Images
```bash
# Build frontend
docker build -t faceattend-frontend .

# Build backend (CPU)
docker build -t faceattend-backend ./backend-example

# Build backend (GPU)
docker build -f ./backend-example/Dockerfile.gpu -t faceattend-backend-gpu ./backend-example
```

### Docker Compose Commands
```bash
# Start services (CPU version)
docker compose up --build -d

# Start services (GPU version)
docker compose -f docker-compose.gpu.yml up --build -d

# View status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and restart
docker compose up --build -d --force-recreate
```

### Run Individual Services
```bash
# MongoDB
docker run -d --name faceattend-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7.0

# Backend (CPU)
docker run -d --name faceattend-backend \
  -p 8000:8000 \
  -e MONGODB_URL=mongodb://admin:password123@localhost:27017/faceattend?authSource=admin \
  faceattend-backend

# Backend (GPU)
docker run -d --name faceattend-backend-gpu \
  --gpus all \
  -p 8000:8000 \
  -e MONGODB_URL=mongodb://admin:password123@localhost:27017/faceattend?authSource=admin \
  faceattend-backend-gpu

# Frontend
docker run -d --name faceattend-frontend \
  -p 9090:80 \
  faceattend-frontend
```

## ⚙️ Environment Configuration

### Default Configuration
The services use these default settings:
- **MongoDB**: `mongodb://admin:password123@mongodb:27017/faceattend?authSource=admin`
- **Backend Port**: 8000
- **Frontend Port**: 9090
- **Face Model**: VGG-Face
- **Detector**: OpenCV

### Custom Configuration
Create a `.env` file to override defaults:
```bash
# Environment variables are set directly in docker-compose.yml
# Modify the environment section in the compose files as needed
```

### Environment Variables
```bash
# MongoDB
MONGODB_URL=mongodb://admin:password123@mongodb:27017/faceattend?authSource=admin
DATABASE_NAME=faceattend

# API
API_HOST=0.0.0.0
API_PORT=8000

# Face Recognition
DEFAULT_MODEL=VGG-Face
DEFAULT_DETECTOR=opencv
DEFAULT_DISTANCE_METRIC=cosine

# GPU (GPU version only)
TF_FORCE_GPU_ALLOW_GROWTH=true
TF_GPU_MEMORY_LIMIT=2048
TF_ENABLE_ONEDNN_OPTS=1
NVIDIA_VISIBLE_DEVICES=all
NVIDIA_DRIVER_CAPABILITIES=compute,utility
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Application health
curl http://localhost:9090/health

# Backend API health
curl http://localhost:8000/health

# MongoDB health
docker exec faceattend-mongodb mongosh --eval "db.adminCommand('ping')"
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# GPU version
docker compose -f docker-compose.gpu.yml logs -f
```

### Monitor Resource Usage
```bash
# Container stats
docker stats

# GPU usage (GPU version)
nvidia-smi
```

### Database Management
```bash
# Connect to MongoDB
docker exec -it faceattend-mongodb mongosh -u admin -p password123

# Backup database
docker exec faceattend-mongodb mongodump --username admin --password password123 --authenticationDatabase admin --out /backup

# Restore database
docker exec faceattend-mongodb mongorestore --username admin --password password123 --authenticationDatabase admin /backup
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :80
lsof -i :8000

# Kill process or change port in docker-compose.yml
```

#### 2. GPU Not Detected
```bash
# Check NVIDIA driver
nvidia-smi

# Check Docker GPU support
docker run --rm --gpus all nvidia/cuda:12.2.2-base-ubuntu22.04 nvidia-smi

# Install NVIDIA Container Toolkit
sudo apt-get install nvidia-container-toolkit
sudo systemctl restart docker
```

#### 3. MongoDB Connection Issues
```bash
# Check MongoDB logs
docker compose logs mongodb

# Verify MongoDB is running
docker compose ps mongodb

# Test connection
docker exec faceattend-mongodb mongosh --eval "db.adminCommand('ping')"
```

#### 4. Backend API Issues
```bash
# Check backend logs
docker compose logs backend

# Verify Python dependencies
docker exec faceattend-backend pip list

# Test face recognition
curl -X POST http://localhost:8000/test
```

#### 5. Frontend Build Issues
```bash
# Check build logs
docker compose logs frontend

# Rebuild frontend
docker compose build frontend

# Check nginx configuration
docker exec faceattend-frontend nginx -t
```

#### 6. Docker Compose Command Issues
If you get errors with `docker compose`, try:
```bash
# Check if Docker Compose plugin is installed
docker compose version

# If not available, use standalone version
docker-compose --version

# Install Docker Compose plugin (recommended)
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Performance Optimization

#### CPU Version
- Increase worker processes in backend
- Enable nginx gzip compression
- Use smaller face recognition models

#### GPU Version
- Monitor GPU memory usage
- Adjust `TF_GPU_MEMORY_LIMIT`
- Use mixed precision training

### Security Considerations

#### Production Deployment
1. Change default passwords in compose files
2. Use Docker secrets for sensitive data
3. Enable SSL/TLS
4. Configure firewall rules
5. Regular security updates

#### Environment Security
```bash
# Use Docker secrets for production
echo "password123" | docker secret create mongo_password -
```

## 🏗️ Production Deployment

### Using Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml faceattend
```

### Using Kubernetes
```bash
# Convert to Kubernetes manifests
kompose convert

# Deploy to Kubernetes
kubectl apply -f .
```

### Using Cloud Providers
- **AWS**: ECS with Fargate
- **Azure**: Container Instances
- **GCP**: Cloud Run
- **DigitalOcean**: App Platform

## 📈 Scaling

### Horizontal Scaling
```yaml
# In docker-compose.yml
backend:
  deploy:
    replicas: 3
  
frontend:
  deploy:
    replicas: 2
```

### Load Balancing
```bash
# Use nginx load balancer
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## 🎯 Development Workflow

### Development Mode
```bash
# Create development override file
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  backend:
    volumes:
      - ./backend-example:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  frontend:
    volumes:
      - ./src:/app/src
EOF

# Start with hot reloading
docker compose up --build
```

### Testing
```bash
# Run tests in containers
docker compose exec backend python -m pytest
docker compose exec frontend npm test
```

## 🆕 Docker Compose Plugin vs Standalone

The deployment script automatically detects and uses the appropriate command:

### Modern Approach (Recommended)
```bash
# Plugin version (docker compose)
docker compose up -d
docker compose logs -f
docker compose down
```

### Legacy Approach (Still Supported)
```bash
# Standalone version (docker-compose)
docker-compose up -d
docker-compose logs -f
docker-compose down
```

The script will automatically use the available version, preferring the plugin version when both are available.

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Compose Plugin](https://docs.docker.com/compose/install/compose-plugin/)
- [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-container-toolkit)
- [MongoDB Docker Images](https://hub.docker.com/_/mongo)

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review container logs with `docker compose logs`
3. Verify system requirements
4. Create GitHub issue with logs

---

**Happy Containerizing! 🐳** 