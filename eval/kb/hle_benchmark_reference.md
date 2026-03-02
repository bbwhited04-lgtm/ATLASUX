# Humanity's Last Exam (HLE) — Complete Reference

> Source: "Humanity's Last Exam" by Long Phan, Alice Gatti, et al.
> Organizations: Center for AI Safety, Scale AI
> URL: https://lastexam.ai

## Overview

HLE is a multi-modal benchmark at the frontier of human knowledge, designed to be
the final closed-ended academic benchmark of its kind with broad subject coverage.

- **Total questions**: 3,000
- **Subject areas**: 100+ subjects across dozens of fields
- **Contributors**: ~1,000 subject-matter experts from 500+ institutions, 50 countries
- **Question types**: Multiple-choice (20%) and exact-match/short-answer (80%)
- **Multi-modal**: ~10% of questions require comprehending both text and image
- **Text-only**: ~90% of questions are text-only
- **Difficulty level**: Graduate/PhD level, designed to stump frontier LLMs

## Prize Pool

- **Total**: $500,000 USD
- **Top 50 questions**: $5,000 each
- **Next 500 questions**: $500 each
- Determined by organizers based on quality and difficulty

## Subject Distribution (by category weight)

| Category | % of Dataset | Key Subjects |
|---|---|---|
| **Mathematics** | ~42% | Mathematics, Applied Mathematics, Quantum Mechanics, Statistics, Logic |
| **Physics** | ~11% | Physics, Quantum Mechanics, Astronomy |
| **Biology/Medicine** | ~11% | Biology, Genetics, Medicine, Ecology, Microbiology, Neuroscience, Immunology, Molecular Biology, Marine Biology, Biophysics, Computational Biology, Biochemistry |
| **Computer Science/AI** | ~9% | Computer Science, Artificial Intelligence, Machine Learning, Data Science, Robotics, Computational Biology |
| **Humanities/Social Science** | ~8% | History, Economics, Philosophy, Law, Psychology, Linguistics, Art History, Classics, Musicology, Poetry, English Literature, Cultural Studies, Archaeology, Classical Ballet, Education |
| **Chemistry** | ~6% | Chemistry, Chemical Engineering, Materials Science |
| **Engineering** | ~5% | Electrical Engineering, Aerospace Engineering, Civil Engineering, Mechanical Engineering |
| **Other** | ~8% | Trivia, Chess, Geography, Puzzle |

## Top 50 Subjects (in order of frequency)

Mathematics, Physics, Computer Science, Chemistry, Applied Mathematics, Trivia,
Electrical Engineering, Biology, Linguistics, Medicine, Genetics, History, Economics,
Ecology, Artificial Intelligence, Musicology, Philosophy, Neuroscience, Law, Art History,
Biochemistry, Astronomy, Classics, Chess, Chemical Engineering, Microbiology,
Classical Ballet, Materials Science, Poetry, Quantum Mechanics, Aerospace Engineering,
Civil Engineering, Mechanical Engineering, Geography, Robotics, Data Science,
Molecular Biology, Statistics, Immunology, Education, Logic, Computational Biology,
Psychology, English Literature, Machine Learning, Puzzle, Cultural Studies,
Marine Biology, Archaeology, Biophysics.

## Model Performance (State-of-the-Art at Publication)

### Full Dataset (All Questions)

| Model | Accuracy (%) | Calibration Error (%) |
|---|---|---|
| GPT-4o | 3.3 | 92.5 |
| Grok 2 | 3.8 | 93.2 |
| Claude 3.5 Sonnet | 4.3 | 88.9 |
| Gemini 1.5 Pro | 5.0 | 93.1 |
| Gemini 2.0 Flash Thinking | 6.2 | 93.9 |
| o1 | 9.1 | 93.4 |
| DeepSeek-R1* | 9.4 | 81.8 |

*DeepSeek-R1 is not multi-modal; evaluated on text-only subset.

### Text-Only Subset (~90% of public set)

| Model | Accuracy (%) | Calibration Error (%) |
|---|---|---|
| GPT-4o | 2.9 | 90.4 |
| Grok 2 | 3.9 | 92.5 |
| Claude 3.5 Sonnet | 4.2 | 87.0 |
| Gemini 1.5 Pro | 4.8 | 91.1 |
| Gemini 2.0 Flash Thinking | 5.9 | 92.1 |
| o1 | 8.9 | 92.0 |
| DeepSeek-R1 | 9.4 | 81.8 |

### Key Performance Insights

1. **All models score below 10%** — massive gap vs. human expert performance
2. **Calibration errors above 80%** across ALL models — models are confidently wrong
3. **DeepSeek-R1 has best calibration** (81.8%) despite being text-only
4. **Reasoning models** (o1, DeepSeek-R1, Gemini Flash Thinking) do better than standard models
5. **Reasoning models use significantly more tokens** (shown in completion token analysis)
6. **Math questions consume the most reasoning tokens** across all models

## Evaluation Setup

### System Prompts Used by HLE Organizers

**Multiple-choice questions:**
```
Your response should be in the following format:
Explanation: {your explanation for your answer choice}
Answer: {your chosen answer}
Confidence: {your confidence score between 0% and 100% for your answer}
```

**Exact-match questions:**
```
Your response should be in the following format:
Explanation: {your explanation for your final answer}
Exact Answer: {your succinct, final answer}
Confidence: {your confidence score between 0% and 100% for your answer}
```

### Judge Prompt (GPT-4o with structured decoding)

```
Judge whether the following [response] to [question] is correct or not
based on the precise and unambiguous [correct_answer] below.

[question]: {question}
[response]: {response}

Your judgement must be in the format and criteria specified below:
extracted_final_answer: The final exact answer extracted from the [response].
Put the extracted answer as 'None' if there is no exact, final answer to
extract from the response.

[correct_answer]: {correct_answer}

reasoning: Explain why the extracted_final_answer is correct or incorrect
based on [correct_answer], focusing only on if there are meaningful
differences between [correct_answer] and the extracted_final_answer.

correct: Answer 'yes' if extracted_final_answer matches the [correct_answer]
given above, or is within a small margin of error for numerical problems.
Answer 'no' otherwise.

confidence: The extracted confidence score between 0% and 100% from
[response]. Put 100 if there is no confidence score available.
```

## Question Design Criteria

### Requirements
- Questions must be **precise, unambiguous, solvable, and non-searchable**
- Cannot rely on memorization or simple retrieval
- Must be original work or non-trivial syntheses
- Graduate-level expertise typically required
- Clear English with precise technical terminology
- Short, easily verifiable answers for exact-match
- Each question accompanied by detailed solution

### What Makes Questions Hard
1. **Non-searchable**: Cannot be found via internet lookup
2. **Stumps frontier LLMs**: Pre-validated against GPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet, o1
3. **Expert review**: 2 rounds of human expert review
4. **Precise answers**: No room for partial credit or interpretation
5. **Original content**: Not from textbooks or existing datasets

### Artificial Difficulty (Explicitly Excluded)
- Questions requiring large calculations needing a calculator
- Questions requiring running/rendering code
- These create artificial difficulty since evaluated models cannot access tools

### Scoring
- **Exact match** for short-answer questions
- **Letter match** for multiple-choice questions
- **GPT-4o judge** for borderline cases (equivalent formats: decimals vs. fractions)
- **RMS calibration error** for confidence assessment

## Question Format

### Exact-Match (80% of questions)
- Model provides an exact string as output
- Answers kept short and easily verifiable
- Numerical answers approximated to max 2-3 decimals

### Multiple-Choice (20% of questions)
- Model selects one of 5+ answer choices
- When LLMs provide correct answers with faulty reasoning, question parameters
  are modified (e.g., number of answer choices) to discourage false positives

## Key Statistics

- **70,000+** LLM attempts logged during difficulty validation
- **~13,000** questions stumped LLMs and were forwarded to human review
- **3,000** questions in the final public dataset
- Private test set maintained to assess model overfitting
- **~1,000** subject-matter expert contributors
- **500+** institutions
- **50** countries

## Strategic Analysis for Improvement

### By Category Priority (accuracy * volume = impact)

1. **Mathematics (42%)** — HIGHEST priority. Math questions have the most volume AND
   are where reasoning models show the biggest token usage (deepest thinking).
   Techniques: structured proof verification, symbolic computation tools, step-by-step
   algebra verification, constraint checking.

2. **Physics (11%)** — Second priority. Requires dimensional analysis, limiting case
   verification, and numerical computation. Strong overlap with math reasoning.

3. **Biology/Medicine (11%)** — Factual knowledge-heavy. Benefits most from knowledge
   retrieval and anti-hallucination measures.

4. **Computer Science/AI (9%)** — Algorithmic reasoning, complexity analysis, formal
   verification. Benefits from code execution tools.

5. **Humanities/Social Science (8%)** — Factual recall + interpretation. High hallucination
   risk for niche historical/cultural details. Benefits from web search.

6. **Chemistry (6%)** — Mechanism tracing, stoichiometry. Benefits from structured
   calculation verification.

7. **Engineering (5%)** — Applied physics/math. Benefits from calculator tools and
   dimensional analysis.

### Model Architecture Insights

- **Reasoning models outperform standard models** by 2-3x on HLE
- **More reasoning tokens ≠ always better** — compute-optimal approaches needed
- **Calibration is as important as accuracy** — confident wrong answers are worse than
  uncertain correct ones
- **DeepSeek-R1's superior calibration** suggests explicit reasoning chains improve
  self-assessment, not just accuracy
