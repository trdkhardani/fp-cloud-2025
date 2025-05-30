#!/bin/bash

# Docker Reset Attendance History Script
# This script resets the attendance history in a Docker environment

set -e  # Exit on any error

echo "🐳 Docker Face Attendance History Reset Tool"
echo "=============================================="

# Default values
BACKUP=${BACKUP:-false}
CONFIRM=${CONFIRM:-false}
STATS_ONLY=${STATS_ONLY:-false}
CONTAINER_NAME=${CONTAINER_NAME:-"face-attend-backend"}
MONGODB_URL=${MONGODB_URL:-"mongodb://mongodb:27017"}
DATABASE_NAME=${DATABASE_NAME:-"faceattend"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "Docker is available"
}

# Function to check if container exists and is running
check_container() {
    if ! docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        print_warning "Container '$CONTAINER_NAME' is not running"
        
        # Check if container exists but is stopped
        if docker ps -a -q -f name="$CONTAINER_NAME" | grep -q .; then
            print_info "Container exists but is stopped. Starting container..."
            docker start "$CONTAINER_NAME"
            sleep 5  # Wait for container to start
        else
            print_error "Container '$CONTAINER_NAME' does not exist"
            print_info "Available containers:"
            docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
            exit 1
        fi
    fi
    
    print_success "Container '$CONTAINER_NAME' is running"
}

# Function to run the reset script in Docker container
run_reset_script() {
    local args=""
    
    # Build arguments
    if [ "$CONFIRM" = "true" ]; then
        args="$args --confirm"
    fi
    
    if [ "$BACKUP" = "true" ]; then
        args="$args --backup"
    fi
    
    if [ "$STATS_ONLY" = "true" ]; then
        args="$args --stats-only"
    fi
    
    print_info "Running reset script in container with args: $args"
    
    # Set environment variables and run the script
    docker exec -e MONGODB_URL="$MONGODB_URL" -e DATABASE_NAME="$DATABASE_NAME" \
        "$CONTAINER_NAME" python reset_attendance_history.py $args
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --backup              Create backup before reset"
    echo "  --confirm             Skip confirmation prompt"
    echo "  --stats-only          Only show statistics, don't reset"
    echo "  --container NAME      Docker container name (default: face-attend-backend)"
    echo "  --mongodb-url URL     MongoDB connection URL (default: mongodb://mongodb:27017)"
    echo "  --database NAME       Database name (default: faceattend)"
    echo "  --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP=true           Same as --backup"
    echo "  CONFIRM=true          Same as --confirm"
    echo "  STATS_ONLY=true       Same as --stats-only"
    echo "  CONTAINER_NAME        Same as --container"
    echo "  MONGODB_URL           Same as --mongodb-url"
    echo "  DATABASE_NAME         Same as --database"
    echo ""
    echo "Examples:"
    echo "  $0 --stats-only                    # Show statistics only"
    echo "  $0 --backup --confirm              # Create backup and reset without prompt"
    echo "  BACKUP=true CONFIRM=true $0        # Same as above using env vars"
    echo "  $0 --container my-backend          # Use different container name"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            BACKUP=true
            shift
            ;;
        --confirm)
            CONFIRM=true
            shift
            ;;
        --stats-only)
            STATS_ONLY=true
            shift
            ;;
        --container)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        --mongodb-url)
            MONGODB_URL="$2"
            shift 2
            ;;
        --database)
            DATABASE_NAME="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_info "Configuration:"
    echo "  Container: $CONTAINER_NAME"
    echo "  MongoDB URL: $MONGODB_URL"
    echo "  Database: $DATABASE_NAME"
    echo "  Backup: $BACKUP"
    echo "  Confirm: $CONFIRM"
    echo "  Stats Only: $STATS_ONLY"
    echo ""
    
    # Check prerequisites
    check_docker
    check_container
    
    # Run the reset script
    print_info "Executing reset script..."
    run_reset_script
    
    print_success "Operation completed!"
}

# Run main function
main 