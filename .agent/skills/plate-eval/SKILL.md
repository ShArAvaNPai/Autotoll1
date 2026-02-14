---
name: Plate Evaluation
description: Runs current model against validation set and returns JSON metrics with automated recommendations
---

# Plate Evaluation Skill

Quick evaluation utility for assessing license plate detection model performance and providing actionable recommendations.

## Usage

```bash
cd /home/lol/Downloads/autotoll-ai/backend
python scripts/evaluate.py --data ../data.yaml --model specialized_plate_detector.pt
```

## Workflow

### 1. Execute Evaluation

Run the evaluation script on the validation dataset:

```bash
python scripts/evaluate.py \
    --data ./data.yaml \
    --model specialized_plate_detector.pt \
    --output current_metrics.json
```

**Output format:**
```json
{
  "model_path": "specialized_plate_detector.pt",
  "timestamp": "2026-01-31T11:30:00",
  "detection_metrics": {
    "precision": 0.891,
    "recall": 0.911,
    "mAP50": 0.906,
    "mAP50_95": 0.631
  },
  "ocr_metrics": {
    "character_accuracy": 0.94,
    "exact_match_rate": 0.82,
    "avg_confidence": 0.87
  },
  "performance": {
    "avg_inference_time_ms": 145,
    "device": "cuda:0"
  }
}
```

### 2. Compare Against Baseline

Load baseline metrics and calculate deltas:

```bash
python -c "
import json

with open('baseline.json') as f:
    baseline = json.load(f)
with open('current_metrics.json') as f:
    current = json.load(f)

print('Performance Comparison:')
print(f\"mAP50: {baseline['detection_metrics']['mAP50']:.3f} → {current['detection_metrics']['mAP50']:.3f} ({((current['detection_metrics']['mAP50']/baseline['detection_metrics']['mAP50']-1)*100):+.1f}%)\")
print(f\"OCR Accuracy: {baseline['ocr_metrics']['exact_match_rate']:.3f} → {current['ocr_metrics']['exact_match_rate']:.3f} ({((current['ocr_metrics']['exact_match_rate']/baseline['ocr_metrics']['exact_match_rate']-1)*100):+.1f}%)\")
"
```

### 3. Automated Decision Logic

The skill analyzes metrics and provides recommendations:

#### If OCR Accuracy < 95%

**Diagnosis:** OCR stage is the bottleneck

**Recommendations:**
1. **Increase EasyOCR magnification ratio:**
   - Edit `backend/main.py` line 934, 984
   - Change `mag_ratio=1.5` to `mag_ratio=2.0` or higher
   - Trade-off: Slower inference (+20-40ms) for better accuracy

2. **Implement TrOCR (ViT-based OCR):**
   - Install: `pip install transformers torch`
   - Add TrOCR inference as fallback for low-confidence detections
   - Expected: +10-15% OCR accuracy improvement

3. **Enhance preprocessing:**
   - Add bilateral filter before CLAHE
   - Implement adaptive thresholding for varied lighting
   - Use unsharp masking to sharpen text edges

#### If mAP50 < 0.85

**Diagnosis:** Detection stage missing plates or producing false positives

**Recommendations:**
1. **Increase training epochs:**
   - Current model may be undertrained
   - Re-run training with `--epochs 150` or `--epochs 200`

2. **Improve data augmentation:**
   - Add perspective transforms for skewed angles
   - Increase HSV variation for lighting robustness
   - Enable mosaic augmentation (multi-scale)

3. **Upgrade model architecture:**
   - Switch from YOLOv8n (nano) to YOLOv8s (small)
   - Consider YOLOv11 with OBB for rotation handling
   - Trade-off: Higher accuracy but slower inference

#### If Recall < 0.90

**Diagnosis:** Model missing valid plates (false negatives)

**Recommendations:**
1. **Lower confidence threshold:**
   - Edit detection confidence in `backend/main.py`
   - Default YOLO confidence is 0.25, try 0.15-0.20
   - Increases detections but may add false positives

2. **Check for dataset imbalance:**
   - Verify validation set has diverse scenarios
   - Inspect missed detections for patterns (angles, lighting)
   - Add more training data for underrepresented cases

3. **Enable specialized plate model:**
   - Train custom detector: `python train.py --data ../data.yaml --epochs 100`
   - Specialist model focuses only on plates, not general vehicles

#### If Precision < 0.85

**Diagnosis:** Too many false positives (non-plates detected)

**Recommendations:**
1. **Raise confidence threshold:**
   - Increase from default 0.25 to 0.35-0.40
   - Reduces false alarms at cost of some missed plates

2. **Improve regex filtering:**
   - Strengthen validation in `score_plate()` function
   - Add more brand names to blacklist
   - Require minimum alphanumeric mix

3. **Add negative samples to training:**
   - Include images without plates
   - Train model to recognize "background" class
   - Reduces false positives on signage, text

## Output Summary

The skill returns a JSON summary with actionable items:

```json
{
  "evaluation_date": "2026-01-31",
  "overall_grade": "B+",
  "bottleneck": "OCR accuracy",
  "recommendations": [
    {
      "priority": "HIGH",
      "action": "Increase mag_ratio to 2.5",
      "expected_improvement": "+8% OCR accuracy",
      "implementation_time": "5 minutes"
    },
    {
      "priority": "MEDIUM",
      "action": "Add bilateral filter preprocessing",
      "expected_improvement": "+3% mAP, +5% OCR in low light",
      "implementation_time": "15 minutes"
    }
  ],
  "deploy_decision": "RECOMMEND_IMPROVEMENTS_FIRST"
}
```

## Integration with ALPR Optimizer

This skill is designed to be called within the ALPR Optimizer workflow:
1. **Pre-training:** Baseline evaluation
2. **Post-training:** Improved model evaluation
3. **Decision point:** Auto-approve deployment if metrics meet thresholds
