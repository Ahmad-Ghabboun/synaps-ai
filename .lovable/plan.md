## Plan: Complete Demo Mode Overhaul

This is a large feature. The core idea: when demo mode is ON, pre-stage an entire "Q3 Database Migration Plan" project with hardcoded SQAP, 18 exact gaps, specific scores, and specific section coverage data. The gallery shows 6 project cards. Fix Issue resolves gaps with severity-based scoring. localStorage persistence for demo mode.

### Files to modify

1. `**src/types/synaps.ts**` — Expand `Risk` severity union to include `"high"` and `"low"`. Add new demo data constants: `DEMO_Q3_PROJECT` with full SQAP text, `DEMO_Q3_AUDIT` with 18 risks, `DEMO_GALLERY_PROJECTS` (6 cards). Add `fix` field to Risk for suggested fix text. Add optional `similarity` field to Risk. Add `sectionCoverage` to `AuditResult`.
2. `**src/context/AppContext.tsx**` — When `demoMode` is ON, load all 6 demo gallery projects (replacing the old single `DEMO_PROJECT` load). Persist `demoMode` to localStorage, read it on init.
3. `**src/pages/ProjectGallery.tsx**` — Add "Upcoming Deadlines" section below MobileNotesPanel (or integrated into the right panel). Show 5 deadline entries with SVG status icons (red glow for critical/overdue, yellow for upcoming, green checkmark for done). Style cards to show status badges ("Active", "Pending", "Done") on each project card.
4. `**src/pages/Workspace.tsx**` — Update demo mode flow:
  - When Q3 project is loaded and user clicks Generate: simulate 8-second typewriter with the hardcoded SQAP
  - When user clicks Run Quality Audit: 3-second loading animation, then populate with hardcoded 18-gap audit result (score 12, grade F)
  - Fix Issue: don't remove the gap — turn card green ("Resolved"), add severity-based points (critical +15, high +8, medium +4, low +1), animate score ring, auto-unlock quality gate at 95
  - Models tab: show hardcoded Auditor A (Gemini 3 Pro, tech score 14), Auditor B (Claude Sonnet 4.6, business score 10), embedding model info
5. `**src/components/AuditDashboard.tsx**` — Update ModelsComparisonPanel to show the exact model names/specs from demo data. Add quality gate banner (LOCKED/UNLOCKED). Add section coverage display. Support `high` and `low` severity counts alongside critical/moderate.
6. `**src/index.css**` — Add subtle red glow keyframe animation for critical deadline icons.

### Key data to hardcode

**SQAP sections** (10 sections): Executive Summary, Testing Strategy, Risk Management, Security & Compliance, Infrastructure & DevOps, SLAs & Non-Functional Requirements, Budget & Resources, Stakeholder Management, Launch & Rollout, KPIs

**18 Risks** (R001-R018): Each with id, severity (`critical`/`high`/`moderate`/`low` — note: types need updating), title, description, impact, fix suggestion, confidence (`high`/`normal`), similarity score. Exact text from user's spec.

**Section Coverage** (12 sections): Hardcoded percentages and MISSING/PARTIAL status.

**Gallery cards**: 6 projects with titles, scores, timestamps, status badges. Only Q3 Database Migration Plan is clickable with full content.

**Fix Issue scoring**: Critical = +15, High = +8, Medium = +4, Low = +1. Resolved cards turn green. Quality gate unlocks at 95.

### Technical details

- `Risk.severity` type changes from `"critical" | "moderate"` to `"critical" | "high" | "moderate" | "low"`
- Add `Risk.similarity?: number` and `Risk.fix?: string` fields
- Add `AuditResult.sectionCoverage?: { name: string; status: string; percent: number }[]`
- Add `AuditResult.qualityGate?: { locked: boolean; threshold: number }`
- Add `AuditResult.techScore?: number` and `AuditResult.businessScore?: number` directly to AuditResult (instead of parsing from rawJson)
- RiskCard needs a `resolved` state — add `Risk.resolved?: boolean`, render green background when true, disable Fix button
- `ProjectCard` in gallery needs optional `status` badge prop
- Demo mode stored in `localStorage.getItem("synaps-demo-mode")`
- Upcoming Deadlines rendered as a compact list below the notes panel in ProjectGallery, using inline SVG circle icons with conditional red glow CSS class

### Estimated scope

- ~400 lines of hardcoded demo data in synaps.ts
- ~80 lines changes in AppContext
- ~100 lines changes in ProjectGallery (deadlines section, status badges)
- ~60 lines changes in Workspace (demo flow tweaks, resolved state)
- ~80 lines changes in AuditDashboard (quality gate, section coverage, model details)
- ~10 lines CSS for red glow animation  
  
Before implementing this plan, note: the project gallery already has existing cards (Q1 Financial Compliance Audit, Security Infrastructure Review, etc.) and an Upcoming Deadlines panel already exists on the right side. Replace the existing cards with the 6 new ones — do not create duplicates. Update the existing Upcoming Deadlines panel with the new data instead of building a new one.