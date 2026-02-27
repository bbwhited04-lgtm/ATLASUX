# Instructional Design Models

## Purpose

This document equips AI agents with mastery of instructional design (ID) — the systematic process of creating learning experiences that are effective, efficient, and engaging. Instructional design is the engineering discipline of education: it translates learning theory into practical blueprints for instruction. Atlas UX agents must understand these models to structure help responses, design onboarding sequences, create tutorials, and architect knowledge delivery systems that produce measurable learning outcomes.

---

## 1. ADDIE Model

### Overview

ADDIE is the foundational instructional design framework, developed in the 1970s at Florida State University for the U.S. military. It is a linear, phase-gated process that remains the dominant model in corporate training and higher education.

### The Five Phases

**Analysis** — Determine the gap between current and desired performance. Conduct needs analysis (organizational, task, learner). Define the target audience, their prior knowledge, constraints, and the learning environment. Identify performance objectives and success criteria. This phase answers: *What problem are we solving? Who are the learners? What do they need to be able to do?*

Key analysis activities: learner analysis (demographics, prior knowledge, motivation, learning preferences), context analysis (where and how learning will occur), task analysis (decomposing the target performance into component skills and knowledge), and gap analysis (discrepancy between current and desired state).

**Design** — Create the instructional blueprint. Write learning objectives (using Bloom's taxonomy or the ABCD method). Sequence content logically. Select instructional strategies, media, and assessment methods. Design the evaluation strategy. Create storyboards, prototypes, and design documents. This phase answers: *How will we structure the learning experience?*

Key design outputs: learning objectives, content outline, assessment strategy, sequencing plan, prototype/storyboard, style guide.

**Development** — Build the instructional materials. Author content, produce media, code interactive elements, develop assessments. Conduct internal review and quality assurance. Pilot test with a small sample of the target audience. This phase answers: *What exactly will learners see, hear, and do?*

**Implementation** — Deploy the instruction. Train facilitators (if applicable). Roll out to learners. Manage logistics, technology, and support. Monitor delivery for issues. This phase answers: *How do we get this to learners?*

**Evaluation** — Measure effectiveness. Formative evaluation occurs throughout all phases (iterative improvement). Summative evaluation occurs after implementation to determine whether objectives were met. Use Kirkpatrick's levels (reaction, learning, behavior, results) and collect data for continuous improvement. This phase answers: *Did it work? How do we improve?*

### Strengths and Limitations

ADDIE is comprehensive, systematic, and well-documented. Its weakness is linearity — in practice, instructional design is iterative. Large ADDIE projects can take months, and the sequential phase-gate structure can delay needed revisions. This limitation led to the development of more agile alternatives.

---

## 2. SAM (Successive Approximation Model)

### Overview

Michael Allen (2012) developed SAM as an agile alternative to ADDIE. SAM replaces ADDIE's linear phases with iterative cycles of design-develop-evaluate, producing rapid prototypes that are refined through successive approximations.

### SAM1 (Small Projects)

Three iterative phases: (1) **Evaluate** — review the current prototype, (2) **Design** — sketch improvements, (3) **Develop** — build the next iteration. Repeat until the product meets quality criteria. Suitable for small teams and short timelines.

### SAM2 (Large Projects)

Three main phases, each containing iterative cycles:

1. **Preparation Phase**: Savvy Start — a collaborative kickoff workshop where stakeholders, subject matter experts, and designers rapidly brainstorm, prototype, and evaluate initial design concepts. Produces a "backgrounding" document and initial prototypes.
2. **Iterative Design Phase**: Repeated cycles of design-prototype-review. Each cycle produces increasingly refined design documents and functional prototypes. Stakeholder feedback is integrated at every iteration.
3. **Iterative Development Phase**: Repeated cycles of develop-implement-evaluate. Produces alpha, beta, and gold versions of the final product.

### Comparison with ADDIE

| Dimension | ADDIE | SAM |
|-----------|-------|-----|
| Structure | Linear, phase-gated | Iterative, cyclical |
| Prototyping | Late (development phase) | Early and continuous |
| Stakeholder input | Primarily at analysis and evaluation | Continuous throughout |
| Time to first deliverable | Long | Short |
| Best for | Large, well-defined projects | Uncertain requirements, rapid timelines |

### Application to Atlas UX

Agents should think in SAM cycles when helping users: provide a quick initial solution (prototype), observe how the user responds (evaluate), refine the guidance (iterate). Do not wait for perfect information before acting — successive approximation converges faster than exhaustive upfront analysis.

---

## 3. Backward Design (Understanding by Design)

### Overview

Grant Wiggins and Jay McTighe (1998, 2005) proposed Backward Design (formalized as "Understanding by Design" or UbD), arguing that instruction should begin with the end in mind. Rather than starting with content or activities, designers start with desired learning outcomes and work backward.

### Three Stages

**Stage 1: Identify Desired Results** — What should learners understand, know, and be able to do? Distinguish between: (a) knowledge worth being familiar with, (b) important knowledge and skills, and (c) enduring understandings (big ideas that have lasting value). Write **essential questions** — open-ended questions that provoke inquiry and point toward enduring understandings.

**Stage 2: Determine Acceptable Evidence** — How will we know learners have achieved the desired results? Design assessments before designing instruction. Use the **GRASPS** framework for authentic performance tasks: Goal, Role, Audience, Situation, Product/Performance, Standards. Include a range of evidence: performance tasks, quizzes, self-assessments, observations.

**Stage 3: Plan Learning Experiences and Instruction** — Only now design activities, lessons, and materials. Use the **WHERETO** framework: Where is the learning going? Hook the learner. Explore and experience. Rethink and revise. Exhibit and evaluate. Tailor to individual needs. Organize for maximum engagement and effectiveness.

### The Twin Sins of Design

Wiggins and McTighe warn against two common failures: (1) **Activity-oriented design** — engaging activities that do not connect to meaningful learning outcomes, and (2) **Coverage-oriented design** — marching through content without ensuring understanding. Both result from designing forward (content first) rather than backward (outcomes first).

### Application to Atlas UX

When designing any instructional sequence (onboarding, tutorial, help documentation), agents must begin with: *What should the user be able to do after this?* Then: *How will we verify they can do it?* Then: *What experiences will get them there?* This prevents the common failure of providing information without ensuring competence.

---

## 4. Bloom's Taxonomy

### Original Taxonomy (1956)

Benjamin Bloom and colleagues created a hierarchical classification of cognitive learning objectives. The original taxonomy (knowledge, comprehension, application, analysis, synthesis, evaluation) was revised by Anderson and Krathwohl (2001) into:

1. **Remember**: Retrieve relevant knowledge from long-term memory. Verbs: define, list, recall, recognize, identify.
2. **Understand**: Construct meaning from instructional messages. Verbs: explain, summarize, paraphrase, classify, compare.
3. **Apply**: Carry out a procedure in a given situation. Verbs: execute, implement, use, demonstrate, solve.
4. **Analyze**: Break material into constituent parts and determine relationships. Verbs: differentiate, organize, attribute, deconstruct.
5. **Evaluate**: Make judgments based on criteria and standards. Verbs: check, critique, judge, justify, assess.
6. **Create**: Put elements together to form a coherent whole; reorganize into a new pattern. Verbs: generate, plan, produce, design, construct.

### The Knowledge Dimension

Anderson and Krathwohl added a second dimension — the type of knowledge:

- **Factual**: Terminology, specific details and elements.
- **Conceptual**: Categories, principles, theories, models, structures.
- **Procedural**: How to do something — methods, techniques, criteria for when to use procedures.
- **Metacognitive**: Knowledge about cognition — self-knowledge, strategic knowledge, contextual knowledge.

### Application to Atlas UX

Agents should calibrate their responses to the appropriate Bloom's level. A new user asking "What is a workflow?" needs a Remember/Understand response. A user asking "Should I use workflow A or B for this situation?" needs an Evaluate response. Agents should progressively move users up the taxonomy — from remembering facts to creating novel solutions.

---

## 5. Gagne's Nine Events of Instruction

Robert Gagne (1965, 1985) identified nine instructional events that align with the cognitive processes required for learning:

1. **Gain attention**: Use a stimulus change — a surprising fact, a question, a relevant problem.
2. **Inform learners of objectives**: Tell them what they will be able to do after instruction.
3. **Stimulate recall of prior learning**: Activate relevant schemas in long-term memory.
4. **Present the content**: Deliver new information, organized to minimize cognitive load.
5. **Provide learning guidance**: Offer examples, analogies, case studies, mnemonics.
6. **Elicit performance**: Have learners practice the new skill or demonstrate new knowledge.
7. **Provide feedback**: Give specific, timely information about the quality of the learner's performance.
8. **Assess performance**: Test to verify that the learning objective has been met.
9. **Enhance retention and transfer**: Provide spaced practice, varied contexts, and connections to real-world application.

### Application to Atlas UX

Every substantial help interaction or tutorial should implicitly follow these nine events. An agent responding to a user's question should: capture attention (acknowledge the problem), state what the user will learn, connect to what they already know, deliver the answer, provide examples, invite them to try it, give feedback on their attempt, verify success, and suggest next steps.

---

## 6. Merrill's First Principles of Instruction

David Merrill (2002) distilled decades of instructional design research into five first principles that are present in all effective instruction, regardless of the specific model used:

1. **Problem-centered**: Learning is promoted when learners engage in solving real-world problems. Instruction should progress through a sequence of increasingly complex problems.
2. **Activation**: Learning is promoted when existing knowledge and experience are activated as a foundation for new knowledge.
3. **Demonstration**: Learning is promoted when new knowledge is demonstrated to the learner (show, don't just tell). Include both examples and non-examples.
4. **Application**: Learning is promoted when learners apply new knowledge and receive corrective feedback. Practice should be consistent with the stated objectives.
5. **Integration**: Learning is promoted when learners integrate new knowledge into their everyday world through reflection, discussion, and defense of new knowledge.

### Application to Atlas UX

Merrill's principles provide a checklist for any agent-generated instructional content: Is it anchored in a real problem? Does it connect to what the user already knows? Does it show, not just tell? Does it provide opportunities to practice? Does it help the user integrate the new skill into their workflow?

---

## 7. Universal Design for Learning (UDL)

### Overview

UDL (CAST, 2011; Rose & Meyer, 2002) is a framework for designing instruction that is accessible to all learners from the outset, rather than retrofitting accommodations. UDL is grounded in neuroscience research on learning variability.

### Three Principles

1. **Multiple Means of Engagement (the "Why" of learning)**: Provide options for recruiting interest, sustaining effort and persistence, and self-regulation. Learners differ in what motivates them.
2. **Multiple Means of Representation (the "What" of learning)**: Provide options for perception, language and symbols, and comprehension. Information should be available in multiple formats.
3. **Multiple Means of Action and Expression (the "How" of learning)**: Provide options for physical action, expression and communication, and executive functions. Learners differ in how they demonstrate knowledge.

### Application to Atlas UX

Agents should offer information in multiple formats when possible (text, visual, step-by-step, conceptual overview). They should provide multiple ways for users to accomplish tasks (GUI, keyboard shortcuts, API, automation). They should support diverse motivations (efficiency for some, understanding for others, compliance for others still).

---

## 8. Synthesis: An Agent's Instructional Design Toolkit

Effective agents should:

1. **Start with outcomes** (Backward Design): What should the user be able to do?
2. **Analyze the learner** (ADDIE Analysis): What do they already know? What is their context?
3. **Structure the interaction** (Gagne's Nine Events): Attention, objectives, prior knowledge, content, guidance, practice, feedback, assessment, transfer.
4. **Apply first principles** (Merrill): Problem-centered, activate, demonstrate, apply, integrate.
5. **Calibrate complexity** (Bloom's): Match the response to the cognitive level required.
6. **Design inclusively** (UDL): Offer multiple pathways and representations.
7. **Iterate rapidly** (SAM): Provide quick solutions, observe, refine.

---

## References

Allen, M. (2012). *Leaving ADDIE for SAM*. ASTD Press. | Anderson, L.W., & Krathwohl, D.R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. Longman. | Bloom, B.S. (1956). *Taxonomy of Educational Objectives*. Longmans, Green. | CAST (2011). *Universal Design for Learning Guidelines version 2.0*. | Gagne, R.M. (1985). *The Conditions of Learning* (4th ed.). Holt, Rinehart & Winston. | Merrill, M.D. (2002). First principles of instruction. *Educational Technology Research and Development*, 50(3), 43-59. | Wiggins, G., & McTighe, J. (2005). *Understanding by Design* (2nd ed.). ASCD.
