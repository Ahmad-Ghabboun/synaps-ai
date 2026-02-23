
# Compact Pill Counters + Loading Ring Animation

## Overview
Two changes: (1) Convert the three large glowing counter cards into small horizontal pills placed above the score circle, and (2) add a spinning border animation to the score ring when the audit is running.

## Changes

### 1. Move counters above the ring and redesign as pills (`src/components/AuditDashboard.tsx`)

**Current layout order:** Ring -> Metric Bars -> 3 Large Counter Cards (grid)

**New layout order:** 3 Small Pill Counters (horizontal row) -> Ring -> Metric Bars

- Move the Section C (counter cards) from below the bars to above the ring
- Replace the `FlipCard` component with a `PillCounter` component:
  - Small rounded-full pill shape (`rounded-full px-3 py-1`)
  - Horizontal layout: colored dot + label + value (e.g., `[red dot] Critical 2`)
  - Keep the color-coded left dot using existing color classes
  - Remove the large padding (`p-6`), breathing glow animation, and flip transform
  - Use `text-xs` for compact sizing
- Container: `flex items-center justify-center gap-2` instead of `grid grid-cols-3 gap-3`

### 2. Add `isLoading` prop for ring animation (`src/components/AuditDashboard.tsx`)

- Add `isLoading?: boolean` to `AuditDashboardProps`
- When `isLoading` is true, apply a CSS class `audit-ring-loading` to the outer glow SVG that makes it spin faster (e.g., 1s instead of 4s) with a pulsing opacity
- The existing `audit-ring-glow-rotate` already rotates at 4s; when loading, override to rotate faster

### 3. Pass `isLoading` from Workspace (`src/pages/Workspace.tsx`)

- Pass `isLoading={state.isLoading.auditor}` to the `AuditDashboard` component on line 936

### 4. Add loading animation CSS (`src/index.css`)

- Add a new class `.audit-ring-loading` that overrides the glow rotation to spin at 1s and pulses the stroke opacity

## Technical Details

**PillCounter component:**
```
function PillCounter({ label, value, colorClass }: { ... }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}>
      <span className="tabular-nums font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
```

**CSS for loading state:**
```css
.audit-ring-loading {
  animation: rotate-glow 1s linear infinite;
}
.audit-ring-loading circle {
  animation: pulse-opacity 1s ease-in-out infinite;
}
@keyframes pulse-opacity {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
```

**Updated pill color classes** (replace counter classes with lighter pill variants):
- `audit-pill-red`: red-tinted border and subtle background
- `audit-pill-yellow`: yellow-tinted border and subtle background  
- `audit-pill-neutral`: muted border and background
