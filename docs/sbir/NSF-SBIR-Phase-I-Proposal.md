# NSF SBIR Phase I Proposal — Atlas UX
## Autonomous AI Voice Agent for Underserved Small Business Communication

**Applicant:** Dead App Corp (DBA Atlas UX)
**PI:** Billy Whited, Founder & CEO
**Solicitation:** NSF 24-579 (or successor)
**Award Requested:** $305,000
**Duration:** 12 months

---

## 1. PROJECT SUMMARY (1 page)

### Overview
Atlas UX proposes to develop and validate an autonomous AI voice agent ("Lucy") capable of real-time natural language phone communication, multilingual intent detection, and autonomous business workflow execution for underserved small trade businesses (plumbers, salons, HVAC technicians, electricians). These 6.1 million US businesses lose an estimated $400–$7,200 per month to missed calls because owners cannot answer the phone while performing manual labor. Current solutions (human receptionists at $2,400–$4,000/month) are economically inaccessible. Atlas UX delivers equivalent functionality at $99/month using novel AI voice processing, real-time language detection across 8 languages, and a multi-agent orchestration framework governed by formal policy constraints.

### Intellectual Merit
This research advances the state of the art in three areas: (1) real-time multilingual voice intent classification under noisy telephony conditions, (2) autonomous multi-agent orchestration with formal governance constraints (System Governance Language), and (3) human-AI trust calibration for non-technical users in high-stakes business communication. The proposed system must operate within a 500ms latency budget for natural conversational flow — a constraint that pushes current LLM inference architectures beyond typical benchmarks.

### Broader Impacts
Atlas UX directly serves an underserved market segment: owner-operated trade businesses that lack IT infrastructure, technical expertise, and capital for enterprise communication solutions. By democratizing access to AI-powered business communication, this project enables equitable economic participation for small businesses in rural and underserved communities. The multilingual capability (8 languages including Spanish, French, Portuguese, Chinese, Japanese, Korean, and German) addresses the 25.6 million limited-English-proficiency individuals in the US who currently face communication barriers when accessing local services.

---

## 2. PROJECT DESCRIPTION (10-15 pages)

### Section A: Intellectual Merit

#### A.1 Problem Statement and Technical Innovation

Small trade businesses represent 6.1 million establishments in the United States, generating over $1.7 trillion in annual revenue. These businesses share a critical operational vulnerability: their primary revenue channel (inbound phone calls) is structurally incompatible with their primary value delivery (manual labor requiring both hands and full attention).

Industry data indicates:
- 40–62% of inbound calls to trade businesses go unanswered during working hours
- 85% of callers who reach voicemail call a competing business rather than leaving a message
- Average revenue per missed call: $200–$400 (plumbing/HVAC), $85–$150 (salons/barbershops)
- Estimated aggregate annual revenue loss: $26–$78 billion across the US trade sector

Current solutions fail this market:
- **Human receptionists** ($2,400–$4,000/month): Economically inaccessible for businesses with $150K–$500K annual revenue
- **IVR/phone tree systems**: Callers abandon at 53% rate; cannot handle natural conversation
- **AI chatbots**: Text-only; trade customers call, they don't chat
- **Answering services** (Smith.ai at $285+/month, Ruby at $400+/month): Human-dependent, limited hours, single language

Atlas UX proposes a fundamentally different approach: a fully autonomous AI voice agent that conducts natural phone conversations, understands caller intent in real-time, and executes business workflows (appointment booking, SMS confirmation, team notification, CRM logging) without human intervention.

#### A.2 Technical Approach

**A.2.1 Real-Time Voice Intent Classification**

The core technical challenge is classifying caller intent from streaming telephony audio within a 500ms response window to maintain natural conversational flow. Our approach combines:

- Streaming speech-to-text via Whisper-class models optimized for telephony codec artifacts (G.711 µ-law at 8kHz, background noise from job sites)
- Intent classification pipeline: acoustic features → semantic embedding → intent taxonomy mapping
- Dynamic context accumulation: intent confidence scores are updated incrementally as the caller speaks, enabling early response preparation before utterance completion
- Fallback escalation: if intent confidence remains below threshold after 2 conversational turns, Lucy gracefully transfers to the business owner

**A.2.2 Multilingual Detection and Switching**

Lucy detects the caller's language within the first 3 seconds of speech using a lightweight acoustic language identification model. Upon detection, Lucy switches her response language, TTS voice, and cultural communication norms (formality level, greeting conventions) without interrupting the conversation flow. This is technically challenging because:

- Telephony audio (8kHz, compressed) degrades acoustic features used for language ID
- Code-switching (callers mixing languages mid-sentence) requires continuous monitoring
- Response generation must maintain context across language switches

**A.2.3 Multi-Agent Orchestration with Formal Governance**

Atlas UX introduces System Governance Language (SGL), a formal policy specification for constraining autonomous AI agent behavior. SGL policies define:

- Action boundaries: which operations each agent may perform
- Spend limits: maximum financial commitment per action and per day
- Risk tiers: actions classified by reversibility and impact; high-risk actions require human approval via decision memos
- Audit requirements: every agent action is logged to an immutable audit trail

This governance framework addresses a critical gap in current multi-agent AI systems: the ability to deploy autonomous agents in business-critical contexts with verifiable behavioral constraints.

**A.2.4 Autonomous Workflow Execution**

Upon intent classification, Lucy executes the appropriate business workflow:
1. **Appointment booking**: Queries available calendar slots, negotiates time with caller, creates booking, sends SMS confirmation
2. **Emergency triage**: Classifies urgency, routes to appropriate response (immediate callback, next-available slot, after-hours protocol)
3. **Information requests**: Answers business-specific questions from a knowledge base (pricing, hours, services, location)
4. **Lead capture**: Records caller information, creates CRM entry, routes to appropriate follow-up workflow

Each workflow operates within SGL constraints and generates a complete audit trail.

#### A.3 Technical Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM latency exceeds 500ms budget | Unnatural conversation flow | Speculative response generation; edge-cached common responses; fallback to template responses |
| Multilingual detection error | Wrong language response | Confidence threshold with English fallback; caller confirmation prompt |
| Calendar race condition | Double-booking | Advisory locks (pg_advisory_xact_lock) on appointment slot check-and-insert |
| Telephony provider outage | Complete service loss | Hot-standby secondary provider with automatic failover |
| Adversarial callers | Prompt injection, abuse | Input sanitization; conversation bounds; automatic disconnect on abuse patterns |

#### A.4 Research Plan and Milestones

| Month | Milestone | Success Criteria |
|-------|-----------|-----------------|
| 1-3 | Voice intent classification optimization | ≥95% intent accuracy on telephony audio; P95 latency ≤400ms |
| 3-5 | Multilingual detection and switching | ≥98% language ID accuracy within 3 seconds; seamless mid-call switching |
| 5-7 | SGL governance framework formalization | Formal specification published; automated policy verification |
| 7-9 | Field trial with 50 trade businesses | ≥90% call resolution without human escalation |
| 9-11 | Performance optimization and edge cases | Handle 50 concurrent calls; ≤1% error rate |
| 11-12 | Results analysis, Phase II proposal | Peer-reviewed publication; Phase II plan |

### Section B: Company/Team

**Billy Whited, Founder & CEO / Principal Investigator**
- Full-stack engineer with expertise in AI/ML systems, real-time communication platforms, and small business operations
- Built and deployed Atlas UX from concept to production: 33 AI agents operating autonomously in production for 30+ days with zero critical incidents
- Direct experience in the target market: understands trade business operations, communication patterns, and technology adoption barriers
- 100% effort on this project

**Company: Dead App Corp (DBA Atlas UX)**
- Founded: [Year]
- Headquarters: [City, State]
- Employees: 1 (founder)
- Revenue: Pre-revenue (Beta phase)
- Core competency: AI voice communication systems for underserved small businesses

**5-Year Vision:**
Atlas UX will be the standard AI communication platform for trade businesses in the United States, serving 10,000+ businesses across 12 trade verticals, processing 1M+ calls per month, and generating $12M+ ARR. Phase I research directly enables this vision by validating core technical capabilities.

### Section C: Broader Impacts

#### C.1 Motivation and Societal Benefits

The US trade sector faces a structural communication inequality: businesses that generate revenue through physical labor cannot simultaneously participate in the digital communication economy. This creates a compounding disadvantage:

- **Economic**: $26–$78B in aggregate annual revenue loss from missed calls
- **Employment**: Trade businesses that lose customers cannot hire additional workers, contributing to the skilled labor shortage
- **Access**: Limited-English-proficiency communities are disproportionately excluded when businesses cannot communicate in their language
- **Rural**: Rural trade businesses are furthest from human receptionist services and most dependent on phone-based customer acquisition

Atlas UX directly addresses each of these impacts by providing enterprise-grade communication capabilities at a price point ($99/month) accessible to businesses with as few as one employee.

#### C.2 Target Communities

- **Primary**: Owner-operated trade businesses (1–10 employees) in metropolitan and rural areas
- **Secondary**: Limited-English-proficiency customers who benefit from multilingual AI receptionist capabilities
- **Tertiary**: Underemployed workers in trade sectors who benefit from business growth enabled by improved call capture

#### C.3 Measurement

- Number of businesses served and calls handled per month
- Revenue recovered (calculated from calls answered that would have been missed)
- Multilingual calls served (proxy for LEP community access)
- Geographic distribution (rural vs. urban deployment)

### Section D: Commercialization Potential

#### D.1 Market Size

- **TAM**: 6.1M trade businesses × $1,188/year = $7.2B
- **SAM**: 2.1M businesses with 5+ calls/day = $2.5B
- **SOM**: 10,000 businesses in Year 5 = $12M ARR

#### D.2 Business Model

- SaaS subscription: $99/month (Standard), $149/month (Team), $199/month (Growth)
- Usage-based overage: $0.25/call beyond 200 calls/month
- Gross margin target: 60–70% at scale (AI inference costs decrease with volume optimization)
- CAC target: $150 (founder-led sales → referral program → paid acquisition)
- LTV: $1,782 (18-month average retention × $99/month)
- LTV:CAC ratio: 11.9x

#### D.3 Competitive Advantage

| Competitor | Price | Model | Limitation |
|-----------|-------|-------|------------|
| Smith.ai | $285+/mo | Human + AI | Limited hours, single language, per-call overage |
| Ruby | $400+/mo | Human | Business hours only, expensive |
| Goodcall | $59+/mo | IVR | Phone tree, not conversational |
| GoHighLevel | $97+/mo | Platform | Requires technical setup, agency-focused |
| **Atlas UX** | **$99/mo** | **Autonomous AI** | **24/7, 8 languages, books + confirms + notifies** |

Atlas UX is the only solution that bundles autonomous inbound call handling, real-time appointment booking, SMS confirmation, multi-channel notification, and CRM logging at a price point accessible to owner-operated trade businesses.

#### D.4 IP Strategy

- Trade secret protection for SGL governance framework and multi-agent orchestration algorithms
- Provisional patent filing planned for real-time multilingual voice intent classification system
- Open-source contribution planned for SGL specification (drives adoption, establishes standard)

#### D.5 Regulatory Considerations

- TCPA compliance for all outbound calling (DNC scrubbing, calling hour restrictions, AI disclosure)
- Recording consent: natural-language disclosure in all calls, two-party-consent state detection
- PII protection: phone number masking in logs, encrypted storage, data retention policies
- HIPAA readiness for dental/medical trade vertical expansion

---

## 3. BUDGET SUMMARY

| Category | Amount |
|----------|--------|
| Senior Personnel (PI — 12 months) | $120,000 |
| Fringe Benefits (30%) | $36,000 |
| Cloud Computing (AWS, AI inference) | $36,000 |
| Telephony (Twilio, testing) | $12,000 |
| Travel (NSF SBIR meetings, I-Corps) | $8,000 |
| Materials & Supplies | $5,000 |
| Indirect Costs | $58,000 |
| Small Business Fee (7%) | $19,250 |
| **Total** | **$294,250** |

---

## 4. REGISTRATION CHECKLIST

- [ ] SAM.gov registration (in progress)
- [ ] UEI number obtained
- [ ] Research.gov account created
- [ ] SBA company registry
- [ ] NSF Project Pitch submitted (required before full proposal)
- [ ] SciENcv biographical sketch prepared
- [ ] Data Management Plan drafted
- [ ] Letters of commitment (if subawardees)
