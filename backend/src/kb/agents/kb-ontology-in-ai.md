# What is Ontology in AI?

## Introduction

The word "ontology" has traveled a remarkable journey — from ancient Greek philosophy to the cutting edge of artificial intelligence. In philosophy, ontology is the study of being: what exists, what categories of existence there are, and how entities relate to one another. In computer science and AI, ontology has been repurposed into something more precise and practical: a formal, explicit specification of a shared conceptualization. This computational ontology defines the vocabulary, relationships, and constraints that allow machines to reason about a domain with the same rigor that a domain expert brings to their work. Without ontologies, AI systems are left to infer structure from unstructured data — a process that is powerful but prone to hallucination, inconsistency, and opacity. With ontologies, AI systems gain a structured scaffold for knowledge that makes reasoning transparent, shareable, and verifiable.

## Philosophical Roots: From Aristotle to Computation

### Aristotle's Categories

Aristotle's *Categories* (circa 350 BCE) was the first systematic attempt to classify everything that exists. He proposed ten categories — substance, quantity, quality, relation, place, time, position, state, action, and passion — as the fundamental ways of describing reality. This framework endured for two millennia and directly influenced how computer scientists later approached knowledge representation.

### The Bridge to Computer Science

The philosophical tradition asked "What exists?" The computational tradition asks "What exists *in our model*?" Tom Gruber's 1993 definition — "An ontology is an explicit specification of a conceptualization" — marks the pivotal moment when the philosophical concept became an engineering tool. Nicola Guarino and colleagues refined this further: an ontology is a formal, explicit specification of a *shared* conceptualization, emphasizing that ontologies must be machine-processable (formal), clearly documented (explicit), and agreed upon by a community (shared).

This shift from philosophy to engineering was not a dilution — it was an operationalization. Philosophical ontology asks what kinds of things exist; computational ontology encodes those answers in a form that software can use.

## Core Components of Computational Ontology

### Classes (Concepts)

Classes represent categories of things. In a medical ontology, `Disease`, `Symptom`, `Treatment`, and `Patient` are classes. Classes are organized hierarchically: `CardiovascularDisease` is a subclass of `Disease`, which is a subclass of `MedicalCondition`. This hierarchy enables inheritance — properties defined on `Disease` (such as `hasSymptom`) automatically apply to all subclasses.

### Properties (Relations)

Properties define relationships between classes or between classes and data values. Object properties connect two classes: `treatedBy` links `Disease` to `Treatment`. Data properties connect a class to a literal value: `hasOnsetAge` links `Disease` to an integer. Properties can have domains (what class the property applies to) and ranges (what class or datatype the property's value must be).

### Individuals (Instances)

Individuals are specific members of classes. If `Dog` is a class, then "Fido" is an individual. In practice, ontologies often define the schema (classes and properties) while instance data lives in a knowledge graph or database that uses the ontology as its schema.

### Axioms and Constraints

Axioms are logical statements that constrain the ontology. Cardinality restrictions specify that a `Person` must have exactly one `birthDate`. Disjointness axioms declare that `Male` and `Female` cannot overlap. Existential restrictions require that every `Prescription` must have at least one `prescribedMedication`. These axioms enable automated reasoning — a reasoner can detect logical inconsistencies, infer implicit relationships, and classify individuals automatically.

## OWL: The Web Ontology Language

### What OWL Provides

OWL (Web Ontology Language), standardized by the W3C, is the dominant language for defining ontologies in AI and the Semantic Web. OWL extends RDF Schema (RDFS) with the full power of description logic, enabling complex class definitions, property restrictions, and automated reasoning.

OWL comes in three profiles of increasing expressiveness:

| Profile | Description | Reasoning Complexity | Use Case |
|---------|-------------|---------------------|----------|
| OWL 2 EL | Existential quantification only | Polynomial time | Large biomedical ontologies (SNOMED CT) |
| OWL 2 QL | Optimized for query answering | LogSpace for queries | Database-backed ontologies |
| OWL 2 RL | Rule-based reasoning | Polynomial time | Business rules, RDF stores |
| OWL 2 DL | Full description logic | Decidable but worst-case exponential | Research, complex domain modeling |

### OWL in Practice

An OWL ontology defining a simple trade business domain might look like this in Turtle syntax:

```turtle
@prefix : <http://atlasux.com/ontology/trades#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:TradesBusiness a owl:Class ;
    rdfs:subClassOf :SmallBusiness .

:Plumber a owl:Class ;
    rdfs:subClassOf :TradesBusiness .

:Appointment a owl:Class ;
    rdfs:subClassOf [
        a owl:Restriction ;
        owl:onProperty :hasCustomer ;
        owl:cardinality "1"^^xsd:nonNegativeInteger
    ] .

:hasCustomer a owl:ObjectProperty ;
    rdfs:domain :Appointment ;
    rdfs:range :Customer .

:hasScheduledTime a owl:DatatypeProperty ;
    rdfs:domain :Appointment ;
    rdfs:range xsd:dateTime .
```

This defines a class hierarchy (Plumber is a TradesBusiness is a SmallBusiness), a constrained class (every Appointment has exactly one Customer), and typed properties.

## RDF and RDFS: The Foundation

### Resource Description Framework

RDF provides the data model that underlies OWL. Everything in RDF is expressed as triples: subject-predicate-object. Each element is identified by a URI, making it globally unique and linkable. RDF supports multiple serialization formats — Turtle (human-readable), JSON-LD (web-friendly), N-Triples (simple line-based), and RDF/XML (verbose but standard).

### RDF Schema

RDFS extends RDF with basic vocabulary for defining classes and properties: `rdfs:Class`, `rdfs:subClassOf`, `rdfs:domain`, `rdfs:range`, `rdfs:label`, `rdfs:comment`. RDFS is sufficient for simple taxonomies but lacks the expressiveness needed for complex constraints — that is where OWL steps in.

The relationship between these layers:

```
┌─────────────────────────────┐
│         OWL 2 DL            │  ← Complex axioms, reasoning
├─────────────────────────────┤
│         RDFS                │  ← Classes, subclasses, properties
├─────────────────────────────┤
│         RDF                 │  ← Triples: subject-predicate-object
├─────────────────────────────┤
│         URIs + Literals     │  ← Identifiers and values
└─────────────────────────────┘
```

## Famous Ontologies

### SUMO (Suggested Upper Merged Ontology)

SUMO is the largest formal public ontology, with over 20,000 terms and 80,000 axioms. It provides an upper ontology (abstract categories like `Entity`, `Physical`, `Abstract`, `Process`) that domain-specific ontologies can extend. SUMO has been mapped to the entire WordNet lexical database, creating a bridge between natural language and formal knowledge.

### Cyc

The Cyc project, started by Doug Lenat in 1984, is one of the most ambitious AI projects ever attempted: encoding all of common-sense knowledge in formal logic. After four decades, Cyc contains millions of assertions in its proprietary CycL language. While Cyc has not achieved its original vision of general AI, it has found commercial applications in data integration, natural language understanding, and compliance reasoning.

### Schema.org

Created by Google, Microsoft, Yahoo, and Yandex in 2011, Schema.org is a pragmatic ontology for marking up web content. It defines types like `LocalBusiness`, `Event`, `Person`, `Product`, and `Review` with associated properties. Schema.org is not formally axiomatized like OWL ontologies — it prioritizes adoption over rigor — but it represents the most widely deployed ontology on the web, used by millions of websites.

### SNOMED CT

The Systematized Nomenclature of Medicine — Clinical Terms contains over 350,000 concepts with formal logic definitions, organized by relationships like `is-a`, `finding-site`, `causative-agent`, and `associated-morphology`. SNOMED CT is mandated for use in electronic health records in many countries and is arguably the most successful domain-specific ontology in production use.

## Ontology vs Taxonomy vs Folksonomy

Understanding the distinctions between these three knowledge organization systems is essential:

| Feature | Ontology | Taxonomy | Folksonomy |
|---------|----------|----------|------------|
| Structure | Rich graph with typed relations | Strict hierarchy (tree) | Flat tags |
| Formality | Formal logic, machine-reasoned | Semi-formal | Informal, user-generated |
| Relations | Many types (part-of, causes, etc.) | Is-a (parent-child) only | None (co-occurrence) |
| Constraints | Axioms, cardinality, disjointness | None beyond hierarchy | None |
| Creation | Domain experts + ontologists | Domain experts | Users/community |
| Reasoning | Automated inference possible | Classification only | Statistical patterns |
| Example | SNOMED CT, OWL ontologies | Linnaean taxonomy, Dewey Decimal | Twitter hashtags, del.icio.us tags |

A **taxonomy** is a tree: every node has exactly one parent. The Linnaean biological classification (Kingdom → Phylum → Class → Order → Family → Genus → Species) is the canonical example. Taxonomies are simple, intuitive, and well-suited for browsing and classification.

A **folksonomy** emerges from bottom-up tagging by users. There is no hierarchy, no formal definitions, no consistency enforcement. The same concept might be tagged "machine-learning," "ML," "machine_learning," or "ai/ml." Folksonomies are easy to create but hard to search and impossible to reason over.

An **ontology** subsumes both: it can express hierarchies (like a taxonomy) and informal tags (as annotations), but adds typed relationships, formal constraints, and reasoning capabilities that neither taxonomies nor folksonomies support.

## Why AI Systems Need Formal Knowledge Representation

### The Hallucination Problem

Large language models generate fluent text but have no internal mechanism for verifying factual accuracy. An ontology provides a ground truth that LLM outputs can be validated against. If the ontology says "Aspirin treats Headache" and the LLM says "Aspirin causes Headache," the contradiction is mechanically detectable.

### Consistency and Reasoning

Ontologies enable automated consistency checking. If a knowledge base contains contradictory facts (a person born in 1990 and also born in 1985), an OWL reasoner will flag the inconsistency. This is critical for domains like medicine, law, and finance where inconsistent knowledge can have serious consequences.

### Interoperability

When multiple AI systems need to share knowledge, ontologies provide a common vocabulary. Two healthcare systems that both use SNOMED CT can exchange patient data without ambiguity about what "Type 2 Diabetes Mellitus" means — it is concept ID 44054006, with a precise formal definition.

### Explainability

Ontology-based reasoning is inherently explainable. When a system infers that a patient is at high risk for cardiovascular disease, it can trace the reasoning chain: the patient has hypertension (subclass of CardiovascularRiskFactor), is over 60 (satisfies AgeRiskThreshold), and has a family history (satisfies GeneticRiskFactor). Each step is grounded in explicit axioms.

## Ontology Development Tools

### Protégé

Developed at Stanford, Protégé is the most widely used open-source ontology editor. It provides a graphical interface for creating OWL ontologies, with plugins for visualization (OntoGraf, OWLViz), reasoning (HermiT, Pellet, FaCT++), and import/export in multiple formats. Protégé has been used to develop many major ontologies, including the Gene Ontology and the National Cancer Institute Thesaurus.

### TopBraid Composer

A commercial ontology development environment by TopQuadrant, TopBraid provides enterprise-grade features: multi-user collaboration, SHACL-based data validation, integration with SPARQL endpoints, and a visual modeling interface. It is widely used in government and large enterprise settings.

### OntoGraf and Visualization

Understanding complex ontologies requires visualization. OntoGraf (a Protégé plugin) renders class hierarchies and property relationships as interactive graphs. WebVOWL provides browser-based ontology visualization using the Visual Notation for OWL Ontologies. These tools are essential for communicating ontology structure to non-technical stakeholders.

### Automated Ontology Learning

Recent advances in NLP have enabled semi-automated ontology construction from text corpora. Tools like Text2Onto, OntoLearn, and LLM-based approaches can extract candidate classes, relationships, and taxonomic structures from unstructured documents. While automated approaches still require expert review, they dramatically reduce the manual effort of ontology construction.

## Ontologies in Modern AI Pipelines

The resurgence of interest in ontologies within the AI community is driven by their ability to complement statistical and neural approaches:

- **RAG systems** use ontologies to guide retrieval, ensuring that queries about "heart attack" also retrieve documents about "myocardial infarction" (through synonym relationships in the ontology)
- **Knowledge graph construction** uses ontologies as the schema, defining what entity types and relationships are valid
- **Data integration** uses ontologies to map between different schemas, resolving semantic heterogeneity
- **Constraint checking** uses ontological axioms to validate AI outputs before they reach users

For platforms like Atlas UX, ontologies can formalize the relationships between business concepts (Tenant → Business → Service → Appointment → Customer), enabling the AI receptionist to reason about domain-specific constraints ("a plumber appointment requires a service type and a time slot") rather than relying solely on pattern matching from training data.

## Conclusion

Ontology in AI is the discipline of making knowledge explicit, formal, and machine-processable. From Aristotle's categories to OWL axioms, the goal has remained constant: to organize what we know about the world into structures that support reliable reasoning. In an era dominated by statistical AI, ontologies provide the complementary rigor that prevents hallucination, enables interoperability, and makes AI reasoning transparent and auditable. The tools are mature (Protégé, TopBraid), the standards are stable (OWL 2, RDF, SPARQL), and the applications are growing as organizations recognize that structured knowledge is not a relic of classical AI but a necessary foundation for trustworthy modern AI.

## Media

1. ![Ontology class hierarchy visualization](https://upload.wikimedia.org/wikipedia/commons/2/21/Semantic_Net.svg) — Semantic network showing concept relationships, the visual foundation of ontological structure
2. ![RDF triple diagram](https://upload.wikimedia.org/wikipedia/commons/1/12/RDF_example.svg) — RDF triple showing subject-predicate-object structure
3. ![Protégé ontology editor](https://upload.wikimedia.org/wikipedia/commons/8/8a/Prot%C3%A9g%C3%A9_5_screenshot.png) — Protégé 5 desktop interface for OWL ontology editing
4. ![OWL Web Ontology Language logo](https://upload.wikimedia.org/wikipedia/commons/2/2a/Web_Ontology_Language_%28OWL%29_diagram.png) — OWL ontology layered architecture diagram
5. ![Semantic Web technology stack](https://upload.wikimedia.org/wikipedia/commons/f/f7/Semantic_web_stack.svg) — The Semantic Web stack showing RDF, RDFS, OWL, and SPARQL layers

## Videos

1. https://www.youtube.com/watch?v=hJOmAY2Adbc — "What is an Ontology?" by Barry Smith, explaining philosophical and computational ontology
2. https://www.youtube.com/watch?v=cm4IO7PgScc — "Ontology Engineering" tutorial by the University of Manchester, covering OWL and Protégé

## References

1. Gruber, T. R. (1993). "A Translation Approach to Portable Ontology Specifications." *Knowledge Acquisition*, 5(2), 199-220. https://tomgruber.org/writing/ontolingua-kaj-1993.pdf
2. W3C OWL 2 Web Ontology Language Overview. https://www.w3.org/TR/owl2-overview/
3. Noy, N. F. & McGuinness, D. L. "Ontology Development 101: A Guide to Creating Your First Ontology." Stanford Knowledge Systems Laboratory. https://protege.stanford.edu/publications/ontology_development/ontology101.pdf
4. Guarino, N., Oberle, D., & Staab, S. (2009). "What Is an Ontology?" In *Handbook on Ontologies*, Springer. https://link.springer.com/chapter/10.1007/978-3-540-92673-3_0
