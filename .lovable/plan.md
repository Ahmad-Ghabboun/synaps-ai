# Hardcode Demo Mode & Lock to Demo Project Only

## Changes

### 1. `src/context/AppContext.tsx`

- Remove `SET_DEMO_MODE` action type and its reducer case
- Hardcode `demoMode: true` in initialState (already done)
- Change project loading logic: always load only `[DEMO_PROJECT]` regardless of localStorage — ignore saved projects
- Remove localStorage save/load for projects entirely (no user projects persist)
- Remove `ADD_PROJECT` and `DELETE_PROJECT` reducer cases (prevent project creation/deletion)

### 2. `src/components/SettingsDialog.tsx`

- Remove the Demo Mode toggle block (lines 68-80)

### 3. `src/pages/Workspace.tsx`

- Remove the Demo Mode toggle from the settings dropdown (lines 777-780)

### 4. `src/pages/Index.tsx`

- Remove the "New Project" button (lines 66-68)
- Filter `sortedProjects` to only show the demo project (or rely on context always providing only demo project)

### 5. `src/pages/ProjectGallery.tsx`

- Remove the "New Project" button/card and the create project modal
- Or simply filter displayed projects to demo only

### 6. `src/types/synaps.ts`

- Remove `demoMode` from `AppState` interface (optional cleanup — can keep as always-true constant)

### 7. Clear existing database data

- Delete all rows from `sync_items` table (the only user-generated data table)

## Summary

Six file changes to remove Demo Mode toggle UI, hardcode demo-only project list, hide project creation, and clear the database.  
  
Create a new branch called 'demo-locked', apply all the planned changes to that branch only, and deploy the published site from the demo-locked branch. Keep the main branch completely unchanged.