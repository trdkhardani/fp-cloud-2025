#!/usr/bin/env python3
"""
GPU-optimized runner for ITScence FastAPI backend
Provides enhanced performance through CUDA acceleration
"""

import os
import sys
import logging
import uvicorn
from gpu_config import initialize_gpu_config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Initialize GPU configuration and start the FastAPI server"""
    
    logger.info("🚀 Starting ITScence with GPU optimization...")
    
    # Initialize GPU configuration
    try:
        config_result = initialize_gpu_config()
        logger.info(f"GPU configuration status: {config_result['status']}")
        
        if config_result['status'] == 'success':
            gpu_info = config_result['gpu_info']
            logger.info(f"✅ Using {gpu_info['gpu_count']} GPU(s)")
        else:
            logger.warning("⚠️ Running on CPU (GPU not available)")
            
    except Exception as e:
        logger.error(f"❌ GPU initialization failed: {e}")
        logger.info("🔄 Falling back to CPU mode")
    
    # Start the FastAPI server
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))  # Use 1 worker for GPU to avoid conflicts
    
    logger.info(f"🌐 Starting server on {host}:{port}")
    
    try:
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=workers,
            reload=False,  # Disable reload in production
            log_level="info"
        )
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 