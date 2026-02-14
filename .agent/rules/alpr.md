# ALPR Development Rules

## Image Preprocessing
- **Always use OpenCV-compatible operations**: Grayscale → Bilateral Filter → CLAHE → Denoise
- **Preserve aspect ratios**: When resizing, maintain original plate proportions
- **Test on edge cases**: Require validation on night-time, rain, and backlit images
- **Preprocessing pipeline order**: 
  1. Bilateral filter (noise reduction + edge preservation)
  2. CLAHE (contrast enhancement)
  3. Grayscale conversion
  4. Denoising (subtle, preserve sharpness)
  5. Optional: Sharpening for text clarity

## OCR Validation
- **Regex patterns**: Must match local format (e.g., `^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}$` for Indian plates)
- **Confidence thresholds**: Require manual review if OCR confidence < 0.75
- **Character substitution**: Maintain lookup table for common errors:
  - `0` ↔ `O`
  - `1` ↔ `I`
  - `5` ↔ `S`
  - `8` ↔ `B`
  - `2` ↔ `Z`
- **Multi-scale OCR**: Test at 1.5x, 2.0x, 2.5x magnification ratios
- **Allowlist**: Only alphanumeric characters (A-Z, 0-9) for Indian plates

## Documentation Search
- **Prioritize Brave Search**: Use Brave over Google for technical queries
- **Version specificity**: Always specify YOLO version when searching (e.g., "YOLOv11" not "YOLO")
- **Include year**: Add "2024" or "2025" to searches for latest techniques

## Model Management
- **Versioning**: All weights in `/weights/` with semantic tags
  - Format: `{model}_v{major}.{minor}.{patch}_{architecture}_mAP{score}.pt`
  - Example: `specialized_plate_detector_v1.2.0_yolo11s_mAP87.pt`
- **Baseline preservation**: Never overwrite `baseline.json` or first production model
- **GPU logging**: Record training device (CPU/GPU) and VRAM usage in model metadata
- **Backup before deploy**: Copy current production model to `weights/backup/` before replacement

## Training Configuration
- **Minimum dataset requirements**:
  - Training: 500+ annotated images
  - Validation: 100+ images
  - Test: 50+ images from real-world scenarios
- **Data augmentation**: Always enable for small datasets
  - Rotation: ±15°
  - Perspective: 0.0005
  - HSV jitter: h=0.015, s=0.7, v=0.4
  - Mosaic: 1.0 (for multi-scale learning)
- **Image resolution**: Minimum 640px, recommended 1024px for small plates
- **Early stopping**: Enable with patience=50 epochs to prevent overfitting

## Testing Protocol
- **Minimum validation**: 50+ images across 5 lighting conditions before production:
  1. Bright daylight
  2. Overcast/cloudy
  3. Night with streetlights
  4. Vehicle headlight glare
  5. Shadows/partial obstruction
- **mAP requirement**: Deploy only if:
  - mAP@50 > 0.85, OR
  - Improvement > 5% over current baseline
- **A/B testing**: Run new model parallel to production for 24hrs before full cutover
- **Rollback plan**: Document procedure to revert to previous model if issues arise

## Performance Monitoring
- **Inference time**: Must remain < 200ms per image on target hardware
- **Memory usage**: GPU VRAM < 2GB for deployment (nano/small models)
- **Confidence distribution**: Log confidence scores to detect model degradation
- **Failure analysis**: Record all plates with confidence < 0.6 for retraining
