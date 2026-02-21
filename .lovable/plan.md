

# Redesign Dashboard (ProjectGallery) with Sidebar Navigation

## Overview

Redesign `src/pages/ProjectGallery.tsx` to match the reference image: add a narrow icon sidebar on the left, redesign project cards with progress bars, and replace the hero "Create New Project" section with a dashed "New Project" card in the grid.

**Note:** The app routes `/` to `ProjectGallery.tsx` (not `Index.tsx`), so all changes target that file plus a new sidebar component.

---

## Changes

### 1. New File: `src/components/DashboardSidebar.tsx`

A narrow 64px icon-only sidebar with:
- **Synaps logo** at top (Sparkles icon from lucide-react as brand icon)
- **Nav items** with Tooltip on hover:
  - Dashboard (Home icon) -- active, highlighted
  - Projects (LayoutGrid icon) -- links to `/`
  - Team (Users icon) -- placeholder/disabled
  - Settings (Settings icon) -- opens SettingsDialog
- Each icon is a 40x40 rounded button, active state gets `bg-primary/10 text-primary`
- Sidebar uses `bg-card border-r border-border` in both modes
- Settings click opens the existing `SettingsDialog` component (reused from Workspace)

### 2. Redesign `src/pages/ProjectGallery.tsx`

**Layout:**
- Wrap page in a flex row: `<DashboardSidebar />` on left + main content area on right
- Remove the old header with "SYNAPS | Project Quality Assurance Intelligence" subtitle
- Add a simple "Dashboard" title at top left of the main content area

**Project Cards -- redesigned:**
- Project name bold at top left
- Three-dot menu (MoreVertical) at top right (reuse existing rename/delete dropdown)
- Progress bar below name showing `project.score`% with color-coded fill (reuse existing `scoreColor`)
- Score text below bar: `"{score}% Complete"` or `"Not yet audited"` if score is 0 and no auditResult
- Last edited date at bottom in muted text: `"Edited {date}"`
- Remove description text and deadline badges from cards
- Remove the large score number display

**New Project card:**
- Remove the hero "Create New Project" button/section
- Insert a "New Project" card as the **first item** in the grid
- Dashed border, Plus icon centered, "New Project" label below
- Clicking opens the existing create project modal (reuse all existing modal logic)

### 3. No changes needed to other files

The SettingsDialog is already a standalone component that accepts `open` and `onOpenChange` props, so it can be reused directly in the sidebar.

---

## Technical Details

### DashboardSidebar Component

```text
Props: none (uses internal state for settings dialog)
Width: w-16 (64px), fixed height: h-screen, sticky
Icons: Home, LayoutGrid, Users, Settings from lucide-react
Tooltips: Uses existing Tooltip component from @/components/ui/tooltip
Settings: Opens SettingsDialog with local useState
```

### Card Layout Changes

```text
Before:
  - Name + deadline badge
  - Time ago text
  - Progress bar
  - Large score number

After:
  - Name (left) + three-dot menu (right)
  - Progress bar (color-coded)
  - "X% Complete" or "Not yet audited"
  - "Edited {formatted date}" in muted text at bottom
```

### Files Modified

1. **`src/components/DashboardSidebar.tsx`** -- new file, icon sidebar with settings integration
2. **`src/pages/ProjectGallery.tsx`** -- redesigned layout, cards, and "New Project" placement

