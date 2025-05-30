"""
GPU Configuration for ITScence
Optimizes TensorFlow and DeepFace for NVIDIA GPU usage
Compatible with CUDA 12.2.2 and cuDNN 8.9+
"""

import os
import logging
from typing import Optional

# Set TensorFlow environment variables before importing TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'  # Allow GPU memory growth
os.environ['TF_GPU_MEMORY_LIMIT'] = '2048'  # Limit GPU memory usage (MB)

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None

logger = logging.getLogger(__name__)

def configure_gpu_memory(memory_limit_mb: Optional[int] = None) -> bool:
    """
    Configure GPU memory usage for TensorFlow
    
    Args:
        memory_limit_mb: Maximum GPU memory to use in MB. If None, uses growth mode.
    
    Returns:
        bool: True if GPU configuration was successful
    """
    if not TF_AVAILABLE:
        logger.warning("TensorFlow not available")
        return False
    
    try:
        gpus = tf.config.experimental.list_physical_devices('GPU')
        
        if not gpus:
            logger.warning("No GPU devices found")
            return False
        
        logger.info(f"Found {len(gpus)} GPU device(s)")
        
        for gpu in gpus:
            if memory_limit_mb:
                # Set memory limit
                tf.config.experimental.set_memory_growth(gpu, True)
                tf.config.experimental.set_virtual_device_configuration(
                    gpu,
                    [tf.config.experimental.VirtualDeviceConfiguration(
                        memory_limit=memory_limit_mb
                    )]
                )
                logger.info(f"GPU memory limit set to {memory_limit_mb}MB")
            else:
                # Enable memory growth
                tf.config.experimental.set_memory_growth(gpu, True)
                logger.info("GPU memory growth enabled")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to configure GPU: {e}")
        return False

def get_gpu_info() -> dict:
    """
    Get information about available GPUs
    
    Returns:
        dict: GPU information
    """
    info = {
        "tensorflow_available": TF_AVAILABLE,
        "gpu_available": False,
        "gpu_count": 0,
        "gpu_names": [],
        "gpu_memory": [],
        "cuda_version": None,
        "cudnn_version": None
    }
    
    if not TF_AVAILABLE:
        return info
    
    try:
        gpus = tf.config.experimental.list_physical_devices('GPU')
        info["gpu_available"] = len(gpus) > 0
        info["gpu_count"] = len(gpus)
        
        # Get CUDA and cuDNN versions
        if hasattr(tf.sysconfig, 'get_build_info'):
            build_info = tf.sysconfig.get_build_info()
            info["cuda_version"] = build_info.get("cuda_version", "Unknown")
            info["cudnn_version"] = build_info.get("cudnn_version", "Unknown")
        
        for gpu in gpus:
            # Get GPU name
            name = gpu.name.split('/')[-1] if '/' in gpu.name else gpu.name
            info["gpu_names"].append(name)
            
            # Try to get memory info (may not work on all systems)
            try:
                memory_info = tf.config.experimental.get_memory_info(gpu)
                info["gpu_memory"].append({
                    "current": memory_info.get("current", 0),
                    "peak": memory_info.get("peak", 0)
                })
            except:
                info["gpu_memory"].append({"current": "unknown", "peak": "unknown"})
        
    except Exception as e:
        logger.error(f"Error getting GPU info: {e}")
    
    return info

def optimize_for_inference() -> None:
    """
    Optimize TensorFlow for inference performance with CUDA 12.2.2
    """
    if not TF_AVAILABLE:
        return
    
    try:
        # Disable unnecessary TensorFlow features for inference
        tf.config.threading.set_inter_op_parallelism_threads(0)  # Use all available cores
        tf.config.threading.set_intra_op_parallelism_threads(0)  # Use all available cores
        
        # Enable mixed precision if GPU supports it (Ampere+ architecture)
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            try:
                # Check if GPU supports mixed precision
                policy = tf.keras.mixed_precision.Policy('mixed_float16')
                tf.keras.mixed_precision.set_global_policy(policy)
                logger.info("Mixed precision enabled for better performance")
            except Exception as e:
                logger.warning(f"Mixed precision not supported: {e}")
        
        # Optimize for CUDA 12.2.2 specific features
        os.environ['TF_ENABLE_ONEDNN_OPTS'] = '1'  # Enable oneDNN optimizations
        
    except Exception as e:
        logger.warning(f"Could not optimize for inference: {e}")

def initialize_gpu_config() -> dict:
    """
    Initialize GPU configuration with optimal settings for CUDA 12.2.2
    
    Returns:
        dict: Configuration status and GPU information
    """
    logger.info("Initializing GPU configuration for CUDA 12.2.2...")
    
    # Configure GPU memory
    memory_limit = int(os.getenv('TF_GPU_MEMORY_LIMIT', '2048'))
    gpu_configured = configure_gpu_memory(memory_limit)
    
    # Optimize for inference
    optimize_for_inference()
    
    # Get GPU information
    gpu_info = get_gpu_info()
    
    # Log configuration status
    if gpu_info["gpu_available"]:
        logger.info(f"✅ GPU configuration successful - {gpu_info['gpu_count']} GPU(s) available")
        logger.info(f"   CUDA Version: {gpu_info.get('cuda_version', 'Unknown')}")
        logger.info(f"   cuDNN Version: {gpu_info.get('cudnn_version', 'Unknown')}")
        for i, name in enumerate(gpu_info["gpu_names"]):
            logger.info(f"   GPU {i}: {name}")
    else:
        logger.warning("⚠️ No GPU available - using CPU")
    
    return {
        "gpu_configured": gpu_configured,
        "gpu_info": gpu_info,
        "status": "success" if gpu_configured else "cpu_fallback"
    }

# Auto-initialize when module is imported
if __name__ != "__main__":
    try:
        config_result = initialize_gpu_config()
    except Exception as e:
        logger.error(f"Failed to initialize GPU configuration: {e}")
        config_result = {"status": "error", "error": str(e)} 