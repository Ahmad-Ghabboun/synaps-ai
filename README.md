# Synaps — Project Quality Assurance Intelligence

> AI-powered dual-LLM cross-validation that identifies critical project gaps before they derail delivery.

**Live Tool:** [synapsai.lovable.app](https://synapsai.lovable.app)  
**Demo Video:** [Link to be added]  
**Built by:** Ahmad Ghabboun | MSIS 549 — University of Washington

---

## What Is Synaps?

Synaps is an AI-powered Project Quality Assurance Advisor that catches critical gaps in project documentation — BRDs, SQAPs, Charters, Business Plans — before they become expensive mistakes.

The core innovation is **Dual-LLM Cross-Validation**: two independent AI audits run in parallel with no shared context. Gaps flagged by both models are labeled **HIGH CONFIDENCE** (~95% accuracy). Gaps flagged by only one are **MODERATE CONFIDENCE**. Synaps acts as the Judge, merging findings using a custom keyword-overlap algorithm in JavaScript — not a third AI call.

---

## Architecture

### The Three-Skill Pipeline

| Skill | Role | Model — Demo | Model — Production |
|---|---|---|---|
| Skill 1 — Extraction | The Architect | Gemini 2.5 Flash | Gemini 2.5 Flash |
| Skill 2A — Cross-Validation | Technical Auditor (Auditor A) | Gemini 2.5 Flash | Gemini 3 Pro |
| Skill 2B — Cross-Validation | Business Auditor (Auditor B) | Gemini 3 Pro | Claude Sonnet 4.6 |
| Skill 3 — Adjudication | Synaps Judge | Custom JavaScript | Custom JavaScript |

> **Note:** Demo prototype uses Gemini 2.5 Flash × Gemini 3 Pro for cross-validation due to API credit constraints. Production subscription upgrades to Gemini 3 Pro (Auditor A) × Claude Sonnet 4.6 (Auditor B) for true cross-provider validation (Google vs Anthropic).

### Fix Loop — Re-Audit Cycle

When a user clicks **FIX ISSUE**:
1. Skill 3 (Optimizer) receives the full existing SQAP + the specific gap
2. Generates a targeted fix and merges it surgically into the document
3. Skill 2 re-runs the full dual audit automatically
4. Score and Gap Feed update in real time
5. Loop continues until 95% threshold is reached

### Tech Stack

- **Frontend:** React + TypeScript via Lovable
- **Original Design:** Google Opal — all three skills were originally built in Opal's visual skill editor before migration to Lovable
- **Edge Function:** Supabase Edge Functions (Deno runtime) — `supabase/functions/synaps-ai/index.ts`
- **AI Gateway:** Lovable AI gateway → Google Gemini models
- **Database:** Supabase PostgreSQL + real-time channel subscriptions
- **State Management:** React Context API
- **Deployment:** synapsai.lovable.app

---

## Key Features

- **Completeness Score** — animated ring with letter grade (A–F), updates after every FIX ISSUE
- **5 Metric Bars** — Critical Gaps · High Confidence % · Section Coverage (X/12) · Confidence Ratio · Gap Resolution Rate (powered by `calculateMetrics.js`)
- **Gap Feed** — expandable risk cards with HIGH/MODERATE confidence badges, FIX ISSUE and dismiss actions
- **Skill Progress Bar** — Extraction (Gemini) → Cross-Validation (Claude & Gemini) → Adjudication (Synaps)
- **Asset Panel** — SQAP.md, Audit.json, Metrics.csv, Report.pdf — locked until 95% score
- **Mobile Notes** — real-time sync from `/mobile` to desktop dashboard (~500ms latency via Supabase)
- **Persona Modes** — TPM, Analyst, Entrepreneur (injects role-specific context into both Architect and Auditor prompts)
- **Demo Mode** — preloaded results, zero API calls — reliable fallback for presentations
- **95% Threshold** — SQAP download locked until score reaches 95%; final confirmation keeps human in the loop

---

## Confidence Scoring

The `mergeAuditResults()` function is custom JavaScript — not a third AI call:

1. Pre-compute keyword sets per risk title (words > 3 characters, lowercased)
2. Compare keyword sets across both audit outputs (Auditor A vs Auditor B)
3. Keyword overlap ≥ 2 → **HIGH CONFIDENCE**
4. Same section + overlap ≥ 1 → **HIGH CONFIDENCE**
5. Otherwise → **MODERATE CONFIDENCE**
6. Merge descriptions; escalate severity if either risk is critical
7. Final score = average of both model quality scores

---

## Persona System

Three modes inject role-specific context into both Architect and Auditor prompts:

| Persona | Architect Emphasis | Auditor Emphasis |
|---|---|---|
| TPM | Timeline, milestones, stakeholder comms | Dependency risks, scope creep, integration gaps |
| Analyst | Data integrity, quantitative metrics | Analytical gaps, data validation, reproducibility |
| Entrepreneur | Market viability, competitive advantage | Legal compliance, go-to-market, financial risks |

---

## Smart Trigger System

Three event-driven audit triggers (evolved from original 10-second idle timer proposal):

1. **Auto-pipeline** — Skill 2 fires automatically the moment Skill 1 completes
2. **Post-fix re-audit** — Skill 2 re-runs automatically after every FIX ISSUE action
3. **Manual override** — RUN DUAL AUDIT button for on-demand checks

---

## Business Model

- **Free tier:** First 3 projects free
- **Subscription:** Full dual-model cross-validation (Gemini 3 Pro × Claude Sonnet 4.6), unlimited projects, SQAP download at 95%
- **Enterprise:** Bring your own API keys (Gemini, Claude, or GPT-4)

---

## Build History

| Build | Platform | Status | Notes |
|---|---|---|---|
| Build 1 | Google Opal | Abandoned | All 3 skills built in Opal's visual editor. Disconnected — no pipeline, no parallel calls, no cross-validation possible |
| Build 2 | Lovable | Abandoned | FIX ISSUE overwrote entire SQAP instead of merging fix surgically |
| Build 3 | Lovable + Supabase Edge Functions | **Current (deployed)** | Promise.all() dual audit, surgical fix merging, unified React dashboard |

---

## Demo Prompt

Paste this into the prompt dock, select **TPM persona**, and click **LAUNCH ENGINE**:

```
Create a comprehensive project plan for migrating 50,000 enterprise users from 
on-premise servers to AWS infrastructure. The engineering team has 3 backend engineers 
and 1 database administrator. The migration will happen over a weekend during 
low-traffic hours. The frontend team will update UI endpoints after backend sign-off. 
We are using our existing OAuth service post-migration. The rollback strategy is not 
yet finalized but daily backups are available. The budget has not been defined but 
leadership has verbally approved an AWS tier upgrade. Deadline is November 15th.
```

---

## Development Workflow

Three tools kept in continuous sync:

- **VS Code** — code-level logic, edge function (`supabase/functions/synaps-ai/index.ts`), prompt engineering
- **Lovable** — UI deployment, visual builder fixes
- **GitHub** — source of truth → `git pull origin main --rebase` before every local push

---

## Target Users

- **Technical Program Managers (TPMs)** — writing BRDs, SQAPs, Migration Plans, Project Charters
- **Entrepreneurs & Founders** — validating business plans before stakeholder or investor review

---

## Academic Context

Built for **MSIS 549 — GenAI & Agentic Fair**, University of Washington.  
Individual project by Ahmad Ghabboun.  
Technical Report:(https://drive.google.com/file/d/1Q6hTOuYAX_XO1Jt_Suxy2ya5dn13Y9LJ/view?usp=sharing)

---

## License

Proprietary — © 2026 Ahmad Ghabboun.  
Built as part of MSIS 549 at the University of Washington.  
Commercial use requires permission.