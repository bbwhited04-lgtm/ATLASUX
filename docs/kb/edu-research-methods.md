# Research Methods & Data Analysis

## Purpose

This document provides AI agents with foundational expertise in research methods and data analysis — the systematic processes by which knowledge claims are generated, tested, and validated. Atlas UX agents must be able to evaluate evidence quality, design data collection strategies, interpret results with appropriate nuance, and help organizations make data-driven decisions with the rigor of empirical research. This is not about turning agents into statisticians — it is about ensuring agents can distinguish strong evidence from weak evidence, valid conclusions from spurious ones, and actionable findings from noise.

---

## 1. The Nature of Research

### What Is Research?

Research is the systematic investigation of questions using established methods to discover new knowledge, test theories, or solve practical problems. It is distinguished from casual inquiry by its: (a) systematic methodology, (b) objectivity (or transparency about subjectivity), (c) reproducibility, (d) peer scrutiny, and (e) cumulative contribution to a body of knowledge.

### Research Paradigms

**Positivism/Post-positivism**: Reality exists objectively and can be measured. Knowledge is derived from observable, measurable phenomena. Quantitative methods are primary. The goal is to discover universal laws and causal relationships. Dominant in natural and behavioral sciences.

**Constructivism/Interpretivism**: Reality is socially constructed and subjective. Knowledge is co-created through the interaction of the researcher and the researched. Qualitative methods are primary. The goal is to understand meaning and lived experience. Dominant in social sciences and humanities.

**Pragmatism**: The research question determines the methodology. Mixed methods are valued. The goal is to solve practical problems. Methods are tools — use whatever works.

**Critical theory**: Research should expose and challenge power structures, inequality, and oppression. Research is never neutral — it either reinforces or challenges the status quo.

### Application to Atlas UX

Agents should approach data-driven decision-making with paradigm awareness: quantitative platform metrics (usage data, conversion rates, error rates) provide positivist evidence; qualitative user feedback (interviews, open-ended responses, support tickets) provides interpretivist evidence. Both are valid; neither alone is sufficient. Pragmatism is the appropriate stance — use whatever evidence best addresses the question at hand.

---

## 2. Quantitative Research Designs

### Experimental Design

The gold standard for establishing causation. Key features:

- **Random assignment**: Participants randomly assigned to conditions, eliminating selection bias
- **Manipulation**: The researcher controls the independent variable (treatment vs. control)
- **Control**: Extraneous variables are held constant or randomized away
- **Measurement**: Dependent variable is measured objectively

**True experiment**: Random assignment + manipulation + control. Example: randomly assigning new users to two onboarding sequences and measuring task completion rates.

**Pre-test/post-test control group design**: Measure before and after intervention, with a control group that receives no intervention. The most common experimental design.

**Solomon four-group design**: Controls for the pre-test sensitization effect by including groups that receive/do not receive the pre-test.

**Factorial designs**: Manipulate two or more independent variables simultaneously to examine main effects and interaction effects.

### Quasi-Experimental Design

When random assignment is not possible (ethical, practical, or logistical constraints), quasi-experiments approximate experimental design:

- **Non-equivalent control group**: Pre-test/post-test with a comparison group that was not randomly assigned
- **Interrupted time series**: Multiple measurements before and after an intervention, looking for a change in the trend
- **Regression discontinuity**: Assignment to treatment based on a cutoff score on a continuous variable

### Correlational Design

Measures the relationship between two or more variables without manipulating any of them. Correlation coefficients (Pearson's r, Spearman's rho) indicate the strength and direction of the relationship (-1 to +1).

**Critical principle**: Correlation does not imply causation. A correlation between feature usage and customer retention does not mean the feature causes retention — a third variable (e.g., overall engagement) may drive both. Agents must never make causal claims from correlational data.

### Survey Research

Systematically collecting data from a sample to describe, compare, or explain knowledge, attitudes, and behavior. Strengths: large samples, generalizability, cost-effective. Weaknesses: self-report bias, social desirability bias, question interpretation variability, non-response bias.

**Survey design principles**: Clear, unambiguous questions. Avoid double-barreled questions ("Was the onboarding fast and helpful?"). Avoid leading questions. Randomize response options where appropriate. Pilot test before deployment.

---

## 3. Qualitative Research Designs

### Case Study (Yin, 2018)

In-depth investigation of a contemporary phenomenon in its real-world context. Appropriate when: "how" or "why" questions are asked, the researcher has little control over events, and the boundaries between phenomenon and context are unclear.

Types: single case (critical, unusual, revelatory, longitudinal) and multiple case (replication logic — literal and theoretical replication).

Data sources: documents, archival records, interviews, direct observation, participant observation, physical artifacts. **Triangulation** — using multiple data sources to corroborate findings — strengthens credibility.

### Ethnography

Immersive, long-term study of a cultural group's patterns of behavior, beliefs, and language. The researcher becomes a participant-observer. Produces thick description (Geertz, 1973) — detailed accounts that capture the meaning of social actions in context.

### Grounded Theory (Glaser & Strauss, 1967; Charmaz, 2006)

Systematic methodology for generating theory from data. Rather than testing a pre-existing hypothesis, theory emerges from the data through iterative coding and constant comparison.

Process: open coding (identifying initial concepts), axial coding (relating concepts to each other), selective coding (integrating concepts into a theory), theoretical sampling (collecting additional data to refine the theory), theoretical saturation (collecting data until no new concepts emerge).

### Phenomenology (Moustakas, 1994)

Explores the lived experience of individuals who share a common phenomenon. The goal is to describe the essence of the experience — what it is like to experience something.

In Atlas UX context: "What is the experience of transitioning from manual business management to AI-assisted automation?" Phenomenological inquiry would reveal the emotional, cognitive, and social dimensions of this transition.

---

## 4. Mixed Methods Research

### Definition

Mixed methods research integrates quantitative and qualitative methods within a single study or program of inquiry. The premise: the combination provides a more complete understanding than either method alone.

### Common Designs (Creswell & Plano Clark, 2018)

**Convergent parallel**: Quantitative and qualitative data collected simultaneously and compared/merged during interpretation. "What do the numbers say?" and "What do the stories say?" — then look for convergence and divergence.

**Explanatory sequential**: Quantitative data collected first, then qualitative data collected to explain or elaborate on the quantitative findings. "The retention data shows a 30% drop at week 2 — let's interview users to understand why."

**Exploratory sequential**: Qualitative data collected first to explore the phenomenon, then quantitative data collected to test the emerging theory. "User interviews suggest confusion about workflows — let's measure this at scale with a survey."

### Application to Atlas UX

Agents should think in mixed methods: platform analytics provide quantitative data (who, what, when, how much), while user feedback, support conversations, and behavioral patterns provide qualitative context (why, how, what it means). A quantitative finding without qualitative context is numbers without meaning. A qualitative finding without quantitative context is anecdotes without scale.

---

## 5. Research Design Elements

### Variables

- **Independent variable (IV)**: The factor manipulated or studied as a potential cause
- **Dependent variable (DV)**: The outcome measured
- **Confounding variable**: An extraneous variable that correlates with both IV and DV, threatening the validity of causal conclusions
- **Moderator**: A variable that affects the strength or direction of the relationship between IV and DV
- **Mediator**: A variable that explains the mechanism through which IV affects DV

### Validity

**Internal validity**: The degree to which the study design supports causal conclusions. Threats include: history (events outside the study), maturation (natural change over time), testing (pre-test affecting post-test), instrumentation (measurement changes), regression to the mean, selection bias, attrition, and interaction effects.

**External validity**: The degree to which findings generalize to other populations, settings, and times. Threats include: sample bias, artificiality of the research setting, Hawthorne effect (behavior change due to being observed).

**Construct validity**: The degree to which the measures actually capture the constructs they claim to measure.

**Statistical conclusion validity**: The degree to which statistical conclusions about relationships are accurate — appropriate use of statistical tests, adequate sample size, controlling for error rate.

### Reliability

The consistency of measurement. A reliable instrument produces the same results under the same conditions. Types: test-retest (stability over time), internal consistency (items measuring the same construct correlate), inter-rater (different evaluators produce the same scores).

---

## 6. Sampling Methods

### Probability Sampling (Supports Generalization)

- **Simple random sampling**: Every member of the population has an equal probability of selection
- **Stratified random sampling**: Population divided into strata; random samples drawn from each stratum
- **Cluster sampling**: Population divided into clusters (e.g., organizations); random selection of clusters, then all members of selected clusters
- **Systematic sampling**: Every Nth member of the population

### Non-Probability Sampling (Does Not Support Generalization)

- **Convenience sampling**: Whoever is available. Most common, least rigorous
- **Purposive sampling**: Deliberate selection based on specific criteria
- **Snowball sampling**: Initial participants recruit additional participants
- **Quota sampling**: Non-random sampling that matches known population proportions

### Sample Size

For quantitative research: determined by desired effect size, significance level, statistical power, and variability. Power analysis (Cohen, 1988) is the standard method. Rule of thumb: larger samples produce more reliable estimates and greater statistical power.

For qualitative research: determined by data saturation — the point at which new data no longer generates new insights. Typical ranges: 5-25 for phenomenology, 20-60 for grounded theory, 1-5 for case study.

---

## 7. Data Collection Methods

### Surveys and Questionnaires

Structured instruments for collecting self-report data. Design considerations: question format (open/closed), response scales (Likert, semantic differential, ranking), length, order effects, branching logic.

### Interviews

Structured (standardized questions), semi-structured (guide with flexibility), or unstructured (conversational). Probing techniques: elaboration probes ("Tell me more"), clarification probes ("What do you mean by..."), contrast probes ("How is that different from...").

### Observation

Direct observation of behavior in natural or controlled settings. Can be participant (researcher is involved) or non-participant. Recording methods: field notes, video, behavior coding schemes, time sampling.

### Document Analysis

Systematic examination of existing documents — reports, logs, emails, meeting minutes, policy documents. In Atlas UX: audit logs, support tickets, knowledge base usage data, agent interaction logs.

---

## 8. Statistical Analysis

### Descriptive Statistics

Summarize and describe data:

- **Central tendency**: Mean (arithmetic average), median (middle value), mode (most frequent value)
- **Variability**: Range, variance, standard deviation, interquartile range
- **Distribution shape**: Skewness (symmetry), kurtosis (tail weight), normality

### Inferential Statistics

Draw conclusions about populations from samples:

**t-test**: Compares means of two groups. Independent samples (two different groups) or paired samples (same group measured twice). Assumptions: normality, homogeneity of variance.

**Analysis of Variance (ANOVA)**: Compares means of three or more groups. One-way (one IV), factorial (multiple IVs). Post-hoc tests (Tukey, Bonferroni) identify which specific groups differ.

**Chi-square test**: Tests association between categorical variables. Compares observed frequencies to expected frequencies.

**Regression**: Models the relationship between one or more predictor variables and an outcome variable. Simple regression (one predictor), multiple regression (several predictors), logistic regression (binary outcome).

**Non-parametric alternatives**: When assumptions of parametric tests are violated: Mann-Whitney U (instead of t-test), Kruskal-Wallis (instead of ANOVA), Spearman's rho (instead of Pearson's r).

### Effect Size

Statistical significance (p < .05) tells you whether an effect exists — not how large it is. Effect size measures the magnitude of the effect:

- **Cohen's d**: Standardized mean difference. Small: 0.2, Medium: 0.5, Large: 0.8
- **r**: Correlation coefficient. Small: 0.1, Medium: 0.3, Large: 0.5
- **Eta-squared**: Proportion of variance explained. Small: 0.01, Medium: 0.06, Large: 0.14
- **Odds ratio**: For binary outcomes. 1.0 = no effect; >1 or <1 indicates effect direction and size

### Statistical vs. Practical Significance

A result can be statistically significant but practically meaningless. With a large enough sample, even trivially small effects become statistically significant. The question is not "Is the p-value below .05?" but "Is the effect large enough to matter in practice?"

### Confidence Intervals

A range of values within which the true population parameter is expected to fall with a specified probability (typically 95%). More informative than p-values because they convey both the estimated effect and the precision of that estimate.

---

## 9. Literature Review Methodology

### Purpose

A literature review synthesizes existing research to: (a) establish what is known about a topic, (b) identify gaps in knowledge, (c) provide context for new research, and (d) avoid duplication of effort.

### Systematic Review

A rigorous, reproducible methodology for identifying, evaluating, and synthesizing all relevant research on a topic. Steps: define the research question, develop search strategy, screen and select studies, extract data, assess quality, synthesize findings.

### Meta-Analysis

A statistical technique for combining the results of multiple studies to produce an overall estimate of effect size. Provides more precise and generalizable estimates than any single study.

---

## 10. Application: Data-Driven Decision-Making for Agents

Agents should approach organizational data with research rigor:

1. **Define the question precisely**: Vague questions produce vague answers
2. **Identify the best available evidence**: What data exists? What quality is it?
3. **Evaluate the evidence critically**: What are the limitations? What biases might be present?
4. **Distinguish correlation from causation**: Never claim X causes Y without experimental evidence
5. **Report uncertainty**: Use ranges and qualifications, not false precision
6. **Consider alternative explanations**: What else could explain this finding?
7. **Separate statistical from practical significance**: Focus on effect size, not just p-values
8. **Triangulate**: Use multiple data sources to corroborate conclusions

---

## References

Charmaz, K. (2006). *Constructing Grounded Theory*. Sage. | Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Lawrence Erlbaum. | Creswell, J.W., & Plano Clark, V.L. (2018). *Designing and Conducting Mixed Methods Research* (3rd ed.). Sage. | Geertz, C. (1973). *The Interpretation of Cultures*. Basic Books. | Glaser, B.G., & Strauss, A.L. (1967). *The Discovery of Grounded Theory*. Aldine. | Moustakas, C. (1994). *Phenomenological Research Methods*. Sage. | Yin, R.K. (2018). *Case Study Research and Applications* (6th ed.). Sage.
