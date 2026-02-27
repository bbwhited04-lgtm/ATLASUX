# Prompt Engineering Tips for Atlas UX Agents

## Overview

Atlas UX agents respond to natural language prompts through the Chat Interface, Telegram bot, and workflow configurations. Writing effective prompts helps agents deliver more accurate, useful, and actionable results.

## Fundamental Principles

### Be Specific About the Task
Vague prompts produce vague results. Instead of asking an agent to "do something about marketing," specify exactly what you need.

**Weak**: "Help with my social media."
**Strong**: "Draft 5 LinkedIn posts promoting our new product launch. Each post should be under 200 words, include a call-to-action, and target small business owners."

### Provide Context
Agents perform better when they understand the situation. Include relevant background, constraints, and goals.

**Weak**: "Write an email."
**Strong**: "Write a follow-up email to a client who attended our webinar last week. Tone should be professional but warm. Include a link to the recording and suggest a 15-minute call next Tuesday."

### Define the Output Format
Tell the agent exactly how you want the response structured.

**Examples**:
- "Return results as a markdown table with columns: Company, Website, Industry, Size"
- "Write this as a numbered list with a one-sentence summary for each item"
- "Format as a decision memo with sections: Summary, Risk Assessment, Recommendation, Cost"

## Agent-Specific Tips

### Atlas (CEO) Prompts
Atlas coordinates all activity. Best for strategic questions and cross-agent orchestration.

- "Review the daily intelligence brief and assign three priority tasks for today"
- "Summarize all pending decision memos and flag any that are past deadline"
- "Generate a weekly operations report covering jobs completed, spend, and agent activity"

### Binky (CRO) Prompts
Binky handles research and revenue strategy. Best for market intelligence and competitive analysis.

- "Research the top 5 competitors in the AI productivity space. For each, list pricing, key features, and market positioning"
- "Analyze our CRM data and identify the three highest-value customer segments"
- "Draft a revenue strategy for Q2 targeting small business owners in the services sector"

### Cheryl (Support) Prompts
Cheryl manages customer support. Best for ticket handling and response drafting.

- "Triage the latest 10 support tickets and categorize by urgency: critical, high, medium, low"
- "Draft a response to a customer asking about our refund policy. Tone: empathetic, solution-focused"
- "Create a FAQ document covering the 15 most common customer questions this month"

### Sunday (Communications) Prompts
Sunday coordinates content creation. Best for content planning and distribution strategy.

- "Create a content calendar for next week covering all 13 social platforms"
- "Draft a technical blog post explaining how our agent architecture works, 1500 words, developer audience"
- "Review Reynolds' latest blog draft and suggest improvements for SEO and readability"

### Social Publisher Prompts
Each social publisher adapts content for their specific platform.

- "Kelly, write 3 X/Twitter threads about AI automation trends. Include relevant hashtags"
- "Link, draft a LinkedIn article on the future of AI in small business operations"
- "Cornwall, create 5 Pinterest pin descriptions for our latest blog post on content automation"

## Advanced Techniques

### Chain-of-Thought Prompting
Ask the agent to reason through a problem step by step.

"Analyze our current marketing spend. First, list all active campaigns. Then, calculate the cost per acquisition for each. Finally, recommend which campaigns to scale and which to cut."

### Role Assignment
Explicitly remind the agent of their role for context-heavy tasks.

"As our CFO, review the following expense report and flag any items that exceed our auto-spend limit of $500."

### Constraint Setting
Define boundaries upfront to avoid off-target results.

"Draft a product description for our Professional tier. Constraints: under 150 words, no superlatives, focus on ROI, include pricing ($249/month)."

### Multi-Step Task Decomposition
Break complex requests into numbered steps.

"1. Search the knowledge base for articles about email automation. 2. Summarize the top 3 results. 3. Identify any gaps in coverage. 4. Draft an outline for a new KB article filling those gaps."

### Memory Recall
Agents can access their own history. Use recall prompts to build on past work.

"Recall our last conversation about the Q1 marketing plan. What were the three action items we agreed on?"

"What did you do yesterday regarding the competitor analysis task?"

## Common Mistakes to Avoid

### Overloading a Single Prompt
Asking an agent to do 10 things in one message leads to incomplete results. Break large tasks into 2-3 focused prompts.

### Ignoring Agent Specialization
Asking Kelly (X/Twitter specialist) to draft a legal contract wastes resources. Route tasks to the right agent.

### Forgetting Approval Requirements
Prompts that would trigger external actions (publishing, spending, sending emails) require Atlas approval. Include "draft for review" when you want a preview before execution.

### Assuming Context
Agents work within their session context. If you are starting a new topic, provide fresh context rather than assuming the agent remembers a conversation from days ago.

## Telegram-Specific Tips

When chatting with agents via Telegram:

- Use `/atlas`, `/binky`, `/cheryl` to switch agents
- Use `/help` to see all available agent commands
- Use `/clear` to reset the conversation context
- Long responses are automatically split at 4096 characters
- The typing indicator shows while the agent is processing

## Prompt Templates

### Research Request
```
Research [TOPIC] with focus on [SPECIFIC ANGLE].
Include: [DATA POINTS NEEDED]
Format: [TABLE/LIST/REPORT]
Sources: cite all claims
Deadline context: needed by [DATE] for [PURPOSE]
```

### Content Creation
```
Write a [CONTENT TYPE] about [TOPIC].
Audience: [TARGET AUDIENCE]
Tone: [PROFESSIONAL/CASUAL/TECHNICAL]
Length: [WORD COUNT]
Include: [SPECIFIC ELEMENTS]
Avoid: [THINGS TO EXCLUDE]
```

### Analysis Request
```
Analyze [DATA/SITUATION].
Consider: [FACTORS]
Compare against: [BENCHMARKS]
Output: [RECOMMENDATION/REPORT/SUMMARY]
Risk assessment: include if applicable
```

## Measuring Prompt Effectiveness

Track these indicators to improve your prompts over time:
- Did the agent's response require follow-up clarification?
- Was the output format correct on the first attempt?
- Did the response address all parts of your request?
- Was the tone and audience targeting appropriate?

If you frequently need to rephrase, adjust your prompt template and save it for reuse.
