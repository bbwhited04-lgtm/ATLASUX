# AI Analyst: Ontology vs Semantic Layer

## Introduction

As organizations deploy AI analysts — systems that answer business questions by querying data, generating reports, and surfacing insights — two foundational concepts compete for the role of "meaning layer" between raw data and intelligent responses: ontologies and semantic layers. Both attempt to bridge the gap between how data is stored (schemas, tables, columns, JSON documents) and how humans think about their business (revenue, customers, churn, pipeline). But they come from different traditions, serve different purposes, and are implemented with different tools. An ontology, rooted in knowledge representation, defines what kinds of things exist in a domain and how they relate. A semantic layer, rooted in business intelligence, defines how raw data maps to business metrics and dimensions. For AI analysts that must both reason about domain concepts and compute accurate metrics, understanding where these two approaches overlap, diverge, and converge is essential.

## What is a Semantic Layer?

### Definition

A semantic layer is a business logic abstraction that sits between raw data storage (databases, data warehouses, data lakes) and data consumers (analysts, dashboards, AI systems). It translates technical data representations into business-meaningful concepts, ensuring that "revenue" means the same thing whether queried from a dashboard, a spreadsheet, or an AI chatbot.

### Core Functions

**Metric definitions**: A semantic layer defines metrics precisely. "Monthly Recurring Revenue" is not just a column — it is a calculation: `SUM(subscription_amount) WHERE subscription_status = 'active' AND billing_period = 'monthly'`, with specific rules about proration, trial periods, and currency conversion.

**Dimension mapping**: It maps raw columns to business dimensions. The column `cust_seg_cd` becomes "Customer Segment" with values like "Enterprise," "Mid-Market," and "SMB" instead of cryptic codes like "E," "M," "S."

**Access control**: Semantic layers enforce row-level and column-level security. A regional manager sees only their region's data. A financial analyst sees revenue but not individual salaries.

**Query translation**: When a user asks "What was our revenue last quarter?", the semantic layer translates this into the correct SQL query against the correct tables with the correct joins, filters, and aggregations.

### Semantic Layer Platforms

| Platform | Approach | Strengths | Integration |
|----------|----------|-----------|-------------|
| dbt Semantic Layer | Metrics-as-code in YAML | Version-controlled, CI/CD friendly | dbt Cloud, Tableau, Hex |
| Cube.js | API-first semantic layer | Multi-tenant, caching, pre-aggregation | Any BI tool via REST/GraphQL |
| AtScale | Virtual semantic layer | No data movement, universal BI connectivity | Power BI, Tableau, Excel |
| LookML (Looker) | Proprietary modeling language | Tight Looker integration | Looker/Google Cloud |
| MetricFlow | Open-source metric definitions | dbt-native, flexible | dbt ecosystem |

### Example: dbt Semantic Layer

```yaml
# dbt semantic layer metric definition
semantic_models:
  - name: orders
    defaults:
      agg_time_dimension: order_date
    entities:
      - name: order_id
        type: primary
      - name: customer_id
        type: foreign
    dimensions:
      - name: order_date
        type: time
      - name: order_status
        type: categorical
    measures:
      - name: order_total
        agg: sum
        expr: amount

metrics:
  - name: revenue
    description: "Total revenue from completed orders"
    type: simple
    type_params:
      measure: order_total
    filter: |
      {{ Dimension('order_status') }} = 'completed'

  - name: average_order_value
    description: "Average value of completed orders"
    type: derived
    type_params:
      expr: revenue / order_count
```

## What is an Ontology (in the Data Context)?

### Definition

An ontology is a formal representation of knowledge about a domain — what types of entities exist, what properties they have, how they relate to each other, and what constraints govern them. In the data context, an ontology defines the conceptual model of the business domain independent of any particular data store.

### Core Functions

**Concept definition**: An ontology defines what a "Customer" is — not as a database table, but as a concept with properties (name, contact info, account status), relationships (places Orders, belongs to Segment, assigned to Representative), and constraints (must have at least one contact method).

**Relationship typing**: Beyond simple foreign keys, ontologies define the semantics of relationships. "Reports to" is different from "collaborates with" — both link Person to Person, but they carry different meaning and different reasoning implications.

**Inference and reasoning**: Given explicit facts, an ontology enables deriving implicit facts. If the ontology defines that "Enterprise Customers are Customers with annual revenue > $10M" and a customer's revenue is $15M, the system automatically classifies them as Enterprise without explicit labeling.

**Cross-domain integration**: Ontologies enable connecting concepts across domains. A "Customer" in the sales domain is the same entity as a "Client" in the legal domain and an "Account" in the finance domain. The ontology makes these mappings explicit.

### Ontology Languages and Tools

| Tool/Standard | Type | Strengths | Use Case |
|---------------|------|-----------|----------|
| OWL (Web Ontology Language) | W3C Standard | Formal reasoning, interoperability | Academic, healthcare, government |
| RDF/RDFS | W3C Standard | Flexible graph model, linked data | Knowledge graphs, semantic web |
| SKOS | W3C Standard | Simple concept schemes | Controlled vocabularies, taxonomies |
| Protege | Editor | Visual modeling, reasoning plugins | Ontology development |
| TopBraid | Platform | Enterprise governance, SHACL validation | Enterprise data integration |

### Example: OWL Ontology Fragment

```turtle
@prefix bus: <http://example.org/business#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

bus:Customer a owl:Class ;
    rdfs:subClassOf bus:BusinessEntity .

bus:EnterpriseCustomer a owl:Class ;
    rdfs:subClassOf bus:Customer ;
    owl:equivalentClass [
        a owl:Class ;
        owl:intersectionOf (
            bus:Customer
            [ a owl:Restriction ;
              owl:onProperty bus:annualRevenue ;
              owl:someValuesFrom [
                  a rdfs:Datatype ;
                  owl:onDatatype xsd:decimal ;
                  owl:withRestrictions ([ xsd:minExclusive "10000000"^^xsd:decimal ])
              ]
            ]
        )
    ] .

bus:placesOrder a owl:ObjectProperty ;
    rdfs:domain bus:Customer ;
    rdfs:range bus:Order .
```

## How They Overlap

Despite different origins, semantic layers and ontologies share surprising common ground:

**Vocabulary standardization**: Both define canonical names for business concepts, preventing the chaos of ad-hoc naming.

**Abstraction from physical storage**: Both decouple business meaning from data storage details. Neither cares whether data lives in PostgreSQL, Snowflake, or MongoDB.

**Relationship definition**: Both define how concepts relate, though ontologies do so more formally.

**Reusability**: Both aim to be defined once and used everywhere — by multiple consumers, tools, and applications.

**Governance**: Both support governance by making definitions explicit, versionable, and auditable.

## How They Differ

| Dimension | Semantic Layer | Ontology |
|-----------|---------------|----------|
| **Primary purpose** | Compute correct metrics | Represent domain knowledge |
| **Core artifact** | Metric definitions, dimensions | Classes, properties, axioms |
| **Output** | SQL queries, aggregated results | Inferred facts, classifications |
| **Formality** | Semi-formal (YAML, DSL) | Formal logic (OWL, RDF) |
| **Reasoning** | Calculation (SUM, AVG, COUNT) | Logical inference (subsumption, entailment) |
| **Users** | BI analysts, data teams | Knowledge engineers, AI systems |
| **Change frequency** | Quarterly (metrics evolve with business) | Rarely (domain structure is stable) |
| **Tools** | dbt, Cube.js, Looker, AtScale | Protege, TopBraid, OWL reasoners |
| **Data orientation** | Quantitative (numbers, aggregates) | Qualitative (types, relationships, constraints) |
| **Query language** | SQL | SPARQL |

## When an AI Analyst Needs Which

### Use a Semantic Layer When...

The AI analyst needs to answer quantitative questions:

- "What was our revenue last quarter?" — requires a precise metric definition
- "Which region has the highest churn rate?" — requires a calculated metric with dimension filtering
- "Compare year-over-year growth by product line" — requires time-series metric computation
- "What is our customer acquisition cost?" — requires a derived metric from multiple data sources

The semantic layer ensures the AI analyst computes the right number, with the right filters, from the right tables.

### Use an Ontology When...

The AI analyst needs to reason about domain concepts:

- "What factors contribute to customer churn?" — requires understanding the relationships between Customer, Usage, Support Tickets, and Contract Terms
- "Are these two data sources describing the same entity?" — requires ontological alignment
- "What happens if we reclassify mid-market customers?" — requires understanding the classification hierarchy and its implications
- "Which policies apply to this type of transaction?" — requires traversing a policy ontology

The ontology ensures the AI analyst understands the domain structure, not just the numbers.

### Use Both When...

Most sophisticated AI analysts need both. Consider the question: "Why is enterprise churn increasing in APAC?" Answering this requires:

1. **Semantic layer**: Compute "enterprise churn rate" (precise metric) filtered by "APAC" (dimension) over time (time series)
2. **Ontology**: Understand that "Enterprise" is a customer segment defined by revenue threshold, that "churn" involves contract non-renewal and can be influenced by support quality, product fit, and competitive pressure, and that "APAC" encompasses specific countries with their own market dynamics

## Modern Convergence

The boundary between semantic layers and ontologies is blurring as both traditions learn from each other:

### Semantic Layers Adopting Ontological Concepts

Modern semantic layers increasingly incorporate ontological features:
- **Entity relationships**: dbt's semantic layer now defines entities and relationships, not just metrics
- **Type hierarchies**: Cube.js supports dimension hierarchies that resemble class hierarchies
- **Constraints**: MetricFlow enforces metric validity constraints that function like ontological axioms
- **Concept linking**: AtScale maps business concepts across data sources, functioning as a lightweight ontology

### Ontologies Adopting Metric Capabilities

Ontology platforms are adding quantitative capabilities:
- **SHACL** (Shapes Constraint Language) can define data shapes that include aggregation rules
- **Knowledge graph analytics** combine graph traversal with numerical computation
- **Ontology-driven dashboards** use ontological structure to auto-generate metric visualizations

### The Emerging "Knowledge Layer"

Some organizations are building a unified "knowledge layer" that combines:
- Metric definitions (from the semantic layer tradition)
- Concept definitions (from the ontology tradition)
- Relationship definitions (shared)
- Access control (shared)
- Lineage and provenance (shared)

This convergence is driven by AI analysts that need both types of knowledge to answer real-world questions effectively.

## Implementation Strategy for AI Analysts

### Phase 1: Semantic Layer First

For most organizations, start with a semantic layer:
1. Define core metrics (revenue, costs, utilization, satisfaction)
2. Map dimensions (time, geography, product, customer segment)
3. Implement access controls
4. Connect to the AI analyst via API

This delivers immediate value — the AI analyst can answer quantitative questions accurately.

### Phase 2: Lightweight Ontology

Add domain concepts as needed:
1. Define key entity types and their properties
2. Map relationships between entities
3. Create a concept hierarchy (taxonomy) for key dimensions
4. Store as structured metadata alongside the semantic layer

This enables the AI analyst to understand the domain, not just compute numbers.

### Phase 3: Integration

Connect the semantic layer and ontology:
1. Link metric definitions to ontological concepts
2. Use ontological relationships to guide metric exploration
3. Enable the AI analyst to traverse from concept-level questions to metric-level answers
4. Validate metric results against ontological constraints

## Comparison Table: Side-by-Side Decision Guide

| Question | Semantic Layer Answer | Ontology Answer |
|----------|----------------------|-----------------|
| "What is revenue?" | `SUM(amount) WHERE status='completed'` | Revenue is a FinancialMetric, subclass of BusinessMeasure, measured in Currency |
| "How are customers classified?" | `CASE WHEN revenue > 10M THEN 'Enterprise' ...` | Customer is-a BusinessEntity; EnterpriseCustomer is-a Customer with annualRevenue > 10M |
| "What data feeds into churn rate?" | Join customer_table, subscription_table, apply formula | Churn is-a BusinessEvent, caused-by ContractNonRenewal, influenced-by SupportQuality |
| "Can this user see APAC data?" | Row-level filter: `WHERE region = 'APAC'` | User has-role RegionalManager, role applies-to Region, APAC is-a Region |

## Conclusion

For AI analysts, the semantic layer and ontology are not competing approaches — they are complementary layers of meaning. The semantic layer ensures quantitative accuracy: when the AI says "revenue was $2.3M," that number is correct. The ontology ensures conceptual accuracy: when the AI says "this customer is at risk of churning because of declining product usage and unresolved support tickets," it understands the causal relationships between those concepts. The most effective AI analysts combine both, using the semantic layer for computation and the ontology for reasoning. As both traditions converge toward a unified knowledge layer, the distinction will blur — but the dual requirement for accurate numbers and accurate concepts will remain.

## Media

1. ![Semantic Web technology stack](https://upload.wikimedia.org/wikipedia/commons/f/f7/Semantic_web_stack.svg) — The layered architecture from data to ontological reasoning
2. ![Data warehouse architecture diagram](https://upload.wikimedia.org/wikipedia/commons/8/8b/Data_warehouse_overview.JPG) — Data warehouse architecture where semantic layers typically operate
3. ![Ontology class hierarchy](https://upload.wikimedia.org/wikipedia/commons/2/21/Semantic_Net.svg) — Semantic network showing typed relationships between domain concepts
4. ![Business intelligence dashboard concept](https://upload.wikimedia.org/wikipedia/commons/4/49/OLAP_drill_up%26down.png) — OLAP drill operations showing dimension hierarchies that semantic layers define
5. ![RDF triple structure](https://upload.wikimedia.org/wikipedia/commons/1/12/RDF_example.svg) — RDF triple showing how ontologies represent facts as subject-predicate-object

## Videos

1. https://www.youtube.com/watch?v=bMe9gDMfVMI — "What is a Semantic Layer?" by Cube explaining the abstraction between data and consumers
2. https://www.youtube.com/watch?v=hJOmAY2Adbc — "What is an Ontology?" by Barry Smith on formal knowledge representation in AI

## References

1. dbt Semantic Layer Documentation — https://docs.getdbt.com/docs/build/about-metricflow
2. W3C OWL 2 Web Ontology Language Overview — https://www.w3.org/TR/owl2-overview/
3. Cube.js Documentation: Semantic Layer — https://cube.dev/docs/product/introduction
4. Gruber, T. R. (1993). "A Translation Approach to Portable Ontology Specifications." *Knowledge Acquisition*, 5(2). https://tomgruber.org/writing/ontolingua-kaj-1993.pdf
