

# UI Layout Adjustments in ProjectGallery

## Changes — all in `src/pages/ProjectGallery.tsx`

### 1. Restructure the header area (lines 417-440)
- **Top row**: "Dashboard" heading on left, "Contact Us" button on right (remove from the `gap-3` div with New Project)
- **Second row**: Disabled "New Project" button below the heading, left-aligned
- **Third row**: Projects grid below

### 2. Light-mode-only darker gray for disabled New Project button (line 424)
- Change from `bg-muted text-muted-foreground opacity-50` to use a class that's darker in light mode only
- Use `dark:text-muted-foreground dark:opacity-50 text-gray-500 opacity-70` or similar so light mode gets a more visible gray while dark mode stays unchanged

### Layout structure after changes:
```text
┌─────────────────────────────────────────────┐
│  Dashboard                      [Contact Us]│  ← top row
│  [+ New Project] (disabled, tooltip)        │  ← second row, left-aligned
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │  ← grid below
│  │ Project  │ │ Project  │ │ Project  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

### Specific edits (lines 417-441):
Replace the current header + grid layout with:
1. A flex row: `<h1>Dashboard</h1>` + Contact Us `<a>` button (right-aligned)
2. A `<div className="mb-6">` containing the disabled New Project button with tooltip
3. The projects grid unchanged below

### Light mode color fix:
- Button classes: `bg-muted text-gray-500 dark:text-muted-foreground cursor-not-allowed opacity-60 dark:opacity-50`
- This makes the text/icon slightly darker gray in light mode only

