

# SYNAPS v2 -- Self-Contained Intelligence Platform

## Summary of Changes

This upgrade transforms SYNAPS from a basic two-view app into a persona-aware, file-first intelligence platform with a tabbed Mission Control, a Project Setup Modal, and a non-floating input dock.

---

## 1. Project Setup Modal

**Trigger:** Clicking "Create New Project" on the Gallery page opens a modal instead of immediately navigating to the Workspace.

**Modal fields:**
- Project Name (text input)
- Persona (select: TPM, Analyst, Entrepreneur)
- Deadline (date picker using existing Calendar/Popover components)
- Description (multi-line textarea)

**Data model change:** Add `persona` and `deadline` fields to the `Project` type in `src/types/synaps.ts`. These fields are saved to localStorage and passed to all AI skill calls so prompts are parameterized per persona.

**Edge function update:** The `synaps-ai` edge function Architect prompt will include persona context (e.g., "The user is a Technical PM -- emphasize timeline risks and stakeholder communication") and deadline awareness.

---

## 2. Right Panel -- Tabbed Mission Control

Replace the current single scrollable right panel with a **4-tab system** using the existing `Tabs` component:

| Tab | Contents |
|-----|----------|
| **Status** | Vertical Pipeline Stepper with live pulse animations (existing component, moved here) |
| **Audit** | Circular SVG Gauge, Grade display, Model Consensus metrics, Raw JSON toggle |
| **Gap Feed** | Risk cards with FIX ISSUE buttons and confidence badges |
| **Assets** | 2x2 virtual file grid (SQAP.md, Audit.json, Metrics.csv, Report.pdf) with Download Assets button |

When "LAUNCH ENGINE" is clicked, auto-focus the **Status** tab to show the pipeline progressing in real time.

---

## 3. Fixed Input Dock (Non-Floating)

Replace the current floating/fixed-position input area with a **static full-width bar** pinned at the bottom of the workspace layout using flexbox (not `position: fixed`). This improves mobile responsiveness by not overlapping content.

The dock contains:
- Paperclip icon (UI only)
- Multi-line textarea
- "LAUNCH ENGINE" button
- Cmd/Ctrl+Enter shortcut hint

---

## 4. File-First Architecture

Every AI skill generates an internal "file object" stored on the project:

- **Skill 1 (Architect):** Generates 3 Markdown documents (stored as a single SQAP string with clear section headers) -- persona-aware content
- **Skill 2 (Auditor):** Generates `audit.json` (the audit result) and a `metrics.csv` (score breakdown by section)
- **Skill 3 (Optimizer):** Rewrites flawed MD sections, auto-refreshes audit

**New project fields:** `files` array on the Project type holding `{name, type, content}` objects.

The Accordion, Gauge, and Gap Feed all "read" from these internal file objects rather than raw state fields.

**Download Assets:** A button that bundles all generated files into a ZIP download (using JSZip or manual Blob construction). Each file includes the Project Name and Deadline in its header.

---

## 5. AI Skill Updates

**Skill 1 (Architect):** Updated system prompt includes persona detection and generates 3 professional Markdown sections tailored to the user's role. Deadline is mentioned in the Executive Summary.

**Skill 2 (Dual Auditor):** Runs two "personas" (Technical Risk vs. Business Risk) sequentially via the edge function. Results are cross-validated and merged. Duplicate risks are consolidated into "High Confidence" cards via keyword matching (existing merge logic enhanced). Outputs both JSON and a CSV metrics breakdown.

**Skill 3 (Optimizer):** No major changes -- rewrites flawed sections and auto-triggers Skill 2 re-run.

---

## Technical Details

### Files to modify:

1. **`src/types/synaps.ts`** -- Add `persona`, `deadline`, and `files` fields to `Project` interface. Add `FileObject` type.

2. **`src/context/AppContext.tsx`** -- No structural changes needed; existing reducer handles project updates.

3. **`src/pages/ProjectGallery.tsx`** -- Replace direct navigation with a Project Setup Modal (Dialog with form fields including date picker).

4. **`src/pages/Workspace.tsx`** -- Major refactor:
   - Wrap right panel content in `Tabs` / `TabsList` / `TabsContent` components
   - Move Pipeline Stepper to "Status" tab
   - Move Gauge + Raw JSON to "Audit" tab
   - Move Risk cards to "Gap Feed" tab
   - Move Assets grid + Download button to "Assets" tab
   - Replace fixed-position input dock with a flexbox-pinned bottom bar
   - Add auto-tab-switch logic on engine launch
   - Update `launchEngine` and skill calls to pass persona/deadline
   - Generate file objects from skill outputs

5. **`supabase/functions/synaps-ai/index.ts`** -- Update Architect prompt to accept and use persona + deadline parameters. Add CSV generation logic to Auditor response processing.

6. **`src/components/SettingsDialog.tsx`** -- No changes needed (Demo Mode and Technical View toggles remain).

### New dependency:
- None required. ZIP download can be implemented with native Blob API (creating a simple multi-file download) or basic concatenation. If full ZIP is needed, `jszip` would be added.

### Responsive behavior:
- Mobile: Tabs stack naturally, input dock is full-width at bottom
- Desktop: 50/50 split with tabbed right panel

