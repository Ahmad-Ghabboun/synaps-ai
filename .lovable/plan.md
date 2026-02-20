# Fix AuditDashboard: Metrics, Counter Cards, Scrollbar & Ring

## 1. Fix Metric Calculations in `src/components/AuditDashboard.tsx`

**High Confidence bar** (index 1): Change value from `highConfidenceCount / totalGaps` to `highConfidenceCount / totalGaps` (already correct ratio), but fix display to `${totalGaps > 0 ? Math.round((highConfidenceCount / totalGaps) * 100) : 0}%` -- this is already done. No change needed here.

**Confidence Ratio bar** (index 3): Currently uses the same formula as High Confidence. Change to:

- Compute `normalConfidenceCount = totalGaps - highConfidenceCount`
- Value: `highConfidenceCount / (highConfidenceCount + normalConfidenceCount)` which simplifies to `highConfidenceCount / totalGaps` -- actually identical. Per the user's intent, the ratio should be `highConfidenceCount / (highConfidenceCount + normalConfidenceCount)` where normalConfidenceCount specifically counts risks where confidence is NOT "high". Update the computation to use an explicit `normalConfidenceCount` variable for clarity and correctness.

**NaN guard**: All percentage displays already guard with `totalGaps > 0 ? ... : 0`. Verify and ensure this is consistent.

## 2. Redesign Counter Cards

Update the `FlipCard` component and the counter card section to match the reference image:

- **Taller cards** with more padding (`p-6` instead of `p-4`)
- **Horizontal layout** inside each card: slot-machine number on left, label text on right (matching reference)
- **Red card**: `bg-red-950/40 border-red-500/50` with red breathing glow
- **Yellow/Amber card**: `bg-amber-950/40 border-amber-500/50` with amber breathing glow  
- **Neutral card**: `bg-muted/40 border-border` with subtle glow
- Light mode variants: softer tints (`bg-red-50 border-red-200`, etc.)
- All cards get the `audit-counter-breathe` animation class immediately after flip completes

## 3. Hide Scrollbars

Add to `src/index.css`:

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

Apply `scrollbar-hide` class to the two `overflow-y-auto` containers in `Workspace.tsx`:

- Left panel: line 742 (`flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto`)
- Right panel: line 802 (`flex-1 overflow-y-auto mt-4`)

## 4. Fix Circular Ring to Match Reference

Update the ring SVG in `AuditDashboard.tsx`:

- **Gradient stroke**: Already uses `linearGradient` with cyan-to-purple (dark) and blue-to-indigo (light). Verify the gradient IDs are applied correctly to the main stroke circle.
- **Outer rotating halo**: The existing rotating glow circle needs to be more visible -- increase stroke opacity and width to create the double-ring halo seen in the reference (a bright inner ring + a softer outer ring rotating behind it).
- **Score text**: Increase to `text-6xl` font-bold, ensure `text-white` in dark mode via `dark:text-white`.
- **Grade label**: Already shown below score. Add "Completeness Score" subtitle.
- **Neon bloom in dark mode**: Add stronger `filter: drop-shadow` values to the SVG in dark mode -- multiple layered drop-shadows for the bloom effect.
- **Ring size**: Increase from 200x200 to 220x220 with radius 90 for more visual impact.
- **Dark background inside ring**: The ring center should be transparent (already is since it's just overlaid on the card background).

## Files Modified

1. `**src/components/AuditDashboard.tsx**` -- metric calculations, counter card redesign, ring enhancements
2. `**src/index.css**` -- add `.scrollbar-hide` utility
3. `src/pages/Workspace.tsx` -- add `scrollbar-hide` class to both scroll containers  
  
Confidence Ratio should show a SPLIT visualization — not a single bar percentage. Show two segments: High Confidence portion in purple, Moderate/Normal portion in gray, so it visually communicates the ratio between the two rather than just repeating the High Confidence percentage. Label it 'X High / Y Moderate' instead of a single percentage.