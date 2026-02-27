# Curriculum Development

## Purpose

This document provides AI agents with expertise in curriculum development — the systematic process of designing, organizing, and sequencing learning experiences to achieve defined outcomes. While "curriculum" traditionally refers to formal educational programs, the principles apply directly to how Atlas UX structures its onboarding sequences, help documentation architecture, progressive feature exposure, and user learning pathways. Agents that understand curriculum development can create coherent, progressive learning experiences rather than disconnected information fragments.

---

## 1. Curriculum Development Foundations

### Definitions

**Curriculum** has multiple meanings depending on context:

- **Planned curriculum**: The officially intended learning experiences (what we plan to teach)
- **Enacted curriculum**: What actually happens in instruction (what we actually teach)
- **Experienced curriculum**: What learners actually learn (what they take away)
- **Hidden curriculum**: Unintended lessons embedded in the structure, culture, and norms of the learning environment
- **Null curriculum**: What is not taught — its absence sends a message (Eisner, 1985)

The gap between planned, enacted, and experienced curriculum is one of the central challenges of curriculum development. In Atlas UX: the features we document (planned), the guidance agents actually provide (enacted), and what users actually learn (experienced) may all differ.

### Curriculum Development vs. Instructional Design

Curriculum development operates at a higher level of abstraction. Instructional design asks: *How should I teach this lesson?* Curriculum development asks: *What should be taught, in what order, to what depth, and how does it all fit together?* Curriculum development is architecture; instructional design is construction.

---

## 2. Tyler's Rationale

### Overview

Ralph Tyler's *Basic Principles of Curriculum and Instruction* (1949) remains the foundational framework. Tyler posed four questions that every curriculum developer must answer:

### The Four Questions

**1. What educational purposes should the school seek to attain?** (Objectives)

Objectives should be derived from three sources: (a) studies of the learners themselves (their needs, interests, developmental level), (b) studies of contemporary life outside the school (society's needs, demands of the workplace), and (c) suggestions from subject matter specialists (the structure of the discipline).

These raw objectives are then filtered through two screens: (a) the educational philosophy (what values guide our decisions?), and (b) the psychology of learning (what do we know about how people learn?).

**2. What educational experiences can be provided that are likely to attain these purposes?** (Learning experiences)

Tyler defined a learning experience as the interaction between the learner and the external conditions in the environment to which the learner can react. Five principles for selecting experiences: (a) practice the behavior implied by the objective, (b) the experience must be satisfying, (c) the experience must be within the learner's capability, (d) many different experiences can achieve the same objective, (e) the same experience can produce multiple outcomes.

**3. How can these educational experiences be effectively organized?** (Organization)

Three criteria for organizing experiences: **continuity** (recurring emphasis on important elements), **sequence** (each successive experience builds on the preceding one — not mere repetition but deeper/broader treatment), and **integration** (horizontal relationship — experiences in one area should reinforce experiences in other areas).

**4. How can we determine whether these purposes are being attained?** (Evaluation)

Evaluation must be aligned with objectives. It should use multiple measures and assess behavior change over time, not just immediate recall.

### Application to Atlas UX

Tyler's rationale maps directly to platform curriculum design. Objectives: What should users be able to do? (derived from user needs, business demands, and platform capabilities, filtered through our philosophy of user empowerment and our understanding of adult learning). Experiences: What interactions will develop these competencies? Organization: How do we sequence and integrate these interactions? Evaluation: How do we know users achieved competence?

---

## 3. Curriculum Mapping

### Concept

Curriculum mapping (Jacobs, 1997) is the process of creating a visual representation of the curriculum to identify what is taught, when, how, and the connections between components. It reveals gaps, redundancies, and misalignments.

### Types of Curriculum Maps

**Content map**: What topics and concepts are covered at each stage. Reveals gaps (important topics not covered) and redundancies (same topic covered repeatedly without progression).

**Skills map**: What skills are developed at each stage. Shows the progression from foundational to advanced skills.

**Assessment map**: What assessments occur at each stage and what they measure. Ensures alignment between objectives, instruction, and assessment.

**Standards alignment map**: How curriculum components map to external standards or competency frameworks.

### Process

1. Identify all curriculum components (courses, modules, lessons, interactions)
2. Document the content, skills, assessments, and resources for each
3. Align components horizontally (across parallel experiences at the same level) and vertically (across sequential experiences over time)
4. Identify gaps, redundancies, and misalignments
5. Revise and realign

### Application to Atlas UX

Agents should maintain a mental curriculum map of the user's learning journey: Which features have they been exposed to? Which skills have they demonstrated? Where are the gaps? This map informs what the agent should teach next and prevents both redundant instruction (re-teaching what is already known) and premature instruction (teaching advanced concepts before foundations are solid).

---

## 4. Learning Objectives

### The ABCD Method

Well-written learning objectives have four components (Heinich, Molenda, Russell, & Smaldino, 1999):

- **A — Audience**: Who is the learner? "The new Atlas UX user..."
- **B — Behavior**: What observable, measurable action should the learner demonstrate? Use action verbs from Bloom's taxonomy. "...will be able to create a multi-step automated workflow..."
- **C — Condition**: Under what circumstances? "...using the workflow builder interface without assistance..."
- **D — Degree**: To what standard? "...that includes at least three sequential tasks and executes successfully on the first run."

### Mager's Performance Objectives (1962)

Robert Mager emphasized that objectives must describe observable performance, not internal states. "The learner will understand workflows" is unmeasurable. "The learner will configure a three-step workflow that passes validation" is measurable.

### Types of Learning Objectives

**Terminal objectives**: The overall outcome of a unit or program. What the learner can do at the end.

**Enabling objectives**: The sub-skills and knowledge that, taken together, enable the terminal objective. They represent the building blocks.

### Objective Alignment

Every element in the curriculum should align with an objective. Content without an objective is filler. Assessment without an aligned objective is meaningless measurement. Activities without an aligned objective are entertainment.

### Application to Atlas UX

Before creating any instructional content — a help article, a tutorial, an onboarding sequence — agents should define the learning objective. The objective drives the content, the examples, the practice activities, and the success criteria. Without a clear objective, instruction drifts.

---

## 5. Prerequisite Analysis

### Concept

Prerequisite analysis identifies the knowledge and skills learners must possess before they can successfully learn new content. It prevents the common failure of assuming knowledge that learners lack.

### Methods

**Learning hierarchy analysis (Gagne, 1985)**: Decompose the target skill into a hierarchy of prerequisite skills. Each skill in the hierarchy must be mastered before the skills above it can be learned. Work backward from the target: "To do X, the learner must first be able to do Y and Z. To do Y, the learner must first be able to do A and B."

**Procedural analysis**: For procedural skills, identify the sequence of steps and the knowledge/skills required for each step.

**Concept analysis**: For conceptual learning, identify the critical attributes that define the concept, relevant examples and non-examples, and superordinate/subordinate/coordinate concepts.

### Application to Atlas UX

Before teaching a user to create an automated workflow, the agent must verify prerequisites: Does the user understand what a workflow is (conceptual)? Can the user navigate the workflow builder interface (procedural)? Does the user know how to configure individual tasks (sub-skill)? If prerequisites are missing, the agent must teach them first — or the user will fail and attribute the failure to their own inadequacy rather than to instructional sequencing.

---

## 6. Content Sequencing Strategies

### Simple to Complex (Reigeluth, 1999)

Start with the simplest version of the whole task (an "epitome") and progressively add complexity. Reigeluth's Elaboration Theory proposes presenting the simplest, most fundamental ideas first, then elaborating in successive layers of detail.

### Known to Unknown

Begin with what the learner already knows and extend outward. Ausubel (1968): "The most important single factor influencing learning is what the learner already knows. Ascertain this and teach accordingly." Use **advance organizers** — introductory material that bridges existing knowledge and new content.

### Chronological/Procedural

For processes and procedures: present steps in the order they are performed. Natural for workflow instruction: Step 1, Step 2, Step 3.

### Spiral Curriculum (Bruner, 1960)

Key concepts are revisited repeatedly at increasing levels of complexity and sophistication. The learner encounters the same core idea multiple times, each time from a more advanced perspective. Bruner: "Any subject can be taught effectively in some intellectually honest form to any child at any stage of development."

### Whole-Part-Whole

Present the big picture first (whole), then teach the individual components (parts), then reassemble into the whole with deeper understanding. Prevents learners from losing sight of the forest for the trees.

### Problem-Centered Sequencing (Merrill, 2002)

Organize content around a sequence of increasingly complex real-world problems. Each problem requires the application of the concepts and skills being taught. Knowledge is introduced in the context of the problem that requires it.

### Application to Atlas UX

The optimal sequencing strategy depends on the content type: Use **chronological** for step-by-step tutorials. Use **simple to complex** for feature introductions (start with basic use cases, add advanced options). Use **spiral** for conceptual topics that need deepening over time (revisit workflow concepts as the user encounters more complex scenarios). Use **problem-centered** for troubleshooting guides and advanced training.

---

## 7. Curriculum Alignment

### Concept

Curriculum alignment (Webb, 1997; English, 1992) ensures coherence between three elements:

1. **Intended curriculum** (learning objectives)
2. **Taught curriculum** (instructional activities)
3. **Assessed curriculum** (evaluation methods)

When all three are aligned, instruction is coherent and valid. Misalignment produces disconnects: teaching one thing, testing another. Or assessing at a higher Bloom's level than was taught.

### Webb's Depth of Knowledge (DOK)

Norman Webb (1997) created a framework for ensuring that assessment complexity matches instructional complexity:

- **DOK 1 — Recall and Reproduction**: Facts, definitions, simple procedures
- **DOK 2 — Skills and Concepts**: Application of concepts, comparison, organization
- **DOK 3 — Strategic Thinking**: Complex reasoning, planning, justifying, multiple steps
- **DOK 4 — Extended Thinking**: Synthesis, application to novel situations, long-term projects

Alignment requires that the DOK level of assessment matches the DOK level of instruction, which matches the DOK level of the objective.

---

## 8. Modular vs. Linear Design

### Linear Design

Content is organized in a fixed sequence that all learners follow. Strengths: ensures prerequisites are met, easy to manage, consistent experience. Weaknesses: inflexible, does not accommodate learner variability, slower for experienced learners.

### Modular Design

Content is organized in self-contained modules that can be accessed in flexible order. Strengths: learner autonomy, personalization, just-in-time access. Weaknesses: may miss prerequisite dependencies, requires more sophisticated design to ensure coherence.

### Hybrid Approach

A core sequence (linear) with optional modules (modular) that learners can access based on need. This balances structure with flexibility.

### Application to Atlas UX

Atlas UX should use a hybrid approach: a required core onboarding sequence (linear) that covers essential concepts and skills, followed by a modular library of feature-specific, role-specific, and scenario-specific learning experiences that users access as needed. Agents serve as the adaptive routing mechanism — guiding users to the right module at the right time based on their context and competence.

---

## 9. Standards-Based Curriculum Design

### Concept

Standards provide external benchmarks for what learners should know and be able to do. In K-12 education, these are content standards (Common Core, NGSS). In professional training, these are competency frameworks, industry certifications, and professional standards.

### Application to Atlas UX

While Atlas UX does not operate within formal educational standards, the principle applies: define clear competency standards for platform proficiency (e.g., "Proficient User," "Power User," "Administrator"), align curriculum to those standards, and assess against them. This creates a transparent, credible framework for user development.

---

## References

Ausubel, D.P. (1968). *Educational Psychology: A Cognitive View*. Holt, Rinehart & Winston. | Bruner, J.S. (1960). *The Process of Education*. Harvard University Press. | Eisner, E.W. (1985). *The Educational Imagination* (2nd ed.). Macmillan. | English, F.W. (1992). *Deciding What to Teach and Test*. Corwin Press. | Jacobs, H.H. (1997). *Mapping the Big Picture*. ASCD. | Mager, R.F. (1962). *Preparing Instructional Objectives*. Fearon. | Reigeluth, C.M. (1999). *Instructional-Design Theories and Models* (Vol. II). Lawrence Erlbaum. | Tyler, R.W. (1949). *Basic Principles of Curriculum and Instruction*. University of Chicago Press. | Webb, N.L. (1997). *Criteria for Alignment of Expectations and Assessments*. CCSSO.
