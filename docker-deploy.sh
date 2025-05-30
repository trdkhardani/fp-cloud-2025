#!/bin/bash

# ITScence Docker Deployment Script
# =================================

set -e  # Exit on any error

echo "🐳 ITScence Docker Deployment"
echo "============================="

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

    # Check for docker compose (plugin) or docker-compose (standalone)
    if docker compose version &> /dev/null; then
        print_success "Docker Compose (plugin) is installed"
        docker compose version
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        print_success "Docker Compose (standalone) is installed"
        docker-compose --version
        COMPOSE_CMD="docker-compose"
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
        if docker run --rm --gpus all nvidia/cuda:12.2.2-base-ubuntu22.04 nvidia-smi &> /dev/null; then
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
    print_status "Deploying ITScence with CPU support..."
    
    # Stop GPU backend and frontend if running, but keep MongoDB
    if docker ps | grep -q "itscence-backend-gpu"; then
        print_status "Stopping GPU backend to switch to CPU..."
        docker stop itscence-backend-gpu itscence-frontend-gpu 2>/dev/null || true
        docker rm itscence-backend-gpu itscence-frontend-gpu 2>/dev/null || true
    fi
    
    # Start MongoDB if not running (shared between CPU and GPU)
    if ! docker ps | grep -q "itscence-mongodb"; then
        print_status "Starting shared MongoDB..."
        $COMPOSE_CMD up -d mongodb
        sleep 5  # Wait for MongoDB to be ready
    fi
    
    # Build and start CPU services
    $COMPOSE_CMD up --build -d
    
    print_success "✅ ITScence deployed with CPU support (using shared MongoDB)"
}

# Deploy with GPU
deploy_gpu() {
    print_status "Deploying ITScence with GPU support..."
    
    # Stop CPU backend and frontend if running, but keep MongoDB
    if docker ps | grep -q "itscence-backend"; then
        print_status "Stopping CPU backend to switch to GPU..."
        docker stop itscence-backend itscence-frontend 2>/dev/null || true
        docker rm itscence-backend itscence-frontend 2>/dev/null || true
    fi
    
    # Start MongoDB if not running (shared between CPU and GPU)
    if ! docker ps | grep -q "itscence-mongodb"; then
        print_status "Starting shared MongoDB..."
        $COMPOSE_CMD -f docker-compose.gpu.yml up -d mongodb
        sleep 5  # Wait for MongoDB to be ready
    fi
    
    # Build and start GPU services
    $COMPOSE_CMD -f docker-compose.gpu.yml up --build -d
    
    print_success "✅ ITScence deployed with GPU support (using shared MongoDB)"
}

# Monitor deployment
monitor_deployment() {
    print_status "Monitoring deployment status..."
    
    for i in {1..60}; do
        if curl -s http://localhost:9090/health > /dev/null 2>&1; then
            print_success "🎉 ITScence is running successfully!"
            echo ""
            echo "🌐 Access the application:"
            echo "   Frontend: http://localhost:9090"
            echo "   Backend:  http://localhost:8000"
            echo "   Health:   http://localhost:9090/health"
            echo ""
            echo "📊 Monitor with:"
            echo "   $COMPOSE_CMD logs -f"
            echo "   $COMPOSE_CMD ps"
            echo ""
            return 0
        fi
        
        echo -n "."
        sleep 2
    done
    
    print_warning "Deployment may still be starting. Check logs with: $COMPOSE_CMD logs"
}

# Force stop all services including MongoDB
stop_all_services() {
    print_status "Force stopping all ITScence services including MongoDB..."
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    $COMPOSE_CMD -f docker-compose.gpu.yml down --remove-orphans 2>/dev/null || true
    docker stop itscence-mongodb itscence-backend itscence-frontend 2>/dev/null || true
    docker stop itscence-backend-gpu itscence-frontend-gpu 2>/dev/null || true
    docker rm itscence-mongodb itscence-backend itscence-frontend 2>/dev/null || true
    docker rm itscence-backend-gpu itscence-frontend-gpu 2>/dev/null || true
    print_success "✅ All services stopped (including shared MongoDB)"
}

# Show usage
show_usage() {
    echo "Usage: $0 [cpu|gpu|auto|status|stop|stop-all|logs]"
    echo ""
    echo "Commands:"
    echo "  cpu      - Deploy with CPU support"
    echo "  gpu      - Deploy with GPU support"
    echo "  auto     - Auto-detect and deploy optimal version"
    echo "  status   - Show deployment status"
    echo "  stop     - Stop app services (preserves shared MongoDB)"
    echo "  stop-all - Stop all services including shared MongoDB"
    echo "  logs     - Show service logs"
    echo ""
    echo "Note: MongoDB is shared between CPU and GPU deployments."
    echo "Switching between cpu/gpu modes preserves your data."
    echo ""
}

# Show status
show_status() {
    echo ""
    echo "🔍 ITScence Status:"
    echo "==================="
    echo ""
    
    # Check MongoDB status
    if docker ps | grep -q "itscence-mongodb"; then
        print_success "📊 Shared MongoDB: Running"
        echo "   Container: itscence-mongodb"
        echo "   Port: 27017"
    else
        print_warning "📊 Shared MongoDB: Stopped"
    fi
    
    echo ""
    
    # Check CPU deployment
    if docker ps | grep -q "itscence-backend" && ! docker ps | grep -q "itscence-backend-gpu"; then
        print_success "🖥️  Active Mode: CPU"
        echo "CPU Services:"
        docker ps --filter "name=itscence-backend" --filter "name=itscence-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    # Check GPU deployment
    elif docker ps | grep -q "itscence-backend-gpu"; then
        print_success "🚀 Active Mode: GPU"
        echo "GPU Services:"
        docker ps --filter "name=itscence-backend-gpu" --filter "name=itscence-frontend-gpu" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_warning "⚠️  No active deployment (backend services stopped)"
    fi
    
    echo ""
    if curl -s http://localhost:9090/health > /dev/null 2>&1; then
        print_success "✅ Application is accessible at http://localhost:9090"
    else
        print_warning "⚠️ Application not accessible"
    fi
}

# Stop services
stop_services() {
    print_status "Stopping ITScence services..."
    
    # Stop all application containers but preserve MongoDB by default
    docker stop itscence-backend itscence-frontend 2>/dev/null || true
    docker stop itscence-backend-gpu itscence-frontend-gpu 2>/dev/null || true
    docker rm itscence-backend itscence-frontend 2>/dev/null || true
    docker rm itscence-backend-gpu itscence-frontend-gpu 2>/dev/null || true
    
    # Ask if user wants to stop MongoDB too
    if docker ps | grep -q "itscence-mongodb"; then
        echo ""
        read -p "Stop shared MongoDB as well? This will remove all data access (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Stopping shared MongoDB..."
            docker stop itscence-mongodb 2>/dev/null || true
            docker rm itscence-mongodb 2>/dev/null || true
            print_success "✅ All services stopped (including MongoDB)"
        else
            print_success "✅ Application services stopped (MongoDB still running)"
            print_status "MongoDB is available for quick restart of services"
        fi
    else
        print_success "✅ All services stopped"
    fi
}

# Show logs
show_logs() {
    if $COMPOSE_CMD ps | grep -q "Up"; then
        $COMPOSE_CMD logs -f
    elif $COMPOSE_CMD -f docker-compose.gpu.yml ps 2>/dev/null | grep -q "Up"; then
        $COMPOSE_CMD -f docker-compose.gpu.yml logs -f
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
        "stop-all")
            stop_all_services
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