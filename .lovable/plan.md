
# Fix Horizontal Metrics Bars Not Showing Correct Colors

## Problem
The AuditDashboard metric bars (Critical Gaps, High Confidence, Section Coverage, etc.) show tiny colored slivers even when all values are 0. This happens because the code uses `Math.max(bar.value * 100, 2)` which forces a minimum 2% width even for zero values. When there is actual audit data with real metrics, the bars should fill proportionally with color -- but they always show the same tiny sliver regardless of the data.

Additionally, sample projects like "Mobile Car Pooling Business Plan" have a score of 92 and grade "A" but `auditResult: null`, so the dashboard shows all zeros despite the high score.

## Changes

### 1. Remove the 2% minimum width for zero-value bars (`src/components/AuditDashboard.tsx`)
- Change `Math.max(bar.value * 100, 2)` to just `bar.value * 100` so bars with 0 values show no colored fill
- This makes the bars visually honest: no data = no color

### 2. Fix the non-split bar rendering (same file)
- Currently at line 193: `width: barsVisible ? \`${Math.max(bar.value * 100, 2)}%\` : "0%"`
- Change to: `width: barsVisible ? \`${bar.value * 100}%\` : "0%"`

This is a one-line fix in `src/components/AuditDashboard.tsx`. The bars will now correctly show filled color proportional to the actual metric value, and show empty (no color) when the value is zero.
