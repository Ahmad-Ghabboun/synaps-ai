# Replace ScoreGauge with AuditDashboard Component

## Overview

Create a new `src/components/AuditDashboard.tsx` component with three visual sections inspired by the reference image: a glowing circular ring, five animated metric bars, and three slot-machine flip counters. Replace the `ScoreGauge` usage in the Audit tab with this new component.

---

## 1. New File: `src/components/AuditDashboard.tsx`

A single self-contained component with props: `score`, `grade`, `auditResult`, `sectionsCount`.

### Internal computed values:

- `criticalCount` = risks with severity "critical"
- `moderateCount` = risks with severity "moderate"
- `totalGaps` = criticalCount + moderateCount
- `highConfidenceCount` = risks with confidence "high"
- `resolvedCount` = 0 (no removed-risks tracking yet; placeholder for future)

### Section A: Glowing Circular Ring

- SVG circle with animated stroke-dashoffset counting up from 0 to score
- Score percentage text in center with grade below
- CSS classes for dark mode: cyan-to-purple neon gradient (`conic-gradient` or SVG `linearGradient`), outer glow via `filter: drop-shadow` with animated rotation using CSS `@keyframes rotate-glow`
- Light mode: blue-to-indigo gradient with soft `box-shadow`
- After load animation completes, outer glow ring rotates continuously via a second SVG circle with rotating gradient

### Section B: Five Metric Bar Rows

Each row is a rounded card containing:

- Label text (left), fraction/percentage + badge (right)
- Animated horizontal bar that grows from 0 to target width on mount using CSS transition
- Continuous shimmer overlay using a pseudo-element with `@keyframes shimmer` (translateX sweep)
- Dark mode: neon glow on bar via `box-shadow` in respective color
- Light mode: soft white sheen sweep, subtle drop shadow


| Row                 | Color  | Value                             | Badge           |
| ------------------- | ------ | --------------------------------- | --------------- |
| Critical Gaps       | Red    | criticalCount / totalGaps         | "High Severity" |
| High Confidence     | Blue   | highConfidenceCount / totalGaps % | "AI Validated"  |
| Section Coverage    | Green  | sectionsCount / 12                | "Completeness"  |
| Confidence Ratio    | Purple | highConfidence% vs moderate split | "Reliability"   |
| Gap Resolution Rate | Teal   | resolvedCount / totalGaps         | "Progress"      |


### Section C: Three Flip Counter Cards

- Each card shows a number with a slot-machine digit-flip animation on mount (CSS `@keyframes flip-digit` using rotateX transform)
- After loading, each card has a breathing glow pulse on its border (`@keyframes breathe-glow`)
- Dark mode: neon border glow in respective color
- Light mode: colored `box-shadow` pulse (Apple-style depth)


| Counter  | Color       | Value         |
| -------- | ----------- | ------------- |
| Critical | Red tint    | criticalCount |
| Moderate | Yellow tint | moderateCount |
| Sections | Neutral     | sectionsCount |


---

## 2. Modify: `src/pages/Workspace.tsx`

- Remove the `ScoreGauge` function component (lines 112-155)
- Add import: `import AuditDashboard from "@/components/AuditDashboard"`
- Replace line 849 (`<ScoreGauge score={...} grade={...} />`) with:
`<AuditDashboard score={currentProject.score} grade={currentProject.grade} auditResult={activeAudit} sectionsCount={sections.length} />`

---

## 3. CSS Additions in `src/index.css`

Add keyframes and utility classes:

- `@keyframes rotate-glow` -- 360deg rotation over 4s linear infinite
- `@keyframes shimmer` -- translateX(-100% to 200%) over 2s ease infinite
- `@keyframes breathe-glow` -- box-shadow pulse opacity 0.4 to 1 over 2s ease-in-out infinite
- `@keyframes flip-digit` -- rotateX(0 to 360) over 0.6s
- `.dark` variants for neon colors vs light mode soft shadows

---

## Technical Notes

- All animations use CSS (no framer-motion dependency needed)
- The SVG gradient for the ring uses `<linearGradient>` with two stops, applied to the stroke
- The rotating outer glow is a second SVG circle with lower opacity and a CSS `rotate-glow` animation
- Bar shimmer uses an `::after` pseudo-element with a white-to-transparent gradient sweeping across
- Flip counters use a `useEffect` with `setTimeout` cascade to trigger digit changes with rotateX transitions
- Dark/light mode detection via Tailwind's `dark:` prefix classes throughout  
  
"For Gap Resolution Rate, compute resolvedCount as the number of risks where `isFixing === true` has completed, or simply show 0/totalGaps with the bar empty and a label that says 'Fix issues to track progress' — so it looks intentional rather than broken."  
  
Confirm:
  - That it creates `AuditDashboard.tsx` as a new file, not inline in Workspace.tsx
  - That it removes `ScoreGauge` entirely and doesn't leave it as dead code