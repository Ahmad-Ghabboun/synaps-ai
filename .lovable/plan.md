

## Plan: Five Feature Additions

### 1. New Project Creation (ProjectGallery.tsx)
Replace the `handleCreate` toast with real logic:
- Validate `projectName` is not empty
- Create a `Project` with `crypto.randomUUID()`, all required fields, score 0, grade "F", empty sqap/files
- Dispatch `SET_PROJECTS` appending to existing array, `SET_CURRENT_PROJECT` with new id
- Close modal, navigate to `/workspace`

### 2. Demo Mode Toggle (already done)
The context and workspace already have a working toggle from the last edit. `SET_DEMO_MODE` action exists, the useEffect reacts to `state.demoMode`, and the Switch is wired up. No changes needed.

### 3. Inline SQAP Editing (Workspace.tsx)
Add per-section inline editing in the Artifact accordion:
- New state: `editingSectionIndex`, `editSectionContent`, `modifiedSections` (Set of indices)
- Pencil icon on each section header (visible on hover, next to copy button)
- Clicking pencil sets edit mode for that section with a textarea + Save/Cancel buttons
- Save reassembles markdown from all sections, calls `updateCurrentProject({ sqap, files })`, adds index to `modifiedSections`, toasts "Section saved"
- Yellow "Modified" badge on edited sections
- "Re-Audit" button next to "The Artifact" title, visible when `sqapContent` and `activeAudit` exist
- Re-Audit calls `callSkill("auditor", ...)`, updates project, clears `modifiedSections`, shows spinner while running

### 4. Gap Severity Labels (Workspace.tsx RiskCard)
Add a severity pill badge in each RiskCard header:
- Map severity to color: `critical` → red, `moderate` → yellow
- Also support `high` → orange, `low` → blue for future use
- Use the existing `Badge` component with custom className for pill colors

### 5. Viewer Sharing Modal (Workspace.tsx)
- Add `Share2` icon button in top nav bar
- New state `shareModalOpen`
- Modal shows: shareable URL, project summary (name, score, grade, gap count), Copy Link button, Share via Email button (mailto:), Download Report button
- Uses existing Dialog component

### Files to modify:
- **src/pages/ProjectGallery.tsx** — `handleCreate` implementation
- **src/pages/Workspace.tsx** — Inline editing, severity badges on RiskCard, share modal, re-audit button
- **src/components/AuditDashboard.tsx** — No changes needed (severity labels go on RiskCard in gap feed, not dashboard)

