#!/bin/bash

# FaceAttend Ubuntu GPU Deployment Script
# =======================================

set -e  # Exit on any error

echo "🚀 FaceAttend Ubuntu GPU Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root!"
    exit 1
fi

# Step 1: Check NVIDIA GPU
print_status "Checking NVIDIA GPU..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi
    print_success "NVIDIA GPU detected"
else
    print_warning "NVIDIA GPU not detected. Install NVIDIA drivers first!"
    echo "Run: sudo apt install nvidia-driver-535"
    exit 1
fi

# Step 2: Check CUDA
print_status "Checking CUDA installation..."
if command -v nvcc &> /dev/null; then
    nvcc --version
    print_success "CUDA detected"
else
    print_warning "CUDA not found. Please install CUDA toolkit first!"
    exit 1
fi

# Step 3: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 4: Install system dependencies
print_status "Installing system dependencies..."
sudo apt install -y \
    python3.10 \
    python3.10-venv \
    python3-pip \
    git \
    curl \
    build-essential \
    cmake \
    pkg-config \
    libopencv-dev \
    libhdf5-dev \
    libhdf5-serial-dev \
    libatlas-base-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libgtk-3-dev \
    libatlas-base-dev \
    gfortran \
    mongodb \
    redis-server \
    nginx

# Step 5: Start MongoDB
print_status "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod
print_success "MongoDB started"

# Step 6: Start Redis
print_status "Starting Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server
print_success "Redis started"

# Step 7: Create Python environment
print_status "Creating Python virtual environment..."
python3.10 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Step 8: Install Python dependencies
print_status "Installing Python dependencies with GPU support..."
pip install -r requirements-ubuntu.txt

# Step 9: Verify GPU support
print_status "Verifying GPU support..."
python -c "
import tensorflow as tf
print('TensorFlow version:', tf.__version__)
print('GPU Available:', tf.config.list_physical_devices('GPU'))
if tf.config.list_physical_devices('GPU'):
    print('✅ GPU support is working!')
else:
    print('❌ GPU support not detected')
"

# Step 10: Test DeepFace
print_status "Testing DeepFace with GPU..."
python -c "
import deepface
from deepface import DeepFace
print('✅ DeepFace imported successfully')
print('Available models:', DeepFace.build_model('VGG-Face'))
print('✅ DeepFace GPU test completed')
"

# Step 11: Set up environment file
print_status "Creating environment configuration..."
cat > .env << EOF
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

# GPU Configuration
TF_FORCE_GPU_ALLOW_GROWTH=true
TF_GPU_MEMORY_LIMIT=2048

# Production Settings
WORKERS=4
WORKER_CLASS=uvicorn.workers.UvicornWorker
EOF

# Step 12: Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/faceattend.service > /dev/null <<EOF
[Unit]
Description=FaceAttend Face Recognition API
After=network.target mongod.service

[Service]
Type=exec
User=$USER
Group=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(pwd)/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Step 13: Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/faceattend > /dev/null <<EOF
server {
    listen 80;
    server_name localhost;
    
    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # Frontend (if serving static files)
    location / {
        root /var/www/faceattend;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/faceattend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Step 14: Start services
print_status "Starting FaceAttend service..."
sudo systemctl daemon-reload
sudo systemctl enable faceattend
sudo systemctl start faceattend

# Step 15: Final verification
print_status "Final system verification..."
sleep 5

# Check if service is running
if systemctl is-active --quiet faceattend; then
    print_success "✅ FaceAttend service is running"
else
    print_error "❌ FaceAttend service failed to start"
    sudo systemctl status faceattend
fi

# Check API health
if curl -s http://localhost:8000/health > /dev/null; then
    print_success "✅ API is responding"
else
    print_warning "⚠️ API not responding yet (may need a moment to start)"
fi

echo ""
print_success "🎉 FaceAttend Ubuntu deployment completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Frontend: Build and deploy React app to /var/www/faceattend"
echo "   2. Test API: curl http://localhost/health"
echo "   3. Check logs: sudo journalctl -u faceattend -f"
echo "   4. Monitor GPU: watch nvidia-smi"
echo ""
echo "🔧 Useful commands:"
echo "   • Restart service: sudo systemctl restart faceattend"
echo "   • View logs: sudo journalctl -u faceattend -f"
echo "   • GPU monitoring: nvidia-smi"
echo "   • Database: mongosh"
echo ""

deactivate 