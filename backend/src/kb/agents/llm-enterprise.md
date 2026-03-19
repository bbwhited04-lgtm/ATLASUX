# Using LLMs in Enterprise

## Overview

Enterprise LLM adoption has moved past the experimentation phase. In 2024 and 2025, organizations shifted from proof-of-concept chatbots to production systems that handle customer interactions, automate internal workflows, and augment knowledge workers at scale. But enterprise deployment brings a distinct set of challenges: data privacy regulations, integration with legacy systems, governance frameworks, and cost management at volumes that dwarf startup usage.

This article covers enterprise adoption patterns, compliance requirements, deployment architectures, and real-world case studies across industries. The goal is to give technical leaders a practical framework for deploying LLMs within the constraints of enterprise environments.

---

## Enterprise Adoption Patterns

### The Three Waves

**Wave 1: Copilots (2023–2024)**

Individual productivity tools that augment human workers. The human remains in the loop for every decision.

- GitHub Copilot for software development
- Microsoft 365 Copilot for document drafting, email, and meetings
- Salesforce Einstein GPT for CRM-assisted selling
- Adobe Firefly for creative content

**Characteristics:**

- Low organizational risk (human reviews all output)
- Easy to measure ROI (time saved per task)
- Minimal integration requirements (works within existing tools)
- No regulatory approval needed (human is the decision-maker)

**Wave 2: Agents (2024–2025)**

Semi-autonomous systems that execute multi-step workflows with limited human oversight. The human approves high-stakes actions but the agent handles routine execution.

- Customer support agents that resolve tickets end-to-end
- Invoice processing agents that extract, validate, and route
- Recruitment agents that screen resumes and schedule interviews
- IT support agents that diagnose and remediate common issues

**Characteristics:**

- Moderate organizational risk (agent acts on behalf of the company)
- Requires guardrails, approval workflows, and audit trails
- Integration with business systems (CRM, ERP, ticketing)
- Needs governance framework and model risk management

**Wave 3: Autonomous Workflows (2025+)**

Fully autonomous systems that operate continuously without human intervention, handling exceptions programmatically.

- Automated contract review and negotiation
- Real-time fraud detection and response
- Dynamic pricing optimization
- Autonomous supply chain management

**Characteristics:**

- High organizational risk (machine makes consequential decisions)
- Requires extensive testing, monitoring, and failsafe mechanisms
- Regulatory scrutiny (EU AI Act, industry-specific regulations)
- Significant integration and change management effort

![Enterprise AI maturity model showing progression from copilots to agents to autonomous systems](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/800px-Camponotus_flavomarginatus_ant.jpg)

---

## Data Privacy and Compliance

### GDPR (General Data Protection Regulation)

The EU's GDPR has specific implications for LLM usage:

**Data processing:**

- User prompts containing personal data are "processing" under GDPR
- You need a lawful basis (consent, legitimate interest, or contractual necessity) to send personal data to an LLM
- Data Processing Agreements (DPAs) are required with LLM providers
- The right to erasure extends to training data — if a user requests deletion, you must ensure their data is not retained by the provider

**Data residency:**

- EU personal data must be processed within the EU/EEA unless adequate safeguards exist
- Azure OpenAI offers EU data residency (Sweden, France)
- AWS Bedrock is available in Frankfurt (eu-central-1) and Ireland (eu-west-1)
- Self-hosted models on EU infrastructure fully satisfy this requirement

**Practical implementation:**

```typescript
// PII detection and redaction before sending to LLM
import { detectPII, redactPII, restorePII } from './pii-utils';

async function gdprSafeLLMCall(prompt: string): Promise<string> {
  // 1. Detect and redact PII
  const { redactedText, piiMap } = redactPII(prompt);
  // "John Smith (john@example.com) needs a plumber"
  // → "[PERSON_1] ([EMAIL_1]) needs a plumber"

  // 2. Send redacted text to LLM
  const response = await llm.chat(redactedText);

  // 3. Restore PII in response if needed
  return restorePII(response, piiMap);
}
```

### HIPAA (Health Insurance Portability and Accountability Act)

For healthcare organizations using LLMs:

- **BAA (Business Associate Agreement):** Required with any LLM provider processing PHI (Protected Health Information)
- **Azure OpenAI:** Offers HIPAA BAA
- **AWS Bedrock:** Offers HIPAA BAA
- **OpenAI direct API:** Does NOT offer HIPAA BAA for ChatGPT; Enterprise API has BAA options
- **Self-hosted:** Fully HIPAA-compliant if infrastructure meets requirements (encryption at rest and in transit, access controls, audit logging)

**De-identification:**

- Use HIPAA Safe Harbor method: remove 18 identifier types before sending to LLMs
- Alternatively, use Expert Determination method with a qualified statistical expert

### SOC 2 Type II

SOC 2 compliance requires demonstrating security controls across five trust service criteria. LLM usage impacts:

- **Security:** Access controls on LLM APIs, API key management, network security
- **Availability:** SLA monitoring for LLM providers, failover strategies
- **Processing integrity:** Input validation, output verification, audit trails
- **Confidentiality:** Data classification, encryption, access restrictions
- **Privacy:** PII handling, consent management, data retention policies

**Atlas UX approach:**

Atlas UX implements SOC 2 CC7.2 via hash chain integrity in the audit trail. Every mutation is logged to the `audit_log` table with cryptographic chaining, ensuring tamper-evident records of all LLM-related actions.

```typescript
// Audit trail for LLM decisions (SOC 2 CC7.2 compliance)
await prisma.audit_log.create({
  data: {
    tenant_id: tenantId,
    action: 'llm_decision',
    resource_type: 'appointment',
    resource_id: appointmentId,
    details: {
      model: 'gpt-4o',
      prompt_version: 'v2.3',
      decision: 'book_appointment',
      confidence: 0.94,
      human_approved: riskTier >= 2,
    },
    hash: computeChainHash(previousHash, eventData),
  },
});
```

---

## On-Premise vs Cloud Deployment

### Decision Framework

| Factor | Cloud (API) | Cloud (Managed) | On-Premise |
|--------|------------|-----------------|------------|
| **Data leaves your network** | Yes | Partially | No |
| **Setup time** | Hours | Days | Weeks–Months |
| **GPU procurement** | None | None | 3–12 month lead time |
| **Operational burden** | Minimal | Low | Significant |
| **Model selection** | Provider catalog | Broader (includes OSS) | Any model |
| **Cost at low volume** | Low (pay per token) | Moderate | Very high (GPU capex) |
| **Cost at high volume** | High | Moderate | Low (amortized) |
| **Compliance** | Depends on provider | Good (certifications) | Full control |
| **Customization** | Limited | Moderate | Full |
| **Latency** | 200–2000ms | 100–500ms | 50–200ms |

### Hybrid Architecture

Most enterprises adopt a hybrid approach:

- **Sensitive data (PHI, PII, financial):** Processed on-premise or in a private cloud with self-hosted models
- **General queries (non-sensitive):** Routed to cloud APIs for best model quality and lowest operational burden
- **Development and testing:** Cloud APIs for rapid iteration
- **Production (high-volume):** Self-hosted for cost optimization

```typescript
// Hybrid routing based on data classification
function routeToProvider(request: LLMRequest): Provider {
  const classification = classifyDataSensitivity(request.messages);

  switch (classification) {
    case 'PHI':
    case 'PII_HIGH':
      return providers.onPremise; // Self-hosted Llama on internal GPU cluster
    case 'PII_LOW':
      return providers.azureOpenAI; // Azure with BAA, EU data residency
    case 'PUBLIC':
      return providers.openAI; // Direct API for best quality
    default:
      return providers.onPremise; // Default to most restrictive
  }
}
```

![Hybrid cloud architecture showing data routing between on-premise and cloud LLM providers](https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Hybrid_cloud.svg/800px-Hybrid_cloud.svg.png)

---

## RAG for Internal Knowledge Bases

### Enterprise RAG Architecture

Enterprise RAG differs from consumer RAG in several critical ways:

- **Access control:** Users should only retrieve documents they are authorized to see
- **Data freshness:** Internal documents change constantly — the index must stay current
- **Source diversity:** Knowledge lives in SharePoint, Confluence, Google Drive, Slack, email, databases, and file shares
- **Scale:** Millions of documents across hundreds of data sources

### Access-Controlled Retrieval

```typescript
// Enterprise RAG with permission-aware retrieval
async function enterpriseRAG(
  query: string,
  userId: string,
  tenantId: string,
): Promise<RAGResponse> {
  // 1. Get user's access permissions
  const permissions = await getPermissions(userId, tenantId);
  // { departments: ['engineering', 'product'], clearance: 'confidential' }

  // 2. Embed query
  const queryEmbedding = await embed(query);

  // 3. Search with permission filter
  const documents = await vectorStore.search(queryEmbedding, {
    topK: 10,
    filter: {
      tenant_id: tenantId,
      clearance_level: { $lte: permissions.clearance },
      $or: [
        { department: { $in: permissions.departments } },
        { visibility: 'all_employees' },
      ],
    },
  });

  // 4. Generate response with citations
  const response = await llm.chat([
    { role: 'system', content: ENTERPRISE_RAG_SYSTEM_PROMPT },
    { role: 'user', content: formatRAGPrompt(query, documents) },
  ]);

  return {
    answer: response.content,
    sources: documents.map(d => ({
      title: d.metadata.title,
      url: d.metadata.url,
      relevance: d.score,
    })),
  };
}
```

### Data Ingestion Pipeline

```
Data Sources                    Processing                  Storage
───────────────                ───────────                ────────
SharePoint    ──┐
Confluence    ──┤              ┌──────────┐             ┌──────────┐
Google Drive  ──┼──── ETL ────►│ Chunking │────Embed───►│ Vector   │
Slack         ──┤              │ Cleaning │             │ Store    │
Email         ──┤              │ Metadata │             │(Pinecone,│
Databases     ──┘              └──────────┘             │ Weaviate)│
                                                        └──────────┘
                   ▲
                   │
              Incremental sync
              (webhook/polling)
```

**Key decisions:**

- **Chunking strategy:** 512 tokens with 50-token overlap is a reasonable default. Adjust based on document structure.
- **Embedding model:** OpenAI `text-embedding-3-large` (3072 dimensions) or open-source alternatives (BGE, E5) for on-premise.
- **Re-ranking:** After initial vector search, use a cross-encoder re-ranker (Cohere Rerank, BGE Reranker) to improve precision.
- **Hybrid search:** Combine vector similarity with keyword search (BM25) for best recall.

---

## Agent Architectures for Enterprise Automation

### The Enterprise Agent Stack

```
┌─────────────────────────────────────────┐
│           Orchestration Layer            │
│  (Agent router, task planner, memory)    │
├─────────────────────────────────────────┤
│            Tool Layer                    │
│  (CRM API, ERP API, Email, Calendar,    │
│   Database, File Storage, Search)        │
├─────────────────────────────────────────┤
│           Safety Layer                   │
│  (Guardrails, approval workflows,        │
│   spend limits, audit trail)             │
├─────────────────────────────────────────┤
│           LLM Layer                      │
│  (Model router, fallback, caching)       │
└─────────────────────────────────────────┘
```

### Approval Workflows

Enterprise agents must not execute high-risk actions autonomously. Implement tiered approval:

```typescript
// Risk tier classification for agent actions
function classifyRisk(action: AgentAction): RiskTier {
  // Tier 0: Read-only (no approval needed)
  if (action.type === 'read' || action.type === 'search') return 0;

  // Tier 1: Low-risk mutations (auto-approve with logging)
  if (action.type === 'send_message' && action.channel === 'internal') return 1;
  if (action.type === 'update_status') return 1;

  // Tier 2: Moderate-risk (manager approval)
  if (action.type === 'send_email' && action.external) return 2;
  if (action.type === 'create_ticket') return 2;

  // Tier 3: High-risk (executive approval + audit)
  if (action.type === 'financial_transaction') return 3;
  if (action.type === 'delete_data') return 3;
  if (action.type === 'modify_access') return 3;

  return 3; // Default to highest risk for unknown actions
}
```

This mirrors Atlas UX's decision memo pattern, where actions with risk tier >= 2 require explicit approval before execution.

---

## Integration with Existing Systems

### Common Enterprise Integrations

**CRM (Salesforce, HubSpot, Dynamics 365):**

- Retrieve customer context before LLM generates responses
- Log AI interactions as activities on customer records
- Update deal stages, contact information based on AI analysis
- Generate personalized outreach based on CRM data

**ERP (SAP, Oracle, NetSuite):**

- Query inventory, pricing, and order status
- Generate purchase orders and invoices
- Automate approval routing based on business rules
- Anomaly detection in financial transactions

**ITSM (ServiceNow, Jira Service Management):**

- Auto-classify and route incoming tickets
- Suggest resolutions based on knowledge base
- Automate Level 1 support for common issues
- Generate incident reports and post-mortems

**Communication (Slack, Teams, Email):**

- AI assistants in team channels
- Email drafting and summarization
- Meeting note generation and action item extraction
- Automated status updates and notifications

### Integration Architecture Pattern

```typescript
// Tool registration for enterprise agent
const enterpriseTools = [
  {
    name: 'salesforce_query',
    description: 'Query Salesforce for customer, opportunity, or case data',
    parameters: { soql: 'string' },
    execute: async (params) => salesforceClient.query(params.soql),
    riskTier: 0,
  },
  {
    name: 'salesforce_update',
    description: 'Update a Salesforce record',
    parameters: { objectType: 'string', recordId: 'string', fields: 'object' },
    execute: async (params) => salesforceClient.update(params.objectType, params.recordId, params.fields),
    riskTier: 2,
  },
  {
    name: 'servicenow_create_ticket',
    description: 'Create a ServiceNow incident ticket',
    parameters: { summary: 'string', description: 'string', priority: 'number', assignmentGroup: 'string' },
    execute: async (params) => serviceNowClient.createIncident(params),
    riskTier: 1,
  },
  {
    name: 'send_email',
    description: 'Send an email on behalf of the user',
    parameters: { to: 'string', subject: 'string', body: 'string' },
    execute: async (params) => emailClient.send(params),
    riskTier: 2,
  },
];
```

---

## Cost Management at Scale

### Enterprise LLM Spend Patterns

A typical enterprise LLM deployment processes millions of requests per month. Without cost controls, spend can spiral quickly.

**Cost levers:**

| Lever | Savings | Implementation Effort |
|-------|---------|----------------------|
| Model routing (use cheap models for simple tasks) | 40–70% | Medium |
| Semantic caching | 20–40% | Medium |
| Prompt optimization (shorter prompts) | 10–30% | Low |
| Batch processing (off-peak) | 50% | Low |
| Self-hosted for high-volume workloads | 60–80% | High |
| Context pruning (shorter conversation history) | 15–25% | Low |

### Budget Controls

```typescript
// Enterprise cost control middleware
class CostController {
  private dailySpend: Map<string, number> = new Map();
  private monthlySpend: Map<string, number> = new Map();

  async checkBudget(tenantId: string, estimatedCost: number): Promise<boolean> {
    const daily = (this.dailySpend.get(tenantId) || 0) + estimatedCost;
    const monthly = (this.monthlySpend.get(tenantId) || 0) + estimatedCost;

    if (daily > DAILY_BUDGET_LIMIT) {
      await alertOps(`Tenant ${tenantId} approaching daily LLM budget`);
      return false;
    }

    if (monthly > MONTHLY_BUDGET_LIMIT) {
      await alertOps(`Tenant ${tenantId} exceeded monthly LLM budget`);
      return false;
    }

    return true;
  }

  recordSpend(tenantId: string, actualCost: number): void {
    this.dailySpend.set(tenantId, (this.dailySpend.get(tenantId) || 0) + actualCost);
    this.monthlySpend.set(tenantId, (this.monthlySpend.get(tenantId) || 0) + actualCost);
  }
}
```

---

## Governance Frameworks and Model Risk Management

### Model Risk Management (MRM)

Financial regulators (OCC, Fed, PRA) have extended model risk management requirements to LLMs. Key elements:

**Model inventory:**

- Catalog every LLM used in the organization (including shadow IT usage via ChatGPT)
- Record: model name, version, provider, use case, risk classification, owner, validation date

**Validation:**

- Independent validation of model performance against benchmarks
- Bias testing across protected categories
- Stress testing with adversarial inputs
- Regular re-validation (quarterly or when models are updated)

**Monitoring:**

- Continuous monitoring of output quality metrics
- Drift detection (is the model's performance degrading over time?)
- Alert on anomalous outputs or usage patterns
- Incident response procedures for model failures

### AI Governance Framework

```
┌───────────────────────────────────────────────┐
│              AI Governance Board               │
│  (CTO, CISO, Legal, Compliance, Ethics)       │
├───────────────────────────────────────────────┤
│              Policy Layer                      │
│  - Acceptable use policy                       │
│  - Data classification requirements            │
│  - Approval authority matrix                   │
│  - Incident response procedures               │
├───────────────────────────────────────────────┤
│              Technical Controls                │
│  - Model inventory and versioning             │
│  - Access controls and audit logging          │
│  - Content filtering and guardrails           │
│  - Cost monitoring and budget controls        │
│  - PII detection and redaction                │
├───────────────────────────────────────────────┤
│              Operational Procedures            │
│  - Model onboarding/offboarding process       │
│  - Validation and testing requirements        │
│  - Monitoring and alerting standards          │
│  - Change management for prompts/models       │
│  - User training and awareness                │
└───────────────────────────────────────────────┘
```

![Enterprise AI governance framework showing policy, technical controls, and operational layers](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Entreprise_Organization.png/800px-Entreprise_Organization.png)

---

## Enterprise Case Studies

### Customer Service: Klarna

Klarna deployed an AI assistant powered by OpenAI that handles two-thirds of customer service conversations. Results:

- Handles 2.3 million conversations in its first month
- Equivalent to 700 full-time agents
- Resolution time dropped from 11 minutes to under 2 minutes
- Customer satisfaction scores on par with human agents
- Estimated $40 million annual profit improvement

**Lesson:** Start with high-volume, well-defined customer service queries. Use human agents for complex cases and as a training source for the AI.

### Legal: Harvey AI

Harvey AI is used by law firms including Allen & Overy for contract analysis, legal research, and document drafting.

- Trained on legal-specific data with extensive fine-tuning
- Deployed with strict access controls and audit trails
- Lawyers review all output before client delivery
- Reduces research time by 50–70% for routine legal questions

**Lesson:** Domain-specific fine-tuning matters in specialized fields. The LLM augments experts rather than replacing them.

### Finance: Bloomberg GPT → Bloomberg AI

Bloomberg built a finance-specific LLM trained on 40+ years of financial data. Used for:

- Sentiment analysis of financial news and filings
- Named entity recognition for financial instruments
- Automated financial report summarization
- Risk factor analysis

**Lesson:** Proprietary training data creates a moat. Generic LLMs cannot match domain-specific models on specialized tasks.

### HR: Unilever Recruitment

Unilever uses AI to screen initial job applications:

- AI analyzes video interviews for language patterns and content
- Reduced time-to-hire from 4 months to 4 weeks
- Increased candidate diversity by 16%
- Human recruiters make final decisions

**Lesson:** AI in HR requires extreme care around bias. Regular bias audits and human oversight are mandatory.

### Internal Knowledge: Microsoft 365 Copilot

Microsoft's 365 Copilot integrates LLMs across Word, Excel, PowerPoint, Outlook, and Teams:

- Drafts documents based on organizational data
- Summarizes email threads and meetings
- Generates presentations from written documents
- Answers questions about internal policies and procedures

**Lesson:** Integration with existing productivity tools drives adoption. Users adopt AI faster when it appears within tools they already use.

![Enterprise AI deployment architecture showing integration layers across business systems](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/800px-Google_2015_logo.svg.png)

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1–3)

- [ ] Establish AI governance committee
- [ ] Define acceptable use policy
- [ ] Select initial use case (customer service or internal knowledge)
- [ ] Choose deployment model (cloud API with DPA)
- [ ] Implement audit logging and cost tracking
- [ ] Deploy POC with limited user group

### Phase 2: Scale (Months 4–8)

- [ ] Expand to 2–3 additional use cases
- [ ] Implement RAG with internal knowledge base
- [ ] Deploy access-controlled retrieval
- [ ] Establish model validation procedures
- [ ] Build monitoring dashboards
- [ ] Train power users and champions

### Phase 3: Mature (Months 9–12)

- [ ] Deploy agent-based automation for routine workflows
- [ ] Implement multi-model routing for cost optimization
- [ ] Evaluate self-hosted models for high-volume workloads
- [ ] Establish formal MRM program
- [ ] Measure and report ROI across use cases
- [ ] Plan autonomous workflow pilots

---

## Video Resources

1. [Enterprise AI Strategy — McKinsey Technology Council](https://www.youtube.com/watch?v=4Xs3sOgaukI) — Senior McKinsey partners discuss enterprise AI adoption patterns, governance frameworks, and how Fortune 500 companies are deploying LLMs across business functions.

2. [Building Enterprise RAG Systems — Jerry Liu (LlamaIndex)](https://www.youtube.com/watch?v=TRjq7t2Ms5I) — LlamaIndex founder Jerry Liu explains enterprise RAG architecture, including access-controlled retrieval, multi-source ingestion, and evaluation frameworks for production knowledge systems.

---

## References

[1] Bommasani, R., et al. "On the Opportunities and Risks of Foundation Models." Stanford Center for Research on Foundation Models (CRFM), 2022. https://arxiv.org/abs/2108.07258

[2] European Parliament. "Regulation (EU) 2024/1689 — Artificial Intelligence Act." Official Journal of the European Union, 2024. https://eur-lex.europa.eu/eli/reg/2024/1689/oj

[3] National Institute of Standards and Technology. "AI Risk Management Framework (AI RMF 1.0)." NIST AI 100-1, January 2023. https://www.nist.gov/artificial-intelligence/executive-order-safe-secure-and-trustworthy-artificial-intelligence

[4] Office of the Comptroller of the Currency. "Model Risk Management — Supervisory Guidance on Model Risk Management (SR 11-7)." Board of Governors of the Federal Reserve System, 2011. https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm

[5] Klarna. "Klarna AI Assistant Handles Two-Thirds of Customer Service Chats in Its First Month." Klarna Press Release, February 2024. https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/
