
# Lock Demo Mode to Always-On

## Overview
Set Demo Mode as permanently enabled so the app always uses prebuilt demo results. The toggle remains visible in Settings but is disabled (grayed out, always on). All edge function API calls are bypassed.

## Changes

### 1. Default demo mode to `true` in AppContext (`src/context/AppContext.tsx`)
- Change `demoMode: false` to `demoMode: true` in `initialState`
- Remove the localStorage check that conditionally enables demo mode on mount (it's always on now)

### 2. Lock the toggle in SettingsDialog (`src/components/SettingsDialog.tsx`)
- Set the Demo Mode `Switch` to `disabled={true}` and keep `checked={true}` (or `checked={state.demoMode}` since it will always be true)
- Update the description text to indicate demo mode is permanently enabled (e.g., "Demo mode is always enabled")

### 3. Lock the toggle in Workspace inline settings (`src/pages/Workspace.tsx`)
- The Workspace page also has an inline Demo Mode toggle (~line 771). Set it to `disabled={true}` so it cannot be toggled off there either.

### 4. Prevent the reducer from turning it off (`src/context/AppContext.tsx`)
- In the `SET_DEMO_MODE` case, always return `demoMode: true` regardless of the payload, ensuring no code path can disable it.

## What stays the same
- All existing demo-mode logic in Workspace.tsx (architect, auditor, optimizer shortcuts) remains untouched -- it already gates API calls behind `state.demoMode` checks.
- The edge function code is unchanged; it simply never gets called because the client-side demo mode short-circuits before any fetch.
