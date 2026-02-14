from ultralytics import YOLO
import os
import argparse
import torch
import yaml

def auto_detect_device():
    """Automatically detect and return best available device"""
    if torch.cuda.is_available():
        return '0'  # First CUDA GPU
    else:
        print("⚠️  No GPU detected. Training will use CPU (slower).")
        print("💡 Consider using Google Colab or cloud GPU for faster training.")
        return 'cpu'

def load_config(config_path, profile='balanced'):
    """Load training configuration from YAML"""
    if not os.path.exists(config_path):
        return None
    
    with open(config_path, 'r') as f:
        configs = yaml.safe_load(f)
    
    return configs.get(profile, {})

def train_model(data_yaml, epochs=100, img_size=1024, model_size='s', device=None, 
                batch_size=None, use_config=None, profile='balanced'):
    """
    Train a Custom YOLO Model (v8 or v11).
    
    Args:
        data_yaml (str): Path to the data.yaml file.
        epochs (int): Number of training epochs.
        img_size (int): Image resolution (640-1280 recommended).
        model_size (str): Model size ('n' for nano, 's' for small, 'm' for medium).
        device (str): Device to use ('0' for GPU, 'cpu', or None for auto-detect).
        batch_size (int): Batch size (None for auto).
        use_config (str): Path to YAML config file.
        profile (str): Config profile to use ('fast_training', 'balanced', 'high_accuracy').
    """
    
    # Load from config if specified
    config_params = {}
    if use_config:
        config_params = load_config(use_config, profile) or {}
        print(f"📋 Using config profile: {profile}")
    
    # Override with config values if not explicitly set
    epochs = config_params.get('epochs', epochs)
    img_size = config_params.get('imgsz', img_size)
    model_size = config_params.get('model', model_size).replace('.pt', '').replace('yolo11', '').replace('yolo8', '')
    batch_size = batch_size or config_params.get('batch', -1)  # -1 = auto
    
    # Auto-detect device if not specified
    if device is None:
        device = auto_detect_device()
    
    # Determine YOLO version (try v11 first, fallback to v8)
    model_name = f"yolo11{model_size}.pt"
    print(f"\n{'='*60}")
    print(f"ALPR Model Training")
    print(f"{'='*60}\n")
    print(f"Loading {model_name}...")
    
    try:
        model = YOLO(model_name)
        print(f"✓ Loaded YOLOv11{model_size} (latest architecture)")
    except Exception as e:
        print(f"⚠️  YOLOv11 not available ({e})")
        model_name = f"yolov8{model_size}.pt"
        print(f"Falling back to {model_name}...")
        model = YOLO(model_name)
        print(f"✓ Loaded YOLOv8{model_size}")
    
    print(f"\n📊 Training Configuration:")
    print(f"  Data:         {data_yaml}")
    print(f"  Epochs:       {epochs}")
    print(f"  Image Size:   {img_size}px")
    print(f"  Batch Size:   {batch_size if batch_size > 0 else 'Auto'}")
    print(f"  Device:       {device}")
    print(f"  Model:        {model_name}")
    
    # Optimized training parameters
    train_args = {
        'data': data_yaml,
        'epochs': epochs,
        'imgsz': img_size,
        'device': device,
        'project': 'custom_training',
        'name': 'autotoll_model',
        'batch': batch_size,
        
        # Augmentation for robustness
        'degrees': 15.0,          # Rotation augmentation for skewed angles
        'perspective': 0.0005,    # Perspective transform
        'hsv_h': 0.015,           # Hue variation (minimal for plates)
        'hsv_s': 0.7,             # Saturation variation (lighting)
        'hsv_v': 0.4,             # Value variation (brightness/contrast)
        'mosaic': 1.0,            # Multi-scale mosaic augmentation
        'flipud': 0.0,            # No vertical flip (plates are oriented)
        'fliplr': 0.0,            # No horizontal flip (text direction matters)
        
        # Optimization
        'optimizer': 'AdamW',     # Better convergence than SGD for small datasets
        'lr0': 0.001,             # Initial learning rate
        'lrf': 0.01,              # Final learning rate (1% of initial)
        'momentum': 0.937,
        'weight_decay': 0.0005,   # L2 regularization
        'warmup_epochs': 3.0,     # Warmup for stable start
        'patience': 50,           # Early stopping patience
        
        # Performance
        'workers': 4 if device != 'cpu' else 2,  # Reduce workers for CPU
        'verbose': True,
        'save': True,
        'save_period': -1,        # Only save best/last
        'plots': True             # Generate training plots
    }
    
    print(f"\n🚀 Starting training...")
    print(f"{'='*60}\n")
    
    # Train the model
    results = model.train(**train_args)
    
    print(f"\n{'='*60}")
    print("✅ Training Complete!")
    print(f"{'='*60}\n")
    
    best_path = "custom_training/autotoll_model/weights/best.pt"
    print(f"📦 Best model saved to: {best_path}")
    
    # Auto-copy to backend root as the specialized detector
    target_path = "specialized_plate_detector.pt"
    if os.path.exists(best_path):
        import shutil
        
        # Backup existing model if present
        if os.path.exists(target_path):
            backup_path = f"weights/backup/specialized_plate_detector_backup_{int(__import__('time').time())}.pt"
            os.makedirs('weights/backup', exist_ok=True)
            shutil.copy(target_path, backup_path)
            print(f"📁 Backed up existing model to: {backup_path}")
        
        shutil.copy(best_path, target_path)
        print(f"🎯 Model deployed to: {target_path}")
        print(f"\n💡 Restart the backend server to use the new model!")
    
    return results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train AutoToll Custom ALPR Model')
    parser.add_argument('--data', type=str, default='../data.yaml', help='Path to data.yaml file')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs (default: 100)')
    parser.add_argument('--imgsz', '--img-size', type=int, default=1024, dest='imgsz', 
                       help='Image size in pixels (default: 1024)')
    parser.add_argument('--model', type=str, default='s', choices=['n', 's', 'm', 'l'], 
                       help='YOLO model size: n=nano, s=small, m=medium, l=large (default: s)')
    parser.add_argument('--device', type=str, default=None, 
                       help='Device (0 for GPU, cpu for CPU, None for auto-detect)')
    parser.add_argument('--batch', type=int, default=-1, 
                       help='Batch size (-1 for auto-detect based on memory)')
    parser.add_argument('--config', type=str, default=None, 
                       help='Path to training config YAML (overrides individual params)')
    parser.add_argument('--profile', type=str, default='balanced', 
                       choices=['fast_training', 'balanced', 'high_accuracy'],
                       help='Config profile to use with --config')
    parser.add_argument('--generate', action='store_true', 
                       help='Generate synthetic data before training')
    
    args = parser.parse_args()
    
    # Generate synthetic data if requested
    if args.generate:
        print("🎨 Generating synthetic training data...")
        try:
            import generate_synthetic_plates
            generate_synthetic_plates.generate_dataset(num_train=500, num_val=100)
            print("✓ Synthetic data generated\n")
        except Exception as e:
            print(f"⚠️  Synthetic generation failed: {e}")
            print("Continuing with existing dataset...\n")
    
    # Verify data.yaml exists
    if not os.path.exists(args.data):
        print(f"❌ ERROR: Configuration file '{args.data}' not found!")
        print(f"💡 Use --generate to create synthetic data, or provide valid --data path")
        exit(1)
    
    # Run training
    train_model(
        data_yaml=args.data,
        epochs=args.epochs,
        img_size=args.imgsz,
        model_size=args.model,
        device=args.device,
        batch_size=args.batch,
        use_config=args.config,
        profile=args.profile
    )

