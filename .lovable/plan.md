

# Re-enable Demo Mode Toggle

## Overview
Unlock the Demo Mode toggle so it can be switched on and off again, restoring the ability to use live API calls.

## Changes

### 1. AppContext (`src/context/AppContext.tsx`)
- Change `demoMode: true` back to `demoMode: false` in `initialState`
- Update the `SET_DEMO_MODE` reducer case to respect the payload: `return { ...state, demoMode: action.enabled }` instead of always returning `true`

### 2. SettingsDialog (`src/components/SettingsDialog.tsx`)
- Change the Demo Mode `Switch` from `checked={true} disabled={true}` to `checked={state.demoMode}` with `onCheckedChange` wired to dispatch `SET_DEMO_MODE`
- Update description text from "Demo mode is always enabled" to something like "Use prebuilt demo results instead of live API calls"

### 3. Workspace (`src/pages/Workspace.tsx`)
- Re-enable the inline Demo Mode toggle by removing `disabled={true}` and wiring it back to dispatch `SET_DEMO_MODE`

