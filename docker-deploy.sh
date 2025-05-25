#!/bin/bash

# FaceAttend Docker Deployment Script
# ===================================

set -e  # Exit on any error

echo "🐳 FaceAttend Docker Deployment"
echo "==============================="

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

# Check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
        docker --version
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed"
        docker-compose --version
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check for GPU support
check_gpu() {
    print_status "Checking GPU support..."
    if command -v nvidia-smi &> /dev/null; then
        nvidia-smi
        print_success "NVIDIA GPU detected"
        
        # Check for nvidia-docker
        if docker run --rm --gpus all nvidia/cuda:11.8-base-ubuntu22.04 nvidia-smi &> /dev/null; then
            print_success "GPU Docker support is working"
            return 0
        else
            print_warning "GPU Docker support not available"
            return 1
        fi
    else
        print_warning "No NVIDIA GPU detected"
        return 1
    fi
}

# Deploy with CPU
deploy_cpu() {
    print_status "Deploying FaceAttend with CPU support..."
    
    # Stop any existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    docker-compose up --build -d
    
    print_success "✅ FaceAttend deployed with CPU support"
}

# Deploy with GPU
deploy_gpu() {
    print_status "Deploying FaceAttend with GPU support..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.gpu.yml down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    docker-compose -f docker-compose.gpu.yml up --build -d
    
    print_success "✅ FaceAttend deployed with GPU support"
}

# Monitor deployment
monitor_deployment() {
    print_status "Monitoring deployment status..."
    
    for i in {1..60}; do
        if curl -s http://localhost/health > /dev/null 2>&1; then
            print_success "🎉 FaceAttend is running successfully!"
            echo ""
            echo "🌐 Access the application:"
            echo "   Frontend: http://localhost"
            echo "   Backend:  http://localhost:8000"
            echo "   Health:   http://localhost/health"
            echo ""
            echo "📊 Monitor with:"
            echo "   docker-compose logs -f"
            echo "   docker-compose ps"
            echo ""
            return 0
        fi
        
        echo -n "."
        sleep 2
    done
    
    print_warning "Deployment may still be starting. Check logs with: docker-compose logs"
}

# Show usage
show_usage() {
    echo "Usage: $0 [cpu|gpu|auto|status|stop|logs]"
    echo ""
    echo "Commands:"
    echo "  cpu     - Deploy with CPU support (default)"
    echo "  gpu     - Deploy with GPU support"
    echo "  auto    - Auto-detect and deploy optimal version"
    echo "  status  - Show deployment status"
    echo "  stop    - Stop all services"
    echo "  logs    - Show service logs"
    echo ""
}

# Show status
show_status() {
    echo ""
    echo "🔍 FaceAttend Status:"
    echo "===================="
    
    if docker-compose ps | grep -q "Up"; then
        echo "CPU Version:"
        docker-compose ps
    fi
    
    if docker-compose -f docker-compose.gpu.yml ps 2>/dev/null | grep -q "Up"; then
        echo "GPU Version:"
        docker-compose -f docker-compose.gpu.yml ps
    fi
    
    echo ""
    if curl -s http://localhost/health > /dev/null 2>&1; then
        print_success "✅ Application is accessible"
    else
        print_warning "⚠️ Application not accessible"
    fi
}

# Stop services
stop_services() {
    print_status "Stopping FaceAttend services..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.gpu.yml down --remove-orphans 2>/dev/null || true
    print_success "✅ All services stopped"
}

# Show logs
show_logs() {
    if docker-compose ps | grep -q "Up"; then
        docker-compose logs -f
    elif docker-compose -f docker-compose.gpu.yml ps 2>/dev/null | grep -q "Up"; then
        docker-compose -f docker-compose.gpu.yml logs -f
    else
        print_warning "No running services found"
    fi
}

# Main deployment logic
main() {
    check_docker
    
    case "${1:-auto}" in
        "cpu")
            deploy_cpu
            monitor_deployment
            ;;
        "gpu")
            if check_gpu; then
                deploy_gpu
                monitor_deployment
            else
                print_error "GPU support not available. Falling back to CPU."
                deploy_cpu
                monitor_deployment
            fi
            ;;
        "auto")
            if check_gpu; then
                print_status "Auto-detected GPU support, deploying GPU version..."
                deploy_gpu
            else
                print_status "No GPU detected, deploying CPU version..."
                deploy_cpu
            fi
            monitor_deployment
            ;;
        "status")
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "logs")
            show_logs
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 