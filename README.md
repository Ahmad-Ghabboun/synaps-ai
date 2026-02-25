# Synaps — Project Quality Assurance Intelligence

> AI-powered cross-validation that identifies critical project gaps before they derail delivery.

**Live Tool:** [synapsai.lovable.app](https://synapsai.lovable.app)  
**Built by:** Ahmad Ghabboun | MSIS 549 — University of Washington

---

## What Is Synaps?

Synaps is an AI-powered Project Quality Assurance Advisor that catches critical gaps in project documentation — BRDs, SQAPs, Charters, Business Plans — before they become expensive mistakes.

The core innovation is **Dual-LLM Cross-Validation**: two independent AI audits run in parallel with different roles and different models. Gaps flagged by both are labeled **HIGH CONFIDENCE** (~95% accuracy). Gaps flagged by only one are **MODERATE CONFIDENCE**. Synaps acts as the Judge, merging findings using custom keyword-overlap logic.

---

## Architecture

### The Three-Skill Pipeline

| Skill | Role | Model (Demo) | Model (Production) |
|---|---|---|---|
| Skill 1 — Extraction | The Architect | Gemini 2.5 Flash | Gemini 2.5 Flash |
| Skill 2 — Cross-Validation | Technical Auditor | Gemini 2.5 Flash | Gemini 3 Pro |
| Skill 2 — Cross-Validation | Business Auditor | Gemini 3 Pro | Claude Sonnet 4.6 |
| Skill 3 — Adjudication | Synaps Judge | Custom JavaScript | Custom JavaScript |

> **Note:** Demo and prototype use Gemini 2.5 Flash × Gemini 3 Pro for cross-validation for API credit purposes. Production subscription model will upgrade to Gemini 3 Pro × Claude Sonnet 4.6 for true cross-provider validation (Google vs Anthropic).

### Tech Stack

- **Frontend:** React + TypeScript via Lovable
- **Skills Framework:** Google Opal — original framework used to design the three-skill pipeline. Skills implemented through Lovable's cloud skill execution layer
- **Edge Function:** Supabase Edge Functions (Deno runtime)
- **AI Gateway:** Lovable AI gateway → Google Gemini models
- **Database:** Supabase PostgreSQL + real-time subscriptions
- **Deployment:** synapsai.lovable.app

---

## Key Features

- **Completeness Score** — animated ring with grade letter (A–F)
- **Gap Feed** — expandable risk cards with HIGH/MODERATE confidence badges
- **FIX ISSUE** — auto-generates fix, merges into document, re-audits instantly
- **Asset Panel** — downloadable SQAP.md, Audit.json, Metrics.csv
- **Mobile Notes** — real-time sync from /mobile to desktop dashboard
- **Persona Modes** — TPM, Analyst, Entrepreneur (different risk profiles)
- **Demo Mode** — preloaded results, no API calls required
- **95% Threshold** — download locked until score reaches 95%

---

## Confidence Scoring

The `mergeAuditResults()` function is custom JavaScript — not a third AI call:

1. Pre-compute keyword sets for each risk title (words > 3 characters)
2. Compare keyword sets across both audit outputs
3. Overlap ≥ 2 keywords → **HIGH CONFIDENCE**
4. Same section + ≥ 1 keyword → **HIGH CONFIDENCE**
5. Otherwise → **MODERATE CONFIDENCE**
6. Final score = average of both model scores

---

## Business Model

- **Free tier:** First 3 projects free
- **Subscription:** Full dual-model cross-validation (Gemini 3 Pro × Claude Sonnet 4.6), unlimited projects, SQAP download at 95% score
- **Enterprise:** Bring your own API keys (Gemini, Claude, or GPT)

---

## Development Workflow

Changes are kept in sync across three tools:
- **VS Code** — code-level logic, edge function, prompt engineering
- **Lovable** — UI deployment, visual builder fixes
- **GitHub** — source of truth (`git push origin main` → Lovable auto-syncs)

---

## Target Users

- **Technical Program Managers (TPMs)** — writing BRDs, SQAPs, Charters
- **Entrepreneurs & Founders** — validating business plans before stakeholder review

---

## Demo Prompt

```
Create a comprehensive project plan for migrating 50,000 enterprise users from 
on-premise servers to AWS infrastructure. The engineering team has 3 backend engineers 
and 1 database administrator. The migration will happen over a weekend during 
low-traffic hours. The frontend team will update UI endpoints after backend sign-off. 
We are using our existing OAuth service post-migration. The rollback strategy is not 
yet finalized but daily backups are available. The budget has not been defined but 
leadership has verbally approved an AWS tier upgrade. Deadline is November 15th.
```

Select **TPM persona** and hit **LAUNCH ENGINE**.

---

## License

Built for academic purposes — MSIS 549 GenAI & Agentic Fair, University of Washington.
