---
name: ALPR Optimizer
description: Automated training and validation pipeline for license plate detection models
---

# ALPR Optimizer Skill

This skill automates the complete training-validation loop for improving license plate detection models.

## Prerequisites

- Dataset configured in `data.yaml` with train/val splits
- GPU available (recommended) or CPU fallback
- Ultralytics package installed (`pip install ultralytics`)

## Workflow

### 1. Setup Phase

**Verify GPU availability:**
```bash
nvidia-smi || echo "No NVIDIA GPU detected, will use CPU"
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}')"
```

**Validate dataset:**
```bash
# Check data.yaml exists and paths are valid
python -c "
import yaml
import os

with open('data.yaml', 'r') as f:
    config = yaml.safe_load(f)
    
base_path = config.get('path', '.')
train_path = os.path.join(base_path, config.get('train', ''))
val_path = os.path.join(base_path, config.get('val', ''))

print(f'Base: {base_path}')
print(f'Train: {train_path} - Exists: {os.path.exists(train_path)}')
print(f'Val: {val_path} - Exists: {os.path.exists(val_path)}')
"
```

**Create baseline:**
```bash
cd backend
python scripts/evaluate.py --model yolov8n.pt --data ../data.yaml --output baseline.json
```

### 2. Training Phase

**Execute training with optimal config:**
```bash
cd backend

# Auto-detect GPU and select device
DEVICE=$(python -c "import torch; print('0' if torch.cuda.is_available() else 'cpu')")

# Train with balanced configuration
python train.py \
    --data ../data.yaml \
    --model s \
    --epochs 100 \
    --device $DEVICE
```

**Monitor training:**
- Watch for mAP convergence in logs
- Best model auto-saved to `custom_training/autotoll_model/weights/best.pt`
- Checkpoint copied to `specialized_plate_detector.pt`

### 3. Validation Phase

**Evaluate new model:**
```bash
cd backend
python scripts/evaluate.py \
    --model specialized_plate_detector.pt \
    --data ../data.yaml \
    --output improved.json
```

**Compare performance:**
```bash
python scripts/compare_models.py \
    --baseline baseline.json \
    --improved improved.json \
    --output ../artifacts/mAP_comparison.md
```

**Decision criteria:**
- If mAP improvement > 3%: Deploy to production
- If 0-3% improvement: Optional upgrade, user decision
- If negative: Rollback, investigate overfitting

### 4. Deployment

**Version and backup:**
```bash
# Backup current production model
cp specialized_plate_detector.pt weights/backup/specialized_plate_detector_$(date +%Y%m%d).pt

# Version new model
VERSION="v1.1.0"
MAP_SCORE=$(python -c "import json; print(int(json.load(open('improved.json'))['mAP50']*100))")
cp specialized_plate_detector.pt weights/specialized_plate_detector_${VERSION}_mAP${MAP_SCORE}.pt
```

**Update deployment:**
- Restart backend server
- Run smoke tests on 10 sample images
- Monitor first 100 detections for anomalies

### 5. Reporting

**Generate walkthrough artifact:**
- Document mAP improvements
- Include confusion matrices
- Show failure case analysis
- List hyperparameters used

**Log to history:**
```bash
echo "$(date '+%Y-%m-%d %H:%M:%S'),${VERSION},${MAP_SCORE},${DEVICE}" >> training_history.csv
```

## Troubleshooting

**Out of memory during training:**
- Reduce batch size: Add `--batch 16` or `--batch 8`
- Use smaller model: `--model n` instead of `--model s`
- Reduce image size: Add `--imgsz 640` instead of default 1024

**Poor convergence:**
- Increase epochs: `--epochs 150`
- Enable augmentation: Check data.yaml has augmentation params
- Verify dataset quality: Remove corrupted images

**Low mAP on validation:**
- Check dataset balance: Ensure train/val split is representative
- Inspect failure cases: Run visual inspection on low-confidence detections
- Consider transfer learning: Start from pre-trained COCO weights
