export interface Risk {
  id: string;
  severity: "critical" | "high" | "moderate" | "low";
  title: string;
  description: string;
  section: string;
  impact: string;
  fix?: string;
  confidence?: "high" | "normal";
  similarity?: number;
  isFixing?: boolean;
  resolved?: boolean;
}

export interface NoteWidget {
  id: string;
  content: string;
  createdAt: string;
  status: 'active' | 'archived';
  order: number;
}

export interface SyncItem {
  id: string;
  externalId?: string;
  provider: string;
  status: 'synced' | 'pending' | 'error';
  lastSyncedAt: string;
  data: any;
}

export interface SectionCoverage {
  name: string;
  status: "MISSING" | "PARTIAL" | "COMPLETE";
  percent: number;
}

export interface AuditResult {
  qualityScore: number;
  grade: string;
  risks: Risk[];
  rawJson?: string;
  sectionCoverage?: SectionCoverage[];
  qualityGate?: { locked: boolean; threshold: number };
  techScore?: number;
  businessScore?: number;
}

export interface FileObject {
  name: string;
  type: "md" | "json" | "csv" | "pdf";
  content: string;
}

export type Persona = "TPM" | "Analyst" | "Entrepreneur";

export interface Project {
  id: string;
  name: string;
  description: string;
  persona?: Persona;
  deadline?: string;
  sqap: string;
  auditResult: AuditResult | null;
  score: number;
  grade: string;
  files: FileObject[];
  createdAt: string;
  updatedAt: string;
  status?: "Active" | "Pending" | "Done";
}

export interface LoadingState {
  architect: boolean;
  auditor: boolean;
  optimizer: boolean;
}

export interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: LoadingState;
  demoMode: boolean;
  showRawJson: boolean;
}

// ─── DEMO: Fintech Payment Gateway (existing) ───

export const DEMO_PROJECT: Project = {
  id: "demo-fintech",
  name: "Fintech Payment Gateway",
  description: "Build a fintech app that processes credit card payments, stores card data for recurring billing, integrates with Stripe and PayPal, handles PCI-DSS compliance, and provides a merchant dashboard with real-time transaction analytics.",
  persona: "TPM",
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  sqap: `## Executive Summary
The Fintech Payment Gateway is a comprehensive payment processing platform designed to handle credit card transactions, recurring billing, and multi-provider payment integration. The system must meet PCI-DSS Level 1 compliance standards while providing real-time analytics to merchants.

## Technical Architecture
- **Frontend:** React 18 with TypeScript, TailwindCSS
- **Backend:** Node.js with Express, GraphQL API
- **Database:** PostgreSQL 15 with read replicas
- **Cache:** Redis for session management and rate limiting
- **Message Queue:** RabbitMQ for async transaction processing
- **Infrastructure:** AWS with multi-AZ deployment

## Security Requirements
- PCI-DSS Level 1 compliance mandatory
- All card data must be tokenized before storage
- TLS 1.3 for all data in transit
- AES-256 encryption for data at rest
- OAuth 2.0 + JWT for API authentication
- Rate limiting: 100 requests/minute per merchant
- WAF integration for DDoS protection

## Implementation Scope
1. Payment processing engine (Stripe + PayPal)
2. Card tokenization service
3. Recurring billing scheduler
4. Merchant dashboard with analytics
5. Webhook notification system
6. Fraud detection module
7. Compliance reporting tools

## Risk Considerations
- Card data storage requires SAQ-D certification
- Multi-currency support adds complexity
- Real-time analytics may impact transaction latency
- Third-party payment provider downtime handling
- Regulatory compliance across jurisdictions`,
  auditResult: {
    qualityScore: 5,
    grade: "F",
    risks: [
      {
        id: "risk-1",
        severity: "critical",
        title: "Inadequate Card Data Storage Security",
        description: "The current architecture does not specify a dedicated Hardware Security Module (HSM) for cryptographic key management. Storing encryption keys alongside card data violates PCI-DSS Requirement 3.",
        section: "Security Requirements",
        impact: "Potential data breach exposing cardholder data, resulting in fines up to $500K and loss of payment processing privileges.",
        confidence: "high",
      },
      {
        id: "risk-2",
        severity: "critical",
        title: "Missing Network Segmentation",
        description: "The architecture lacks Cardholder Data Environment (CDE) isolation. Without proper network segmentation, the entire infrastructure falls under PCI-DSS audit scope.",
        section: "Technical Architecture",
        impact: "Expanded audit scope increases compliance costs by 300% and extends certification timeline by 6+ months.",
        confidence: "high",
      },
      {
        id: "risk-3",
        severity: "moderate",
        title: "Insufficient Fraud Detection Specifications",
        description: "The fraud detection module is listed but lacks specifics on ML models, rule engines, or velocity checks. No mention of 3D Secure 2.0 integration.",
        section: "Implementation Scope",
        impact: "Higher chargeback rates (>1%) could trigger card network penalties and increased processing fees.",
        confidence: "normal",
      },
      {
        id: "risk-4",
        severity: "moderate",
        title: "No Disaster Recovery Plan",
        description: "While multi-AZ deployment is mentioned, there is no documented RTO/RPO targets or failover procedures for payment processing continuity.",
        section: "Technical Architecture",
        impact: "Extended downtime during outages could result in significant revenue loss and SLA violations with merchants.",
        confidence: "normal",
      },
    ],
    rawJson: '{"qualityScore":5,"grade":"F","risks":[{"severity":"critical","title":"Inadequate Card Data Storage Security","description":"No HSM specified for key management.","section":"Security Requirements","impact":"Potential data breach."},{"severity":"critical","title":"Missing Network Segmentation","description":"No CDE isolation.","section":"Technical Architecture","impact":"Expanded audit scope."},{"severity":"moderate","title":"Insufficient Fraud Detection","description":"No ML models or 3DS2.","section":"Implementation Scope","impact":"Higher chargebacks."},{"severity":"moderate","title":"No Disaster Recovery Plan","description":"No RTO/RPO targets.","section":"Technical Architecture","impact":"Extended downtime."}]}',
  },
  score: 5,
  grade: "F",
  files: [],
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: "Active",
};

// ─── DEMO: Q3 Database Migration Plan ───

export const DEMO_Q3_SQAP = `## Executive Summary
The Q3 Database Migration Plan covers the migration of 50,000 enterprise users from legacy on-premise infrastructure to AWS cloud. The team consists of 3 backend engineers and 1 DBA. The migration window is planned for a weekend during low-traffic hours. The frontend team will update UI endpoints after backend sign-off. Existing OAuth service will be used for post-migration authentication. Key risks include undefined rollback plan, pending compliance sign-off, and no formal budget authorization.

## Testing Strategy
- Unit tests for all migration scripts
- Integration tests for API endpoint changes
- No load testing defined despite 50,000 user target
- No performance benchmarking strategy
- No stress testing for concurrent migration operations

## Risk Management
This section is absent. No formal risk register, risk assessment methodology, or risk mitigation strategies have been defined for this migration project.

## Security & Compliance
- Existing OAuth service to be reused post-migration
- Compliance sign-off is pending with no resolution timeline
- No specific regulations or compliance frameworks enumerated
- No responsible party assigned for compliance resolution
- No security audit scheduled pre or post-migration

## Infrastructure & DevOps
- Target: AWS cloud infrastructure
- Migration from on-premise to cloud
- No CI/CD pipeline defined
- No deployment workflow specified
- No environment promotion strategy documented
- No infrastructure-as-code mentioned

## SLAs & Non-Functional Requirements
No SLAs, uptime targets, RTO/RPO objectives, or performance baselines have been defined for this project. There are no latency requirements, throughput targets, or availability guarantees documented.

## Budget & Resources
- $80,000 verbally approved by leadership for AWS tier upgrade
- No signed budget authorization
- No line-item cost breakdown
- No contingency reserve defined
- Team: 3 backend engineers, 1 DBA
- No additional resource allocation planned

## Stakeholder Management
- No RACI matrix defined
- No documented sign-off process
- No launch authority identified
- No escalation path documented
- No stakeholder communication plan

## Launch & Rollout
- Hard deadline: November 15, 2026
- Weekend migration window during low-traffic hours
- No phased rollout strategy
- No canary deployment
- No circuit breakers
- No go/no-go decision criteria defined
- Frontend updates after backend sign-off

## KPIs
- Primary target: 50,000 users migrated successfully
- No latency improvement targets defined
- No error rate ceiling specified
- No rollback trigger thresholds
- No SLA baselines for comparison`;

export const DEMO_Q3_RISKS: Risk[] = [
  {
    id: "R001",
    severity: "critical",
    title: "No Rollback or Contingency Plan",
    description: "No rollback plan defined despite a hard launch date tied to a marketing campaign. No contingency for deployment failures or data corruption.",
    section: "Launch & Rollout",
    impact: "Failed launch with no recovery path exposes the company to reputational damage and marketing spend loss.",
    fix: "Define a deployment rollback runbook, feature-flag strategy, and go/no-go decision matrix.",
    confidence: "high",
    similarity: 1.00,
  },
  {
    id: "R002",
    severity: "critical",
    title: "Compliance Sign-off Unresolved",
    description: "Compliance sign-off is pending with no resolution timeline, responsible party, or list of specific regulations.",
    section: "Security & Compliance",
    impact: "Launching without compliance sign-off creates legal liability and potential regulatory fines.",
    fix: "Enumerate all applicable regulations, assign a DRI, set hard sign-off deadlines as launch blockers.",
    confidence: "high",
    similarity: 0.95,
  },
  {
    id: "R003",
    severity: "critical",
    title: "No Load or Performance Testing Strategy",
    description: "Testing strategy is unit tests only. No load testing defined despite 50,000 user target.",
    section: "Testing Strategy",
    impact: "System likely to experience cascading failures at launch.",
    fix: "Define load testing at 25K, 50K, and 60K users. Specify tools — k6, Locust, or JMeter.",
    confidence: "high",
    similarity: 1.00,
  },
  {
    id: "R004",
    severity: "critical",
    title: "No SLAs or Uptime Targets",
    description: "No SLAs, uptime targets, RTO/RPO objectives, or performance baselines defined.",
    section: "SLAs & Non-Functional Requirements",
    impact: "Engineering has no quality floor to build toward. Monitoring has no alert thresholds.",
    fix: "Define uptime target 99.9%, p95/p99 latency, RTO 1hr, RPO 15min.",
    confidence: "high",
    similarity: 0.95,
  },
  {
    id: "R005",
    severity: "critical",
    title: "Budget Not Formally Approved",
    description: "$80K verbally approved only. No signed authorization, no cost breakdown, no contingency reserve.",
    section: "Budget & Resources",
    impact: "Verbal approvals can be retracted. Engineering may begin infrastructure spend that gets blocked.",
    fix: "Obtain written budget authorization. Create line-item breakdown with 15% contingency.",
    confidence: "high",
    similarity: 0.90,
  },
  {
    id: "R006",
    severity: "high",
    title: "No Formal Risk Register",
    description: "No structured tracking of risks, probability, impact, mitigations, or owners.",
    section: "Risk Management",
    impact: "Known risks will be untracked and likely materialize as launch blockers.",
    fix: "Create risk register with ID, description, probability, impact, mitigation, owner, due date, status.",
    confidence: "high",
    similarity: 0.90,
  },
  {
    id: "R007",
    severity: "high",
    title: "Stakeholder Sign-off Process Undefined",
    description: "No defined sign-off process, no RACI matrix, no documented launch authority.",
    section: "Stakeholder Management",
    impact: "Ambiguous authority leads to last-minute blockers and unclear accountability.",
    fix: "Define RACI matrix and launch sign-off checklist with named accountable parties.",
    confidence: "high",
    similarity: 0.85,
  },
  {
    id: "R008",
    severity: "high",
    title: "No CI/CD Pipeline Specification",
    description: "No CI/CD pipeline, deployment workflow, or environment strategy defined.",
    section: "Infrastructure & DevOps",
    impact: "Manual deployments at scale are error-prone for a 4-person team.",
    fix: "Define CI/CD toolchain, environment promotion strategy, automated test gates.",
    confidence: "normal",
    similarity: 0.55,
  },
  {
    id: "R009",
    severity: "high",
    title: "No Security or Authentication Spec",
    description: "No security controls, authentication mechanisms, or data encryption requirements defined.",
    section: "Security & Compliance",
    impact: "SaaS migration without security spec is a significant liability at 50K user scale.",
    fix: "Document OAuth2, MFA, RBAC, AES-256 encryption, OWASP top 10 mitigations.",
    confidence: "high",
    similarity: 0.85,
  },
  {
    id: "R010",
    severity: "high",
    title: "No Acceptance Criteria or Definition of Done",
    description: "No acceptance criteria per feature, no definition of done, no quality bar for launch readiness.",
    section: "Testing Strategy",
    impact: "QA has no pass/fail standard. Features can enter production in ambiguous states.",
    fix: "Define global DoD — unit tests passing, code review complete, QA sign-off, performance benchmarks met.",
    confidence: "high",
    similarity: 0.80,
  },
  {
    id: "R011",
    severity: "high",
    title: "No Data Retention or Backup Policy",
    description: "No backup frequency, retention schedule, or disaster recovery procedure for user data.",
    section: "Infrastructure & DevOps",
    impact: "Data loss without backup policy risks regulatory violations and customer churn.",
    fix: "Define daily backup, retention period, off-site storage, automated restore testing.",
    confidence: "normal",
    similarity: 0.60,
  },
  {
    id: "R012",
    severity: "moderate",
    title: "No API Contracts or Data Schemas",
    description: "No API contracts or OpenAPI specs. Integration points between frontend and backend unspecified.",
    section: "Infrastructure & DevOps",
    impact: "Uncontracted APIs lead to integration rework and increased QA cycles.",
    fix: "Publish OpenAPI 3.0 specs for all endpoints. Define data schemas and versioning strategy.",
    confidence: "normal",
    similarity: 0.55,
  },
  {
    id: "R013",
    severity: "moderate",
    title: "No RACI Matrix",
    description: "No responsibility assignment matrix. With 4 engineers and 1 DBA, role clarity is critical.",
    section: "Stakeholder Management",
    impact: "Ownership gaps and unclear escalation paths during crunch.",
    fix: "Create RACI for frontend, backend, QA, DevOps, security, compliance, stakeholder comms.",
    confidence: "normal",
    similarity: 0.50,
  },
  {
    id: "R014",
    severity: "moderate",
    title: "No Phased Rollout Strategy",
    description: "No phased migration plan, no canary strategy, no circuit breakers. Big-bang migration to 50K users.",
    section: "Launch & Rollout",
    impact: "Any undetected production defect affects all 50K users simultaneously.",
    fix: "Define phased rollout 1% → 10% → 25% → 100% with automated circuit breakers.",
    confidence: "high",
    similarity: 0.75,
  },
  {
    id: "R015",
    severity: "moderate",
    title: "No KPIs Beyond User Count",
    description: "Only success metric is 50K users migrated. No latency improvement targets, no error rate ceiling.",
    section: "KPIs",
    impact: "Team cannot distinguish successful migration from a failing one beyond raw completion.",
    fix: "Define latency reduction target, error rate ceiling, rollback trigger thresholds, SLA baselines.",
    confidence: "normal",
    similarity: 0.60,
  },
  {
    id: "R016",
    severity: "low",
    title: "No Disaster Recovery Policy",
    description: "No DR procedure, no multi-region failover, no incident severity classification.",
    section: "Infrastructure & DevOps",
    impact: "Regional outage during migration window with no DR plan means full data unavailability.",
    fix: "Document DR runbook, RTO/RPO targets, incident severity tiers P0–P3, on-call rotation.",
    confidence: "normal",
    similarity: 0.55,
  },
  {
    id: "R017",
    severity: "low",
    title: "No Error Handling or Edge Case Spec",
    description: "No error handling patterns, retry logic, or edge cases defined for migration failures.",
    section: "Testing Strategy",
    impact: "Inconsistent error handling during migration degrades experience and increases rollback complexity.",
    fix: "Define error taxonomy, retry policies, and migration failure states with recovery actions.",
    confidence: "normal",
    similarity: 0.50,
  },
  {
    id: "R018",
    severity: "low",
    title: "No User Communication Plan",
    description: "No plan for communicating migration downtime or service changes to 50K enterprise users.",
    section: "Stakeholder Management",
    impact: "Unannounced downtime during weekend migration window creates support ticket volume and trust damage.",
    fix: "Define user communication timeline — pre-migration notice, during-migration status page, post-migration confirmation.",
    confidence: "normal",
    similarity: 0.45,
  },
];

export const DEMO_Q3_SECTION_COVERAGE: SectionCoverage[] = [
  { name: "Rollback & Recovery", status: "MISSING", percent: 0 },
  { name: "Testing Strategy", status: "PARTIAL", percent: 15 },
  { name: "SLAs & Uptime", status: "MISSING", percent: 0 },
  { name: "Compliance & Legal", status: "MISSING", percent: 5 },
  { name: "Budget & Resources", status: "PARTIAL", percent: 25 },
  { name: "Security & Auth", status: "MISSING", percent: 0 },
  { name: "Risk Register", status: "MISSING", percent: 5 },
  { name: "Stakeholder / RACI", status: "MISSING", percent: 0 },
  { name: "CI/CD & DevOps", status: "MISSING", percent: 0 },
  { name: "Acceptance Criteria", status: "MISSING", percent: 0 },
  { name: "KPIs & Metrics", status: "PARTIAL", percent: 10 },
  { name: "Project Scope", status: "PARTIAL", percent: 35 },
];

export const DEMO_Q3_AUDIT: AuditResult = {
  qualityScore: 12,
  grade: "F",
  risks: DEMO_Q3_RISKS,
  sectionCoverage: DEMO_Q3_SECTION_COVERAGE,
  qualityGate: { locked: true, threshold: 95 },
  techScore: 14,
  businessScore: 10,
  rawJson: JSON.stringify({
    qualityScore: 12,
    grade: "F",
    techScore: 14,
    businessScore: 10,
  }),
};

export const DEMO_Q3_PROJECT: Project = {
  id: "demo-q3-migration",
  name: "Q3 Database Migration Plan",
  description: "Migrate 50,000 enterprise users to AWS infrastructure to reduce database latency. 3 backend engineers, 1 DBA. Weekend migration window during low-traffic hours. Frontend team updates UI endpoints after backend sign-off. Existing OAuth service used for post-migration authentication. Budget not yet defined — leadership has verbally approved AWS tier upgrade. Compliance sign-off pending. No rollback plan defined.",
  persona: "TPM",
  deadline: "2026-11-15T00:00:00.000Z",
  sqap: "",
  auditResult: null,
  score: 0,
  grade: "F",
  files: [],
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  status: "Active",
};

// ─── DEMO: Gallery projects ───

export const DEMO_GALLERY_PROJECTS: Project[] = [
  DEMO_PROJECT,
  DEMO_Q3_PROJECT,
  {
    id: "demo-saas-launch",
    name: "SaaS Platform Launch SQAP",
    description: "",
    sqap: "",
    auditResult: null,
    score: 67,
    grade: "C",
    files: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Active",
  },
  {
    id: "demo-mobile-api",
    name: "Mobile App API Security Review",
    description: "",
    sqap: "",
    auditResult: null,
    score: 54,
    grade: "D",
    files: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
  },
  {
    id: "demo-sso-integration",
    name: "Enterprise SSO Integration PRD",
    description: "",
    sqap: "",
    auditResult: null,
    score: 95,
    grade: "A",
    files: [],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Done",
  },
  {
    id: "demo-data-warehouse",
    name: "Data Warehouse Migration TDD",
    description: "",
    sqap: "",
    auditResult: null,
    score: 78,
    grade: "B",
    files: [],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Active",
  },
];

// Deadlines for demo gallery
export const DEMO_DEADLINES = [
  { projectId: "demo-q3-migration", name: "Q3 Database Migration Plan", deadline: "2026-11-15T00:00:00.000Z", done: false },
  { projectId: "demo-saas-launch", name: "SaaS Platform Launch SQAP", deadline: "2026-04-30T00:00:00.000Z", done: false },
  { projectId: "demo-mobile-api", name: "Mobile App API Security Review", deadline: "2026-03-28T00:00:00.000Z", done: false },
  { projectId: "demo-sso-integration", name: "Enterprise SSO Integration PRD", deadline: null, done: true },
  { projectId: "demo-data-warehouse", name: "Data Warehouse Migration TDD", deadline: "2026-05-15T00:00:00.000Z", done: false },
];

// Fix scoring map
export const SEVERITY_SCORE_MAP: Record<string, number> = {
  critical: 15,
  high: 8,
  moderate: 4,
  low: 1,
};

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "proj-3",
    name: "Mobile Car Pooling Business Plan",
    description: "",
    sqap: "",
    auditResult: null,
    score: 92,
    grade: "A",
    files: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  DEMO_PROJECT,
  {
    id: "proj-2",
    name: "Mobile App Launch Strategy",
    description: "",
    sqap: "",
    auditResult: null,
    score: 68,
    grade: "C",
    files: [],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-1",
    name: "Seattle Car Detailing Business Plan",
    description: "",
    sqap: "",
    auditResult: null,
    score: 85,
    grade: "A",
    files: [],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-4",
    name: "E-commerce Platform Security Audit",
    description: "",
    sqap: "",
    auditResult: null,
    score: 45,
    grade: "D",
    files: [],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
