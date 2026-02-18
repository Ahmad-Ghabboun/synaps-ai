export interface Risk {
  id: string;
  severity: "critical" | "moderate";
  title: string;
  description: string;
  section: string;
  impact: string;
  confidence?: "high" | "normal";
  isFixing?: boolean;
}

export interface AuditResult {
  qualityScore: number;
  grade: string;
  risks: Risk[];
  rawJson?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sqap: string;
  auditResult: AuditResult | null;
  score: number;
  grade: string;
  createdAt: string;
  updatedAt: string;
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

export const DEMO_PROJECT: Project = {
  id: "demo-fintech",
  name: "Fintech Payment Gateway",
  description: "Build a fintech app that processes credit card payments, stores card data for recurring billing, integrates with Stripe and PayPal, handles PCI-DSS compliance, and provides a merchant dashboard with real-time transaction analytics.",
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
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Seattle Car Detailing Business Plan",
    description: "",
    sqap: "",
    auditResult: null,
    score: 85,
    grade: "A",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-2",
    name: "Mobile App Launch Strategy",
    description: "",
    sqap: "",
    auditResult: null,
    score: 68,
    grade: "C",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-3",
    name: "Mobile Car Pooling Business Plan",
    description: "",
    sqap: "",
    auditResult: null,
    score: 92,
    grade: "A",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  DEMO_PROJECT,
];
