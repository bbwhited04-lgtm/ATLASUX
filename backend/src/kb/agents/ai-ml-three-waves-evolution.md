# The Three Waves of AI: From Handcrafted Rules to Contextual Agents

## Introduction

In 2017, DARPA (the Defense Advanced Research Projects Agency) — the same organization whose funding decisions had triggered both AI winters — published a framework that elegantly captured the entire history of artificial intelligence in three waves. This "Three Waves of AI" model, articulated by DARPA's Information Innovation Office director John Launchbury, provides the clearest lens through which to understand where AI has been, where it is now, and where platforms like Atlas UX fit in the trajectory. Each wave represents a fundamentally different approach to creating intelligent systems, with different strengths, limitations, and applications.

## Wave 1: Handcrafted Knowledge

### The Approach

Wave 1 AI systems were built on rules, logic, and hand-encoded knowledge. Human experts analyzed a problem domain, articulated the relevant rules and relationships, and programmers translated that knowledge into executable code. The intelligence of the system was limited to what its designers explicitly put in.

### Key Technologies

The canonical Wave 1 technologies were expert systems — rule-based programs like MYCIN, DENDRAL, and R1/XCON that encoded domain expertise as IF-THEN production rules. Other Wave 1 approaches included:

- **Logic programming** (Prolog) — encoding knowledge as logical predicates and using automated theorem proving to answer queries.
- **Semantic networks and ontologies** — structured representations of concepts and relationships, from Quillian's early networks to modern knowledge graphs like Wikidata and Google's Knowledge Graph.
- **Planning systems** — algorithms like STRIPS and SHRDLU that could generate sequences of actions to achieve goals in well-defined environments.
- **Natural language processing** using hand-written grammars, parse trees, and rule-based transformations.

### Strengths

Wave 1 systems excelled at **reasoning**. Given correct rules and complete information, they could chain together logical steps to reach conclusions, explain their reasoning, and guarantee that their conclusions followed from their premises. This transparency was valuable in high-stakes domains like medical diagnosis and military logistics.

Wave 1 systems also had **no need for training data**. Their knowledge came from human experts, not from datasets. This made them deployable in domains where data was scarce but expertise was available.

### Limitations

The fundamental limitation was the **knowledge acquisition bottleneck**. Extracting expertise from humans, encoding it as rules, and maintaining those rules as knowledge evolved was painstakingly slow and expensive. Expert systems typically contained hundreds to thousands of rules — a tiny fraction of the knowledge that even a novice human brings to a task.

Wave 1 systems were also **brittle**. They worked well within their designed boundaries but failed catastrophically outside them. A medical diagnosis system trained on bacterial infections could not handle viral infections, even if the symptoms overlapped. There was no graceful degradation — only sharp cliffs at the edge of the knowledge base.

Perhaps most critically, Wave 1 systems could not **learn**. Their knowledge was static, updated only when human engineers manually modified the rule base. In a world where knowledge is constantly evolving, this made long-term maintenance unsustainable.

## Wave 2: Statistical Learning

### The Approach

Wave 2 shifted the source of intelligence from human experts to data. Instead of encoding rules, researchers designed learning algorithms that could discover patterns in large datasets. The system's intelligence emerged from the interaction between algorithm and data — not from explicit human knowledge engineering.

### Key Technologies

Wave 2 encompasses the entire machine learning and deep learning revolution:

- **Classical ML:** Decision trees, SVMs, random forests, Bayesian networks, k-NN, ensemble methods.
- **Deep learning:** Convolutional neural networks (CNNs), recurrent neural networks (RNNs), LSTMs, Transformers.
- **Reinforcement learning:** Systems that learned through trial and error, from Q-learning to the deep reinforcement learning that powered AlphaGo.
- **Generative models:** GANs, VAEs, and diffusion models that could generate realistic images, text, and audio.

### Strengths

Wave 2 systems excelled at **perception** — recognizing patterns in sensory data. Image classification, speech recognition, natural language processing, and anomaly detection all became dramatically more capable through statistical learning. Deep learning systems could identify features in data that no human expert would think to encode.

Wave 2 systems also excelled at **scale**. They improved with more data and more compute, following predictable scaling laws. Organizations with more data and more GPUs could build better models — a dynamic that drove the concentration of AI capability in large technology companies.

Most importantly, Wave 2 systems could **learn** and **generalize**. A model trained on millions of images could classify images it had never seen. A language model trained on billions of words could generate coherent text on topics never explicitly in its training data.

### Limitations

Wave 2's primary limitation was **opacity**. Neural networks with millions or billions of parameters were effectively black boxes. They could classify an image as a cat or generate a paragraph of text, but they could not explain why. This lack of interpretability was problematic in domains where accountability and trust were essential — medicine, law, finance, military operations.

Wave 2 systems also struggled with **reasoning**. While large language models could approximate multi-step reasoning through pattern matching on their training data, they were prone to confident errors, hallucinations (generating plausible but false information), and failures on problems that required genuine logical deduction rather than statistical pattern matching.

Another limitation was **data dependency**. Wave 2 systems required enormous quantities of high-quality training data. In domains where such data was scarce (rare diseases, unusual engineering failures, classified military scenarios), Wave 2 approaches were limited.

## Wave 3: Contextual Adaptation

### The Approach

Wave 3 — the wave DARPA identified as the frontier — combines the reasoning capabilities of Wave 1 with the learning capabilities of Wave 2, adding a crucial new dimension: contextual understanding and adaptation. Wave 3 systems can build internal models of the world, reason about new situations, explain their decisions, and adapt their behavior based on context.

### Key Technologies

Wave 3 is still emerging, but its early manifestations include:

- **Large Language Models with reasoning capabilities** — Models like GPT-4, Claude, and Gemini that can engage in multi-step reasoning, consider hypotheticals, and explain their thought processes (even if imperfectly).
- **Retrieval-Augmented Generation (RAG)** — Systems that combine the generation capabilities of LLMs with retrieval from external knowledge bases, grounding responses in verifiable information.
- **AI agents** — Autonomous systems that can plan, use tools, interact with APIs, and take actions in the real world — not just answer questions but accomplish tasks.
- **Neuro-symbolic AI** — Hybrid approaches that combine neural networks for perception and pattern matching with symbolic reasoning for logic, planning, and constraint satisfaction.
- **Multi-modal models** — Systems that integrate text, vision, audio, and other modalities into unified representations, enabling richer contextual understanding.
- **Tool-augmented LLMs** — Models that can write and execute code, search the web, call APIs, and use external tools to extend their capabilities beyond raw text generation.

### Strengths

Wave 3 systems combine perception, learning, reasoning, and action in ways that neither Wave 1 nor Wave 2 could achieve alone. They can:

- Understand natural language with high fidelity (Wave 2 perception).
- Apply logical constraints and business rules (Wave 1 reasoning).
- Adapt to new situations without retraining (contextual adaptation).
- Explain their decisions in natural language (interpretability).
- Take actions in the world through tool use and API integration (agency).

### Current Limitations

Wave 3 remains a work in progress. Current systems still hallucinate, struggle with complex multi-step reasoning, require significant engineering to deploy safely, and lack the robustness that mission-critical applications demand. The gap between impressive demonstrations and reliable deployment — a theme throughout AI history — persists.

## How Atlas UX Represents Wave 3

Atlas UX's agent architecture is a concrete implementation of Wave 3 principles. The platform's design explicitly combines elements from all three waves:

### Wave 1 Elements: Rules and Reasoning
- **SGL (System Governance Language)** policies define explicit rules governing agent behavior — what agents can and cannot do, what requires approval, what is prohibited outright.
- **Decision memo approval workflows** require human authorization for high-risk actions (spending above limits, recurring charges, risk tier 2+ operations).
- **Daily action caps and spending limits** enforce hard constraints that no amount of AI confidence can override.
- **Audit trail with hash chain integrity** provides the traceability and accountability that Wave 1 systems pioneered.

### Wave 2 Elements: Learning and Perception
- **Large language models** (GPT-4, Claude, DeepSeek) power Lucy's conversational abilities — understanding caller intent, generating natural responses, handling the infinite variability of human speech.
- **ElevenLabs voice synthesis** uses deep learning to produce natural-sounding speech.
- **Speech-to-text processing** converts caller audio to text for understanding.

### Wave 3 Elements: Contextual Adaptation and Agency
- **Lucy acts as an autonomous agent** — she does not just answer questions but takes actions: booking appointments, sending SMS confirmations, notifying business owners via Slack.
- **Tool use** — Lucy integrates with external systems (Twilio for SMS, Outlook for calendaring, Slack for notifications) through structured tool calls.
- **Contextual adaptation** — Lucy adapts her behavior based on the business context (trade type, operating hours, available services) without retraining.
- **Multi-agent orchestration** — The Atlas UX platform includes multiple named agents (Atlas, Binky, and others) coordinated through the engine loop, each with distinct roles and capabilities.
- **Knowledge base integration** — RAG-style retrieval from domain-specific knowledge bases grounds Lucy's responses in business-specific information.

### The Safety Architecture as Wave 3 Design

Perhaps most significantly, Atlas UX's safety architecture represents Wave 3 thinking. Pure Wave 2 systems (raw LLM outputs with no guardrails) are too unpredictable for business-critical applications. Pure Wave 1 systems (rigid rule-based responses) are too inflexible to handle the variability of real phone conversations. Atlas UX's hybrid approach — LLM intelligence constrained by symbolic rules, with human oversight for high-risk decisions — is precisely the kind of contextual, adaptive, yet accountable system that DARPA's Wave 3 framework envisions.

## The Road Ahead

Wave 3 is not a destination but a direction. The full vision — AI systems with robust common-sense reasoning, genuine contextual understanding, reliable explanation capabilities, and safe autonomous action — remains years or decades away. But the direction is clear, and every improvement in model reasoning, tool use, and safety architecture moves the field closer.

For Dead App Corp and Atlas UX, the practical implication is a continuous evolution: as Wave 3 capabilities improve, Lucy and her fellow agents will become more capable, more reliable, and more autonomous — always within the guardrails that ensure they serve the business owner rather than surprising them.

## Resources

- https://www.darpa.mil/about/timeline/ai-next — DARPA's AI Next campaign page outlining the Three Waves framework
- https://en.wikipedia.org/wiki/DARPA — DARPA's history and role in funding AI research across all three waves
- https://www.youtube.com/watch?v=-O01G3tSYpU — John Launchbury's original presentation of the Three Waves of AI framework

## Image References

1. "DARPA three waves AI framework diagram handcrafted statistical contextual" — `DARPA three waves AI framework diagram wave 1 2 3`
2. "Wave 1 expert system rule-based knowledge engineering" — `wave 1 AI expert system rule-based knowledge engineering diagram`
3. "Wave 2 deep learning neural network statistical learning" — `wave 2 AI deep learning neural network statistical learning`
4. "Wave 3 contextual AI agent autonomous reasoning" — `wave 3 AI contextual adaptation autonomous agent reasoning`
5. "AI evolution timeline symbolic machine learning deep learning agents" — `AI evolution timeline symbolic machine learning deep learning LLM agents`

## Video References

1. https://www.youtube.com/watch?v=-O01G3tSYpU — "A DARPA Perspective on Artificial Intelligence" — John Launchbury's canonical presentation of the Three Waves of AI
2. https://www.youtube.com/watch?v=TjZBTDzGeGg — "The Future of AI: What Comes After Deep Learning?" — Panel discussion on Wave 3 AI capabilities and challenges
