
# Always-Visible Skill Captions + Updated Labels

## Overview
Update the SkillsStatus component so captions are always visible (not just during the active/loading state), and change the Extraction caption from "Architect" to "Architect: Gemini".

## Changes

### `src/components/SkillsStatus.tsx`

1. **Update caption text** (line 7): Change `desc: "Architect"` to `desc: "Architect: Gemini"`

2. **Always show captions** (line 47): Remove the `{isActive && ...}` conditional wrapper so the `desc` span renders for all steps regardless of state. The caption will still use `text-muted-foreground` styling.

**Before (line 47):**
```
{isActive && (
  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
    {step.desc}
  </span>
)}
```

**After:**
```
<span className="text-[10px] text-muted-foreground leading-none mt-0.5">
  {step.desc}
</span>
```

This is a two-line change: update the desc string and remove the conditional rendering.
