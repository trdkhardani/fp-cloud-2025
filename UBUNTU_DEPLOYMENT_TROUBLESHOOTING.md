# Ubuntu Production Deployment Troubleshooting

## Common Issues and Solutions

### 1. TensorFlow/TensorRT Dependency Conflicts

**Error:** `No matching distribution found for tensorrt-libs==8.6.1`

**Solution:**
```bash
# Clean any existing containers and images
./docker-deploy.sh stop
docker system prune -a

# Try deploying with CPU first to test basic functionality
./docker-deploy.sh cpu

# If you need GPU support, ensure NVIDIA Container Toolkit is installed:
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Test GPU Docker support:
docker run --rm --gpus all nvidia/cuda:12.2.2-base-ubuntu22.04 nvidia-smi

# Deploy GPU version:
./docker-deploy.sh gpu
```

### 2. Docker Permission Issues

**Error:** `Got permission denied while trying to connect to the Docker daemon socket`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Test Docker without sudo:
docker ps
```

### 3. Memory/Disk Space Issues

**Error:** `No space left on device` or build failures

**Solution:**
```bash
# Check disk space:
df -h

# Clean Docker system:
docker system prune -a --volumes

# Check Docker space usage:
docker system df

# Free up space if needed:
sudo apt autoremove
sudo apt autoclean
```

### 4. Network/Port Conflicts

**Error:** `Port already in use` or `Address already in use`

**Solution:**
```bash
# Check what's using the ports:
sudo netstat -tulpn | grep :9090
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :27017

# Stop conflicting services:
sudo systemctl stop apache2  # if running
sudo systemctl stop nginx    # if running

# Or change ports in docker-compose.yml:
# ports:
#   - "9091:80"  # Change from 9090 to 9091
```

### 5. MongoDB Connection Issues

**Error:** `Database connection failed`

**Solution:**
```bash
# Check MongoDB container status:
docker ps | grep mongodb

# Check MongoDB logs:
docker logs itscence-mongodb

# Restart just MongoDB:
docker restart itscence-mongodb

# If persistent issues, recreate with fresh data:
./docker-deploy.sh stop
docker volume rm $(docker volume ls -q | grep mongodb)
./docker-deploy.sh auto
```

### 6. Build Cache Issues

**Error:** Outdated dependencies or cached layers causing problems

**Solution:**
```bash
# Force rebuild without cache:
docker compose build --no-cache
# or
docker compose -f docker-compose.gpu.yml build --no-cache

# Clean all build cache:
docker builder prune -a
```

### 7. Ubuntu-Specific Issues

#### For Ubuntu 20.04/22.04:

```bash
# Update system packages:
sudo apt update && sudo apt upgrade -y

# Install required packages:
sudo apt install -y curl wget git

# For GPU support, install NVIDIA drivers:
sudo apt install -y nvidia-driver-535
sudo reboot

# Install Docker if not present:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 8. Firewall Issues

```bash
# Check if UFW is blocking ports:
sudo ufw status

# Allow required ports:
sudo ufw allow 9090/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 27017/tcp

# Or disable UFW temporarily for testing:
sudo ufw disable
```

## Debug Commands

### Check System Resources
```bash
# Memory usage:
free -h

# CPU usage:
top -b -n1 | head -20

# Disk usage:
df -h
du -sh /var/lib/docker

# GPU status (if NVIDIA):
nvidia-smi
```

### Docker Debug Commands
```bash
# Container logs:
docker logs itscence-frontend
docker logs itscence-backend
docker logs itscence-mongodb

# Container shell access:
docker exec -it itscence-backend /bin/bash

# Network inspection:
docker network ls
docker network inspect itscence-network

# Volume inspection:
docker volume ls
docker volume inspect mongodb_data
```

### Quick Deployment Test
```bash
# Test minimal deployment:
git clone <repo>
cd itscence-project
chmod +x docker-deploy.sh

# Test with CPU only first:
./docker-deploy.sh cpu

# Check if services start:
./docker-deploy.sh status

# Check logs if issues:
./docker-deploy.sh logs
```

## Performance Optimization for Production

### 1. Resource Limits
Edit `docker-compose.yml` to add resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### 2. Production Environment Variables
```bash
# Create .env file:
echo "NODE_ENV=production" > .env
echo "TF_CPP_MIN_LOG_LEVEL=2" >> .env
echo "MONGODB_URL=mongodb://admin:password123@mongodb:27017/itscence?authSource=admin" >> .env
```

### 3. Monitoring
```bash
# Monitor resource usage:
docker stats

# Monitor logs in real-time:
./docker-deploy.sh logs
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:** `./docker-deploy.sh logs`
2. **Check system resources:** Run the debug commands above
3. **Try CPU-only deployment first:** `./docker-deploy.sh cpu`
4. **Clean everything and start fresh:** 
   ```bash
   ./docker-deploy.sh stop
   docker system prune -a
   ./docker-deploy.sh auto
   ```

5. **Create an issue** with:
   - Ubuntu version: `lsb_release -a`
   - Docker version: `docker --version`
   - Complete error logs
   - Output of `./docker-deploy.sh status` 