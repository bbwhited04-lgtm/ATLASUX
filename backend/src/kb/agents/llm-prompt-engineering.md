# Enhancing LLMs with Prompt Engineering

## Overview

Prompt engineering is the discipline of designing, structuring, and optimizing the textual inputs (prompts) given to large language models (LLMs) to elicit accurate, relevant, and useful outputs. As LLMs have become the core reasoning engines behind modern AI applications — from chatbots and code assistants to autonomous agents — prompt engineering has evolved from an ad hoc practice into a structured engineering discipline with its own principles, patterns, and tooling.

This article covers the full landscape of prompt engineering: foundational concepts, advanced techniques, model-specific considerations, and the emerging tooling ecosystem that is automating prompt optimization itself.

![Diagram showing the relationship between prompts, models, and outputs in an LLM pipeline](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Artificial_neural_network.svg/800px-Artificial_neural_network.svg.png)

---

## 1. What Prompt Engineering Is and Why It Matters

### Definition

Prompt engineering is the process of crafting inputs to an LLM that maximize the quality of its outputs for a given task. Unlike traditional software where behavior is determined by explicit code, LLM behavior is shaped by the combination of training data, model weights, and the specific prompt provided at inference time.

### Why It Matters

- **No retraining required:** Prompt engineering lets you change model behavior without fine-tuning, which is expensive and requires labeled data.
- **Rapid iteration:** You can test a new prompt in seconds versus hours or days for model training.
- **Task generalization:** A well-engineered prompt can make a general-purpose model perform like a specialist.
- **Cost optimization:** Better prompts produce correct outputs on the first attempt, reducing token usage and retry loops.
- **Safety and alignment:** Prompts are the primary mechanism for constraining model behavior in production systems.

### The Prompt as an Interface Contract

In a production AI system, the prompt is effectively an API contract between the application developer and the model. It defines:

1. **Context** — What the model knows about the current situation
2. **Task** — What the model should do
3. **Constraints** — Boundaries on acceptable outputs
4. **Format** — The structure of the expected response
5. **Examples** — Demonstrations of correct behavior

![A flowchart illustrating the components of a well-structured prompt](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/800px-Colored_neural_network.svg.png)

---

## 2. Prompt Anatomy: System, User, and Assistant Messages

Modern LLM APIs use a multi-message conversation format with distinct roles. Understanding each role is essential for effective prompt engineering.

### System Prompts

The system prompt (also called the system message or system instruction) sets the model's behavior, persona, and constraints for the entire conversation. It is processed before any user input and has a privileged position in the model's attention.

```
System: You are a senior TypeScript developer who reviews code for
security vulnerabilities. You always cite the relevant OWASP category
when identifying an issue. You respond in structured markdown with
severity ratings (Critical, High, Medium, Low).
```

Key properties of system prompts:
- **Persistent context:** Applied to every turn in the conversation
- **Behavioral anchoring:** Models tend to follow system instructions more reliably than user instructions
- **Not user-visible:** In most UIs, the system prompt is hidden from the end user
- **Model-specific weight:** Different models give different weight to system vs user instructions

### User Prompts

The user message contains the actual request, question, or input data. This is what the human (or calling application) provides.

```
User: Review this Express.js middleware for security issues:

app.get('/user/:id', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  db.query(query, (err, result) => res.json(result));
});
```

### Assistant Prefills

Some APIs (notably Anthropic's Claude) allow you to prefill the beginning of the assistant's response. This is a powerful technique for steering output format and content.

```
Assistant: ## Security Review

### Finding 1: SQL Injection (Critical)
**OWASP Category:** A03:2021 — Injection
```

By starting the assistant's response, you:
- Force a specific output format
- Skip preamble or hedging
- Guide the model into a particular reasoning path
- Prevent the model from refusing the task

---

## 3. Core Prompting Techniques

### 3.1 Zero-Shot Prompting

Zero-shot prompting provides the task description with no examples. The model relies entirely on its training to understand what is being asked.

```
Classify the following customer message as one of: [complaint, question,
compliment, request].

Message: "Your product arrived broken and customer service hasn't
responded in three days."

Classification:
```

**When to use:** Simple, well-defined tasks where the model's training data covers the domain thoroughly.

**Limitations:** May produce inconsistent formatting or misinterpret ambiguous tasks.

### 3.2 Few-Shot Prompting

Few-shot prompting includes one or more input-output examples before the actual task. These examples teach the model the expected behavior by demonstration.

```
Classify the customer message. Respond with only the category.

Message: "I love how fast shipping was!" → compliment
Message: "Can I return an item after 30 days?" → question
Message: "The zipper broke on day one." → complaint
Message: "Please update my shipping address." → request

Message: "Your product arrived broken and customer service hasn't
responded in three days."
→
```

**Best practices for few-shot examples:**
- Use 3-5 examples for most tasks (diminishing returns beyond that)
- Cover edge cases and boundary conditions
- Order examples from simple to complex
- Ensure examples are representative of real inputs
- Include examples of each output category

![Few-shot prompting diagram showing input-output pairs guiding model behavior](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Neural_network_example.svg/600px-Neural_network_example.svg.png)

### 3.3 Chain-of-Thought (CoT) Prompting

Chain-of-thought prompting instructs the model to show its reasoning step by step before arriving at a final answer. This dramatically improves performance on tasks requiring multi-step reasoning: math, logic, code debugging, and complex analysis.

```
Solve this step by step:

A store has 150 items. On Monday, they sell 23% of their inventory.
On Tuesday, they receive a shipment of 40 items. On Wednesday, they
sell 15% of the current inventory. How many items remain?

Think through each day:
```

**Why it works:** The intermediate reasoning tokens serve as "working memory," allowing the model to decompose complex problems into manageable steps. Research from Wei et al. (2022) showed that CoT prompting can improve accuracy on math benchmarks by 20-40 percentage points.

**Variants:**
- **Zero-shot CoT:** Simply append "Let's think step by step" to any prompt
- **Manual CoT:** Provide examples with detailed reasoning traces
- **Auto-CoT:** Let the model generate its own reasoning chains (Zhang et al., 2022)

### 3.4 Tree-of-Thought (ToT) Prompting

Tree-of-thought extends chain-of-thought by exploring multiple reasoning paths simultaneously and evaluating which path is most promising. The model generates several candidate reasoning steps, evaluates them, and selects the best path forward.

```
Consider this problem from three different angles:

Problem: Design a caching strategy for a multi-tenant API with
per-tenant rate limits.

Approach 1 (Performance-focused): ...
Approach 2 (Simplicity-focused): ...
Approach 3 (Cost-focused): ...

Now evaluate each approach against these criteria: latency, memory
usage, implementation complexity, tenant isolation.

Select the best approach and explain why.
```

**When to use:** Complex design decisions, strategic planning, debugging where the root cause is unclear.

### 3.5 Role Prompting and Persona Assignment

Assigning a specific role or persona to the model shapes its vocabulary, reasoning style, and the depth of its responses.

```
You are a database performance engineer with 15 years of experience
optimizing PostgreSQL for high-throughput OLTP workloads. You think
in terms of query plans, index strategies, and connection pooling.
When reviewing queries, you always check EXPLAIN ANALYZE output.
```

**Effective personas include:**
- Domain expertise level (junior vs senior, generalist vs specialist)
- Communication style (terse vs verbose, formal vs casual)
- Analytical framework (security-first, performance-first, user-first)
- Known methodologies (OWASP for security, SOLID for design, etc.)

**Anti-pattern:** Overly complex personas with contradictory traits. Keep the persona focused on the traits that matter for the task.

---

## 4. Structured Output Prompting

Production systems need predictable output formats. Structured output prompting constrains the model's response to a specific schema.

### JSON Output

```
Extract the following fields from the customer email below. Respond
with valid JSON only, no additional text.

Schema:
{
  "customer_name": string,
  "order_id": string | null,
  "issue_category": "shipping" | "product" | "billing" | "other",
  "urgency": "low" | "medium" | "high",
  "summary": string (max 100 chars)
}

Email: """
Hi, I'm John Martinez (order #A-29481). My package was marked
delivered yesterday but I never received it. This is the third
time this has happened. I need this resolved TODAY.
"""
```

### XML Output

XML is useful when the output needs to be parsed by systems that expect hierarchical markup, or when you need to separate distinct output sections cleanly.

```
Respond in XML format:

<analysis>
  <severity>high</severity>
  <category>sql-injection</category>
  <location>line 3, column 15</location>
  <description>User input directly concatenated into SQL query</description>
  <fix>Use parameterized queries with $1 placeholders</fix>
</analysis>
```

### Markdown Output

For human-readable structured output, markdown provides a good balance of structure and readability.

```
Format your response as:

## Summary
[One paragraph overview]

## Findings
| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | ...   | ...      | ...      |

## Recommendations
- [ ] First action item
- [ ] Second action item
```

### Constrained Decoding and Grammar-Based Output

Some inference frameworks (like llama.cpp, Outlines, and vLLM) support grammar-based constrained decoding that guarantees the output conforms to a JSON schema or BNF grammar at the token level. This eliminates parsing failures entirely.

![Structured output flow from prompt to validated JSON response](https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Neural_network_representation.svg/600px-Neural_network_representation.svg.png)

---

## 5. Prompt Chaining and Decomposition

Complex tasks are best handled by breaking them into a sequence of simpler prompts, where the output of one prompt becomes the input to the next.

### Linear Chains

```
Step 1: Extract all entity names from the document
Step 2: For each entity, classify as person/org/location
Step 3: Resolve coreferences (map pronouns to entities)
Step 4: Build a relationship graph between entities
Step 5: Summarize the key relationships
```

### Branching Chains

Some tasks require conditional routing based on intermediate results:

```
Step 1: Classify the incoming request (bug report / feature request / question)
  If bug report → Step 2a: Extract reproduction steps, severity, affected component
  If feature request → Step 2b: Extract use case, priority, technical requirements
  If question → Step 2c: Search knowledge base and generate answer
Step 3: Route to appropriate handler with structured context
```

### Benefits of Decomposition

- **Debuggability:** You can inspect and validate each intermediate step
- **Reusability:** Individual prompts can be reused across different workflows
- **Token efficiency:** Each sub-prompt is focused, reducing context window waste
- **Error isolation:** A failure in step 3 doesn't require re-running steps 1-2
- **Parallelization:** Independent sub-tasks can run concurrently

---

## 6. Self-Consistency and Majority Voting

Self-consistency (Wang et al., 2022) generates multiple independent responses to the same prompt and selects the most common answer. This is particularly effective for reasoning tasks where a single generation might follow an incorrect reasoning path.

### Implementation Pattern

```python
responses = []
for i in range(5):
    response = llm.generate(prompt, temperature=0.7)
    answer = extract_answer(response)
    responses.append(answer)

final_answer = most_common(responses)
confidence = responses.count(final_answer) / len(responses)
```

### When Self-Consistency Helps

- Mathematical reasoning (extracting the final numerical answer)
- Classification tasks (voting across multiple generations)
- Code generation (running tests against each candidate)
- Factual questions where the model might hallucinate different answers

### Cost Considerations

Self-consistency multiplies your inference cost by the number of samples. Use it selectively for high-stakes decisions, not for every API call. A typical configuration uses 5-10 samples with temperature 0.5-0.8.

---

## 7. Prompt Optimization Tools

The field is moving beyond manual prompt engineering toward automated prompt optimization.

### DSPy (Declarative Self-improving Python)

DSPy, developed at Stanford, treats prompts as programs with typed signatures. Instead of writing prompts manually, you define input-output types and let the framework optimize the prompt against a metric.

```python
class SentimentClassifier(dspy.Module):
    def __init__(self):
        self.classify = dspy.ChainOfThought("text -> sentiment")

    def forward(self, text):
        return self.classify(text=text)

# Compile the module (optimizes the prompt automatically)
optimizer = dspy.BootstrapFewShot(metric=accuracy_metric)
compiled = optimizer.compile(SentimentClassifier(), trainset=train_data)
```

DSPy's key insight: prompts are parameters that can be optimized, just like weights in a neural network.

### OPRO (Optimization by PROmpting)

Google DeepMind's OPRO uses an LLM to optimize prompts for another LLM. It maintains a history of prompts and their scores, then asks the optimizer LLM to generate improved prompts based on what has worked.

### Automatic Prompt Engineering (APE)

APE generates candidate prompts, evaluates them on a validation set, and iteratively refines the best candidates. This is useful when you have labeled data but don't know what prompt will work best.

### TextGrad

TextGrad applies gradient-descent-like optimization to text, treating LLM-generated feedback as "gradients" that guide prompt refinement.

### Production Prompt Management

For production systems, prompt management tools provide:
- **Version control** for prompts (track changes over time)
- **A/B testing** (compare prompt variants on live traffic)
- **Evaluation pipelines** (automated scoring against test sets)
- **Prompt registries** (centralized storage with access control)

Tools in this space include LangSmith, Promptfoo, Braintrust, and Humanloop.

---

## 8. Model-Specific Prompting Differences

Different LLM families respond differently to the same prompts. Understanding these differences is crucial for multi-model systems.

### Claude (Anthropic)

- **System prompts are strongly followed.** Claude gives high weight to system instructions and tends to follow them even when user messages attempt to override them.
- **XML tags work exceptionally well.** Claude was specifically trained to parse and produce XML-structured content. Wrapping input sections in `<document>`, `<instructions>`, `<examples>` tags significantly improves reliability.
- **Assistant prefills are supported.** You can start the assistant response to force a specific format.
- **Thinks before answering.** Claude's extended thinking feature (available in Claude 3.5+ and Claude 4 Opus/Sonnet) provides a dedicated reasoning space before the visible response.
- **Responds well to direct, clear instructions.** Claude tends to follow straightforward instructions more reliably than indirect or hinted ones.
- **Handles long contexts well.** Claude supports 200K tokens of context with strong recall throughout the window.

### GPT (OpenAI)

- **JSON mode is built-in.** OpenAI's API has a native `response_format: { type: "json_object" }` parameter that guarantees valid JSON output.
- **Function calling / tool use is mature.** GPT-4 and later models have robust structured tool-calling capabilities.
- **System prompts can be overridden more easily.** GPT models may follow user instructions that contradict the system prompt in some cases.
- **Temperature 0 is deterministic.** Setting temperature to 0 produces highly reproducible outputs (though not guaranteed identical).
- **Structured Outputs** with `response_format: { type: "json_schema", json_schema: {...} }` guarantees schema-conformant JSON.

### Gemini (Google)

- **Multi-modal native.** Gemini handles interleaved text, images, audio, and video in prompts natively.
- **Grounding with Google Search.** Gemini can be configured to ground responses in real-time search results.
- **Safety settings are granular.** You can adjust safety thresholds per category (harassment, hate speech, sexually explicit, dangerous content).
- **System instructions vs context.** Gemini distinguishes between `system_instruction` (behavioral) and content parts (contextual).
- **Long context (up to 2M tokens).** Gemini 1.5 Pro supports extremely long context windows.

### Open Source Models (Llama, Mistral, etc.)

- **Chat templates vary.** Different models use different conversation formatting (ChatML, Llama-style, Mistral-style). Using the wrong template degrades performance significantly.
- **System prompts may be weaker.** Open-source models often follow system prompts less reliably than commercial models.
- **Quantization affects instruction following.** Heavily quantized models (Q4, Q3) may struggle with complex prompting techniques like CoT or structured output.
- **Fine-tuning is accessible.** When prompting alone is insufficient, open-source models can be fine-tuned on task-specific data at low cost.

![Comparison matrix of prompting capabilities across major LLM providers](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Anatomy_of_a_flat_network.svg/800px-Anatomy_of_a_flat_network.svg.png)

---

## 9. Best Practices and Common Pitfalls

### Best Practices

1. **Be specific and unambiguous.** Vague prompts produce vague outputs. State exactly what you want.
2. **Provide context before the task.** Give the model relevant background information before asking it to act.
3. **Use delimiters for input data.** Wrap user-provided content in triple quotes, XML tags, or markdown code blocks to separate it from instructions.
4. **Specify the output format explicitly.** Don't assume the model will choose a useful format.
5. **Test with adversarial inputs.** Your prompt should handle edge cases, empty inputs, and malicious content.
6. **Iterate systematically.** Change one thing at a time and measure the impact.
7. **Document your prompts.** Treat prompts like code — version them, comment them, review them.

### Common Pitfalls

1. **Prompt stuffing:** Cramming too many instructions into a single prompt. Decompose into chains instead.
2. **Assuming model knowledge:** The model's training data has a cutoff. Don't assume it knows about recent events, your internal systems, or your specific codebase.
3. **Ignoring token limits:** Long prompts leave less room for the response. Calculate your token budget.
4. **Over-engineering personas:** Complex, multi-faceted personas confuse the model. Keep personas focused.
5. **Not testing across inputs:** A prompt that works for your test case may fail on real-world inputs. Test with diverse, representative data.
6. **Hardcoding for one model:** Prompts optimized for GPT-4 may not work well with Claude or Gemini. Test across models if you support multiple providers.

---

## 10. Prompt Engineering in Production Systems

### The Atlas UX Approach

In the Atlas UX platform, prompt engineering is central to Lucy's AI receptionist behavior. Key patterns used:

- **System Governance Language (SGL):** A custom DSL that defines agent behavior constraints, approval workflows, and safety guardrails as structured policy documents
- **Persona prompt builder:** Dynamically constructs Lucy's system prompt based on the tenant's business type, services, hours, and preferences
- **Pre-delivery validation:** All agent outputs pass through validation checks before being sent to end users, catching formatting errors, policy violations, and hallucinations
- **Prompt versioning:** Prompts are stored as configuration, not hardcoded, allowing iteration without code deploys

### Monitoring and Evaluation

Production prompt engineering requires ongoing monitoring:

- **Output quality metrics:** Track accuracy, format compliance, and user satisfaction over time
- **Latency tracking:** Complex prompts increase inference time — monitor P50/P95/P99 latencies
- **Cost monitoring:** Track token usage per prompt template to identify optimization opportunities
- **Failure analysis:** Log and categorize prompt failures to guide improvements
- **A/B testing:** Compare prompt variants on live traffic with statistical significance

---

## 11. The Future of Prompt Engineering

The field is evolving rapidly:

- **Agentic workflows** reduce the need for single-prompt perfection by allowing models to use tools, search, and iterate
- **Automatic prompt optimization** (DSPy, OPRO) will make manual prompt crafting less necessary for standard tasks
- **Model improvements** will reduce sensitivity to prompt phrasing, but structured prompting will remain important for complex tasks
- **Prompt-as-code** frameworks will standardize prompt management with CI/CD integration
- **Multi-modal prompting** (text + image + audio) will require new engineering patterns

Prompt engineering will not disappear — it will evolve from artisanal text crafting into a systematic engineering discipline with robust tooling, testing, and optimization pipelines.

---

## Videos

1. [Prompt Engineering Full Course — freeCodeCamp (YouTube)](https://www.youtube.com/watch?v=_ZvnD96BbJI)
2. [ChatGPT Prompt Engineering for Developers — DeepLearning.AI (YouTube)](https://www.youtube.com/watch?v=H4YK_7MAckk)

---

## References

[1] Wei, J., Wang, X., Schuurmans, D., et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *NeurIPS 2022*. https://arxiv.org/abs/2201.11903

[2] Khattab, O., Santhanam, K., Li, X.L., et al. (2023). "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines." *ICLR 2024*. https://arxiv.org/abs/2310.03714

[3] Yang, C., Wang, X., Lu, Y., et al. (2023). "Large Language Models as Optimizers." *Google DeepMind*. https://arxiv.org/abs/2309.03409

[4] Yao, S., Yu, D., Zhao, J., et al. (2023). "Tree of Thoughts: Deliberate Problem Solving with Large Language Models." *NeurIPS 2023*. https://arxiv.org/abs/2305.10601

[5] Wang, X., Wei, J., Schuurmans, D., et al. (2022). "Self-Consistency Improves Chain of Thought Reasoning in Language Models." *ICLR 2023*. https://arxiv.org/abs/2203.11171
