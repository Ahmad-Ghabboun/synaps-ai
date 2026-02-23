
# Keep Demo Mode On and Disable Toggle

## Overview
Set `demoMode` to `true` by default and disable the toggle switches so they cannot be turned off, while keeping the UI elements visible.

## Changes

### 1. `src/context/AppContext.tsx`
- Change `demoMode: false` to `demoMode: true` in `initialState` (line 18)

### 2. `src/components/SettingsDialog.tsx`
- Add `disabled` prop to the Demo Mode `Switch` (line 75)

### 3. `src/pages/Workspace.tsx`
- Add `disabled` prop to the Demo Mode `Switch` in the workspace sidebar (line 779)
