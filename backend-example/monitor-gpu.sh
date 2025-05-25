#!/bin/bash

# FaceAttend GPU Monitoring Script
# ================================

echo "🖥️ FaceAttend GPU Monitoring"
echo "============================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if nvidia-smi is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "❌ nvidia-smi not found. Please install NVIDIA drivers."
    exit 1
fi

# Function to display GPU status
show_gpu_status() {
    echo -e "${BLUE}📊 GPU Status:${NC}"
    nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits
    echo ""
}

# Function to monitor in real-time
monitor_realtime() {
    echo -e "${GREEN}🔄 Real-time GPU monitoring (Press Ctrl+C to stop)${NC}"
    echo ""
    
    while true; do
        clear
        echo "🖥️ FaceAttend GPU Monitoring - $(date)"
        echo "============================"
        echo ""
        
        # GPU utilization
        echo -e "${BLUE}GPU Utilization:${NC}"
        nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | while read gpu_util; do
            if [ "$gpu_util" -gt 80 ]; then
                echo -e "  🔥 ${gpu_util}% (High)"
            elif [ "$gpu_util" -gt 50 ]; then
                echo -e "  🟡 ${gpu_util}% (Medium)"
            else
                echo -e "  🟢 ${gpu_util}% (Low)"
            fi
        done
        echo ""
        
        # Memory usage
        echo -e "${BLUE}Memory Usage:${NC}"
        nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits | while IFS=',' read used total; do
            used=$(echo $used | xargs)
            total=$(echo $total | xargs)
            percentage=$((used * 100 / total))
            echo -e "  📊 ${used}MB / ${total}MB (${percentage}%)"
        done
        echo ""
        
        # Temperature
        echo -e "${BLUE}Temperature:${NC}"
        nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits | while read temp; do
            if [ "$temp" -gt 80 ]; then
                echo -e "  🌡️  ${temp}°C (Hot)"
            elif [ "$temp" -gt 60 ]; then
                echo -e "  🟡 ${temp}°C (Warm)"
            else
                echo -e "  ❄️  ${temp}°C (Cool)"
            fi
        done
        echo ""
        
        # Running processes
        echo -e "${BLUE}GPU Processes:${NC}"
        nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv,noheader,nounits | while IFS=',' read pid name memory; do
            if [ ! -z "$pid" ]; then
                echo -e "  🔧 PID: $pid, Process: $name, Memory: ${memory}MB"
            fi
        done
        
        # FaceAttend service status
        echo ""
        echo -e "${BLUE}FaceAttend Service:${NC}"
        if systemctl is-active --quiet faceattend; then
            echo -e "  ✅ Running"
        else
            echo -e "  ❌ Stopped"
        fi
        
        sleep 2
    done
}

# Function to show performance stats
show_performance() {
    echo -e "${BLUE}📈 Performance Statistics:${NC}"
    echo ""
    
    # GPU info
    nvidia-smi --query-gpu=name,driver_version,cuda_version --format=csv
    echo ""
    
    # Current utilization
    show_gpu_status
    
    # Process list
    echo -e "${BLUE}🔧 Current GPU Processes:${NC}"
    nvidia-smi pmon -c 1
    echo ""
}

# Function to test GPU performance
test_performance() {
    echo -e "${BLUE}🧪 Testing GPU Performance...${NC}"
    echo ""
    
    # Check if in virtual environment and FaceAttend is available
    if [ -d "venv" ]; then
        source venv/bin/activate
        
        echo "Testing TensorFlow GPU detection..."
        python -c "
import tensorflow as tf
print('TensorFlow version:', tf.__version__)
gpus = tf.config.list_physical_devices('GPU')
print('GPUs available:', len(gpus))
for gpu in gpus:
    print(f'  - {gpu}')
"
        echo ""
        
        echo "Testing DeepFace model loading (this may take a moment)..."
        python -c "
import time
start_time = time.time()
from deepface import DeepFace
model = DeepFace.build_model('VGG-Face')
load_time = time.time() - start_time
print(f'✅ VGG-Face model loaded in {load_time:.2f} seconds')
"
        
        deactivate
    else
        echo "⚠️ Virtual environment not found. Run from backend-example directory."
    fi
}

# Main menu
case "${1:-menu}" in
    "status")
        show_gpu_status
        ;;
    "monitor")
        monitor_realtime
        ;;
    "performance")
        show_performance
        ;;
    "test")
        test_performance
        ;;
    "menu"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  status      - Show current GPU status"
        echo "  monitor     - Real-time GPU monitoring"
        echo "  performance - Show performance statistics"
        echo "  test        - Test GPU performance with FaceAttend"
        echo ""
        echo "Examples:"
        echo "  $0 status"
        echo "  $0 monitor"
        echo ""
        ;;
esac 