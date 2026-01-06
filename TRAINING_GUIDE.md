# How to Train Your Own Detection Model

This guide will help you train a custom AI model for AutoToll AI using your own images.

## 1. Prepare Your Dataset

To train the AI, you need images of vehicles and labels telling the AI what they are.

1.  **Collect Images**: Gather photos of vehicles from your camera or download a dataset.
2.  **Annotate**: Use a tool like **[Roboflow](https://roboflow.com/)** or **CVAT** to draw boxes around vehicles and label them (Car, Truck, Bus, etc.).
3.  **Export**: Export your dataset in **YOLOv8** format.
    *   This will give you a folder structure with `images` and `labels`, and a `data.yaml` file.

## 2. Configure Training

1.  Place your dataset folder somewhere accessible (e.g., inside `backend/dataset`).
2.  Open the `data.yaml` file inside your dataset.
3.  Ensure the `path`, `train`, and `val` paths are correct. (See `backend/data_example.yaml` for reference).

## 3. Run Training

Open your terminal in the `backend` directory and run:

```bash
# Basic training (50 epochs)
python3 train.py --data /path/to/dataset/data.yaml

# Train for longer (100 epochs) for better accuracy
python3 train.py --data /path/to/dataset/data.yaml --epochs 100
```

*Note: Training can take anywhere from minutes to hours depending on your computer's speed (GPU recommended) and dataset size.*

## 4. Use Your New Model

Once training is finished:

1.  Find your new model file at: `backend/custom_training/autotoll_model/weights/best.pt`.
2.  Rename it to `my_model.pt` (optional).
3.  Open `backend/main.py` and update line 55:

```python
# Change this:
model = YOLO('yolov8n.pt')

# To this:
model = YOLO('custom_training/autotoll_model/weights/best.pt')
```

4.  Restart the backend server. Your system will now use your custom-trained brain!
