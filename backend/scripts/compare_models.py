#!/usr/bin/env python3
"""
Model Comparison Script

Compares two model evaluation results and generates a detailed report
showing performance improvements/regressions.

Usage:
    python compare_models.py --baseline baseline.json --improved improved.json --output comparison.md
"""

import argparse
import json
from pathlib import Path
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(description='Compare two model evaluation results')
    parser.add_argument('--baseline', type=str, required=True, help='Baseline metrics JSON')
    parser.add_argument('--improved', type=str, required=True, help='Improved model metrics JSON')
    parser.add_argument('--output', type=str, default='comparison.md', help='Output markdown file')
    return parser.parse_args()

def format_delta(baseline, improved, is_time=False):
    """Format the delta between two metrics"""
    if baseline == 0:
        return "N/A"
    
    delta = improved - baseline
    pct = (delta / baseline) * 100
    
    # For time metrics, lower is better
    if is_time:
        arrow = "↓" if delta < 0 else "↑"
        color = "🟢" if delta < 0 else "🔴"
    else:
        arrow = "↑" if delta > 0 else "↓"
        color = "🟢" if delta > 0 else "🔴"
    
    return f"{color} {arrow} {abs(pct):.1f}%"

def generate_comparison_report(baseline_data, improved_data, output_path):
    """Generate markdown comparison report"""
    
    report = f"""# ALPR Model Comparison Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Models Compared

| Model | Path | Timestamp |
|-------|------|-----------|
| **Baseline** | `{baseline_data['model_path']}` | {baseline_data['timestamp']} |
| **Improved** | `{improved_data['model_path']}` | {improved_data['timestamp']} |

---

## Detection Performance

### Primary Metrics

| Metric | Baseline | Improved | Change |
|--------|----------|----------|--------|
| **Precision** | {baseline_data['detection_metrics']['precision']:.1%} | {improved_data['detection_metrics']['precision']:.1%} | {format_delta(baseline_data['detection_metrics']['precision'], improved_data['detection_metrics']['precision'])} |
| **Recall** | {baseline_data['detection_metrics']['recall']:.1%} | {improved_data['detection_metrics']['recall']:.1%} | {format_delta(baseline_data['detection_metrics']['recall'], improved_data['detection_metrics']['recall'])} |
| **F1 Score** | {baseline_data['detection_metrics']['f1_score']:.1%} | {improved_data['detection_metrics']['f1_score']:.1%} | {format_delta(baseline_data['detection_metrics']['f1_score'], improved_data['detection_metrics']['f1_score'])} |
| **mAP@50** | {baseline_data['detection_metrics']['mAP50']:.1%} | {improved_data['detection_metrics']['mAP50']:.1%} | {format_delta(baseline_data['detection_metrics']['mAP50'], improved_data['detection_metrics']['mAP50'])} |
| **mAP@50-95** | {baseline_data['detection_metrics']['mAP50_95']:.1%} | {improved_data['detection_metrics']['mAP50_95']:.1%} | {format_delta(baseline_data['detection_metrics']['mAP50_95'], improved_data['detection_metrics']['mAP50_95'])} |

### Detection Counts

| Metric | Baseline | Improved | Change |
|--------|----------|----------|--------|
| True Positives | {baseline_data['detection_metrics']['true_positives']} | {improved_data['detection_metrics']['true_positives']} | {improved_data['detection_metrics']['true_positives'] - baseline_data['detection_metrics']['true_positives']:+d} |
| False Positives | {baseline_data['detection_metrics']['false_positives']} | {improved_data['detection_metrics']['false_positives']} | {improved_data['detection_metrics']['false_positives'] - baseline_data['detection_metrics']['false_positives']:+d} |
| False Negatives | {baseline_data['detection_metrics']['false_negatives']} | {improved_data['detection_metrics']['false_negatives']} | {improved_data['detection_metrics']['false_negatives'] - baseline_data['detection_metrics']['false_negatives']:+d} |

---

## OCR Performance

| Metric | Baseline | Improved | Change |
|--------|----------|----------|--------|
| **Exact Match Rate** | {baseline_data['ocr_metrics']['exact_match_rate']:.1%} | {improved_data['ocr_metrics']['exact_match_rate']:.1%} | {format_delta(baseline_data['ocr_metrics']['exact_match_rate'], improved_data['ocr_metrics']['exact_match_rate'])} |
| **Avg Confidence** | {baseline_data['ocr_metrics']['avg_confidence']:.1%} | {improved_data['ocr_metrics']['avg_confidence']:.1%} | {format_delta(baseline_data['ocr_metrics']['avg_confidence'], improved_data['ocr_metrics']['avg_confidence'])} |
| **Samples Evaluated** | {baseline_data['ocr_metrics']['total_evaluated']} | {improved_data['ocr_metrics']['total_evaluated']} | {improved_data['ocr_metrics']['total_evaluated'] - baseline_data['ocr_metrics']['total_evaluated']:+d} |

---

## Performance Benchmarks

| Metric | Baseline | Improved | Change |
|--------|----------|----------|--------|
| **Avg Inference Time** | {baseline_data['performance']['avg_inference_time_ms']:.1f} ms | {improved_data['performance']['avg_inference_time_ms']:.1f} ms | {format_delta(baseline_data['performance']['avg_inference_time_ms'], improved_data['performance']['avg_inference_time_ms'], is_time=True)} |
| **Device** | {baseline_data['performance']['device']} | {improved_data['performance']['device']} | - |

---

## Overall Assessment

"""
    
    # Calculate overall grade
    map_delta = ((improved_data['detection_metrics']['mAP50'] / baseline_data['detection_metrics']['mAP50']) - 1) * 100
    ocr_delta = ((improved_data['ocr_metrics']['exact_match_rate'] / baseline_data['ocr_metrics']['exact_match_rate']) - 1) * 100 if baseline_data['ocr_metrics']['exact_match_rate'] > 0 else 0
    time_delta = ((improved_data['performance']['avg_inference_time_ms'] / baseline_data['performance']['avg_inference_time_ms']) - 1) * 100
    
    if map_delta > 5 and ocr_delta > 5:
        verdict = "✅ **SIGNIFICANT IMPROVEMENT** - Deploy immediately"
        report += f"""
### Verdict: {verdict}

The improved model shows substantial gains in both detection and OCR performance:
- Detection mAP improved by **{map_delta:+.1f}%**
- OCR accuracy improved by **{ocr_delta:+.1f}%**
- Performance impact: **{time_delta:+.1f}%** inference time

**Recommendation:** Deploy to production after smoke testing.
"""
    elif map_delta > 3 or ocr_delta > 3:
        verdict = "⚠️ **MODERATE IMPROVEMENT** - Consider deployment"
        report += f"""
### Verdict: {verdict}

The improved model shows measurable improvements:
- Detection mAP: **{map_delta:+.1f}%**
- OCR accuracy: **{ocr_delta:+.1f}%**
- Performance impact: **{time_delta:+.1f}%** inference time

**Recommendation:** Deploy if performance trade-off is acceptable, or continue tuning.
"""
    elif map_delta >= 0 and ocr_delta >= 0:
        verdict = "ℹ️ **MINIMAL CHANGE** - Optional upgrade"
        report += f"""
### Verdict: {verdict}

The improved model shows marginal or no improvement:
- Detection mAP: **{map_delta:+.1f}%**
- OCR accuracy: **{ocr_delta:+.1f}%**

**Recommendation:** Keep baseline model, investigate hyperparameters or dataset quality.
"""
    else:
        verdict = "❌ **REGRESSION** - Do not deploy"
        report += f"""
### Verdict: {verdict}

The improved model performs worse than baseline:
- Detection mAP: **{map_delta:+.1f}%**
- OCR accuracy: **{ocr_delta:+.1f}%**

**Recommendation:** Rollback to baseline, investigate overfitting or data issues.
"""
    
    report += f"""

---

## Next Steps

Based on the evaluation results, consider these actions:

"""
    
    if improved_data['detection_metrics']['recall'] < 0.90:
        report += "1. 🔍 **Improve Recall**: Lower confidence threshold or add more training data\n"
    
    if improved_data['detection_metrics']['precision'] < 0.85:
        report += "1. 🎯 **Improve Precision**: Raise confidence threshold or strengthen OCR validation\n"
    
    if improved_data['ocr_metrics']['exact_match_rate'] < 0.95:
        report += "1. 📝 **Improve OCR**: Increase mag_ratio, add TrOCR, or enhance preprocessing\n"
    
    if time_delta > 20:
        report += "1. ⚡ **Optimize Speed**: Consider smaller model variant or optimize preprocessing\n"
    
    if map_delta >= 5:
        report += "1. 🚀 **Deploy**: Model meets improvement threshold, proceed to production deployment\n"
    
    report += f"""

---

*Generated by ALPR Model Comparison Script*  
*Comparison Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    
    # Write report
    with open(output_path, 'w') as f:
        f.write(report)
    
    # Print summary
    print(f"\n{'='*60}")
    print("MODEL COMPARISON SUMMARY")
    print(f"{'='*60}\n")
    print(f"Detection mAP:  {baseline_data['detection_metrics']['mAP50']:.1%} → {improved_data['detection_metrics']['mAP50']:.1%} ({map_delta:+.1f}%)")
    print(f"OCR Accuracy:   {baseline_data['ocr_metrics']['exact_match_rate']:.1%} → {improved_data['ocr_metrics']['exact_match_rate']:.1%} ({ocr_delta:+.1f}%)")
    print(f"Inference Time: {baseline_data['performance']['avg_inference_time_ms']:.1f}ms → {improved_data['performance']['avg_inference_time_ms']:.1f}ms ({time_delta:+.1f}%)")
    print(f"\n{verdict}")
    print(f"\nDetailed report saved to: {output_path}\n")

def main():
    args = parse_args()
    
    # Load metrics files
    with open(args.baseline, 'r') as f:
        baseline_data = json.load(f)
    
    with open(args.improved, 'r') as f:
        improved_data = json.load(f)
    
    # Generate report
    generate_comparison_report(baseline_data, improved_data, args.output)

if __name__ == '__main__':
    main()
