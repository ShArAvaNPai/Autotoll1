from ultralytics import YOLO
import os
import argparse

def train_model(data_yaml, epochs=50, img_size=640, model_size='n'):
    """
    Train a Custom YOLOv8 Model.
    
    Args:
        data_yaml (str): Path to the data.yaml file.
        epochs (int): Number of training epochs.
        img_size (int): Image resolution.
        model_size (str): Model size ('n' for nano, 's' for small, 'm' for medium).
    """
    
    # Load a model
    # 'yolov8n.pt' will download automatically if not present
    model_name = f"yolov8{model_size}.pt"
    print(f"Loading {model_name}...")
    model = YOLO(model_name)  # load a pretrained model (recommended for training)

    print(f"Starting training for {epochs} epochs on {data_yaml}...")
    
    # Train the model
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=img_size,
        device='cpu', # Force CPU for reliable compatibility in this env
        project='custom_training',
        name='autotoll_model'
    )
    
    print("Training Complete!")
    best_path = "custom_training/autotoll_model/weights/best.pt"
    print(f"Best model saved to: {best_path}")
    
    # Auto-copy to backend root as the specialized detector
    target_path = "specialized_plate_detector.pt"
    if os.path.exists(best_path):
        import shutil
        shutil.copy(best_path, target_path)
        print(f"Model automatically deployed to {target_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train AutoToll Custom Model')
    parser.add_argument('--data', type=str, default='data.yaml', help='Path to data.yaml file')
    parser.add_argument('--epochs', type=int, default=10, help='Number of epochs') # Reduced default for speed
    parser.add_argument('--model', type=str, default='n', choices=['n', 's', 'm'], help='YOLOv8 model size')
    parser.add_argument('--generate', action='store_true', help='Generate synthetic data before training')
    
    args = parser.parse_args()
    
    if args.generate:
        print("Generating synthetic data...")
        import generate_synthetic_plates
        generate_synthetic_plates.generate_dataset(num_train=200, num_val=50)
        # Ensure data.yaml exists now
    
    if not os.path.exists(args.data):
        print(f"Error: configuration file '{args.data}' not found. Did you forget --generate?")
        exit(1)
        
    train_model(args.data, args.epochs, model_size=args.model)
