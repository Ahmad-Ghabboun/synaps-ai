# SYNAPS — Project Quality Assurance Intelligence

## Overview

A responsive SPA with two main views: a **Project Gallery** for managing projects, and an **Intelligence Workspace** where three AI skills (Architect → Auditor → Optimizer) process project descriptions into structured quality assurance documents, audit scores, and auto-fixes.

---

## View 1: Project Gallery (Landing Page)

- **"High-Contrast Studio" design** — warm white background (#f8f7f3), Inter font, clean bordered cards with subtle shadows
- **Hero "Create New Project" card** — dashed border, large blue plus icon, hover animation, navigates to Workspace
- **Recent Projects grid** (responsive 1/2/3 columns) — each card shows title, "Last updated" timestamp, color-coded progress bar (red/amber/blue/green by score), and large percentage display
- **Card context menu** — "More" icon with Rename (inline edit) and Delete (confirmation toast) options
- Clicking a project card opens it in the Workspace

## View 2: Intelligence Workspace

### Top Navigation Bar

- SYNAPS logo + "THE WORKSPACE" label, settings/help icons, user avatar placeholder

### Left Panel — "The Artifact"

- Displays the generated SQAP document as an **accordion list** — each Markdown section (Executive Summary, Tech Stack, Security, etc.) is collapsible
- **Copy icon** on each section, **"Download Assets"** button to export as .md or .json
- Loading/empty states with placeholder text

### Right Panel — "Mission Control"

- **Pipeline Stepper** — vertical progress indicator for Skill 1 → Skill 2 → Skill 3 with active pulse and checkmark icons
- **Circular SVG Gauge** — animates from 0 to the quality score, shows percentage + grade letter + "Completeness Score" label
- **Project Assets grid** (2×2) — file icons for SQAP.md, Audit.json, Metrics.csv, Report.pdf
- **"RUN DUAL AUDIT" button** — triggers Skill 2, with loading/disabled state
- **Gap Feed** — scrollable list of risk cards:
  - **Critical** (red-tinted, red left border, "CRITICAL" badge) with "FIX ISSUE" button
  - **Moderate** (amber-tinted, amber left border, "MODERATE" badge) with "FIX ISSUE" button
  - Each fix triggers Skill 3, then auto-reruns Skill 2 to refresh the score

### Floating Input Area

- Centered floating card at bottom of workspace
- Multi-line textarea with placeholder prompt
- Paperclip icon for file uploads (UI only)
- **"LAUNCH ENGINE"** button triggers Skill 1 → Skill 2 pipeline
- Keyboard shortcut: Cmd/Ctrl + Enter

## Three AI Skills (via Lovable AI — Gemini model, routed through secure edge function)

1. **The Architect** — Takes project description → outputs structured Markdown SQAP
2. **The Auditor** — Takes SQAP → outputs JSON with quality score (0-100), grade (A-F), and categorized risks
3. **The Optimizer** — Takes a flawed section + risk details → outputs corrected Markdown; auto-reruns audit to update score

## State & Persistence

- React Context for global state (current project, projects list, loading states)
- localStorage persistence for all projects and metadata
- Auto-save every 30 seconds

## Technical Details

- React Router for navigation (/, /workspace, /settings)
- Settings modal for any configuration
- Comprehensive error handling with retry buttons, toast notifications
- Loading states with spinners on all async operations
- Smooth animations: gauge fill, card hover effects, page transitions, accordion expand/collapse

## Responsive Design

- Mobile: single column, full-width cards, larger touch targets
- Tablet: 2-column grid maintained
- Desktop: full 50/50 split workspace  
  
The plan is excellent. Please add these final requirements to the build:
  1. **Dual Audit Merge Logic:** Automatically merge duplicate risks from the two models into 'High Confidence' cards using keyword matching.
  2. **Demo Mode:** Include a toggle in Settings to use 'Sample Project Data' for the Fintech example to bypass API calls for demonstration.
  3. **Technical View:** Add a small toggle to show the 'Raw JSON' output from the auditors in the Mission Control panel.
  4. **Branded Export:** Ensure the .md download includes a professional header with the project title and the final consensus score.