# Business Analytics & Decision Science

## Purpose

This document equips Atlas UX agents with frameworks for data-driven decision-making. Agents must move beyond intuition to evidence-based reasoning, using statistical thinking, experimentation, and structured analysis to drive superior outcomes. Every major decision should be supported by data, and agents should know how to gather, analyze, and interpret that data.

---

## 1. The Analytics Maturity Model

Four levels of analytics capability, each building on the previous:

### Level 1: Descriptive Analytics — What Happened?

Summarizes historical data into understandable formats.
- Dashboards, reports, scorecards
- Aggregations: totals, averages, counts, distributions
- Time-series trends and period-over-period comparisons
- Segmentation breakdowns

**Tools**: SQL queries, pivot tables, visualization libraries, BI dashboards.

**Limitation**: Tells you what happened but not why or what to do about it.

### Level 2: Diagnostic Analytics — Why Did It Happen?

Identifies root causes behind observed patterns.
- Drill-down analysis: disaggregating data to find anomalies
- Correlation analysis: which variables move together?
- Cohort comparison: how do different groups behave?
- Contribution analysis: which factors explain the change?

**Tools**: Statistical analysis, data exploration, A/B test results, segmented reporting.

### Level 3: Predictive Analytics — What Will Happen?

Uses patterns in historical data to forecast future outcomes.
- Regression models: predict continuous outcomes
- Classification models: predict categorical outcomes
- Time-series forecasting: predict future values based on trends
- Propensity scoring: likelihood of customer behaviors

**Tools**: Statistical models, machine learning, forecasting algorithms.

### Level 4: Prescriptive Analytics — What Should We Do?

Recommends optimal actions based on predictions and constraints.
- Optimization models: maximize or minimize an objective function
- Simulation: test scenarios without real-world consequences
- Decision trees: map choices and outcomes
- Recommendation engines: suggest best actions

**Tools**: Operations research, simulation software, decision support systems.

### Agent Application

Agents should aim to operate at Level 3-4 for critical decisions. For routine reporting, Levels 1-2 are sufficient. The key is matching analytical depth to decision importance.

---

## 2. Key Statistical Concepts

### Measures of Central Tendency

- **Mean** (average): Sum / Count. Sensitive to outliers.
- **Median**: Middle value when sorted. Robust to outliers. Use for skewed distributions (income, home prices).
- **Mode**: Most frequent value. Useful for categorical data.

**When to use which**: If the distribution is symmetric, mean and median are similar — use mean. If skewed, use median. Always report both if there's any doubt.

### Measures of Spread

- **Range**: Max - Min. Simple but misleading (driven by outliers).
- **Standard Deviation (σ)**: Average distance from the mean. The most common spread measure.
- **Variance (σ²)**: Standard deviation squared. Used in statistical formulas.
- **Interquartile Range (IQR)**: Q3 - Q1. The range of the middle 50%. Robust to outliers.
- **Coefficient of Variation**: σ / mean. Allows comparison across different scales.

### The Normal Distribution

Many natural phenomena follow a bell curve. Key properties:
- 68% of data within ±1σ of the mean
- 95% within ±2σ
- 99.7% within ±3σ

### Correlation vs Causation

**Correlation**: Two variables move together (r ranges from -1 to +1).
- r = 1: Perfect positive correlation
- r = 0: No linear relationship
- r = -1: Perfect negative correlation

**Causation**: One variable actually influences another.

**Critical rule**: Correlation does NOT imply causation. Possible explanations for correlation:
1. A causes B
2. B causes A
3. C causes both A and B (confounding variable)
4. The correlation is coincidental (spurious)

To establish causation, you need: temporal precedence (cause before effect), covariation, elimination of alternative explanations. Randomized experiments (A/B tests) are the gold standard.

---

## 3. A/B Testing Methodology

The most reliable method for establishing causal relationships in business.

### Step 1: Define Hypothesis

```
H0 (Null): There is no difference between A and B
H1 (Alternative): There is a meaningful difference
```

Be specific: "Changing the CTA button from blue to green will increase click-through rate by at least 10%."

### Step 2: Determine Sample Size

Required sample size depends on:
- **Baseline conversion rate**: Lower rates need more samples
- **Minimum detectable effect (MDE)**: Smaller effects need more samples
- **Statistical significance level (α)**: Typically 0.05 (5% false positive rate)
- **Statistical power (1 - β)**: Typically 0.80 (80% probability of detecting a real effect)

```
n ≈ 16 × σ² / δ²   (simplified approximation)
```

Where σ² is variance and δ is the minimum difference to detect.

### Step 3: Randomize and Run

- Randomly assign subjects to control (A) and treatment (B)
- Run for adequate duration (minimum 1-2 full business cycles)
- Do not peek at results and stop early (this inflates false positives)
- Ensure no other changes occur during the test

### Step 4: Analyze Results

- Calculate the metric for each group
- Compute the difference and confidence interval
- Check p-value: if p < α, reject H0 (result is statistically significant)
- Check practical significance: Is the effect large enough to matter?

### Step 5: Decide and Document

- If significant and practically meaningful: implement the change
- If significant but trivially small: probably not worth the effort
- If not significant: retain the control; the test was informative regardless

### Common A/B Testing Mistakes

1. **Peeking**: Checking results before reaching sample size inflates false positives
2. **Too many variants**: Each additional variant requires more samples; use A/B, not A/B/C/D
3. **Wrong metric**: Testing a surrogate metric that doesn't correlate with the real business outcome
4. **Selection bias**: Non-random assignment or differential dropout
5. **Duration too short**: Seasonal and day-of-week effects can bias results
6. **Novelty effect**: Users react to change itself, not the change's inherent value

---

## 4. Cohort Analysis

Groups users by a shared characteristic (usually sign-up date) and tracks behavior over time.

### Building a Cohort Analysis

1. Define the cohort dimension (sign-up month, acquisition channel, pricing tier)
2. Define the metric (retention rate, revenue, engagement)
3. Build the cohort table:

| Cohort | Month 0 | Month 1 | Month 2 | Month 3 |
|--------|---------|---------|---------|---------|
| Jan cohort | 100% | 60% | 45% | 38% |
| Feb cohort | 100% | 65% | 50% | 42% |
| Mar cohort | 100% | 70% | 55% | 48% |

4. Look for patterns: Are newer cohorts retaining better? Is there a critical drop-off point?

### What Cohort Analysis Reveals

- Whether product improvements are working (newer cohorts should perform better)
- The natural retention curve shape (when does it flatten?)
- Which acquisition channels produce the highest-value users
- Whether pricing changes affect long-term behavior

---

## 5. Funnel Analysis

Tracks user progression through a defined sequence of steps.

### Building a Funnel

1. Define the steps: Visit → Sign Up → Activate → Purchase → Repeat
2. Measure the conversion rate at each step
3. Calculate the drop-off at each step
4. Identify the biggest drop-off (highest-leverage optimization point)

### Funnel Metrics

```
Step Conversion Rate = Users completing step N / Users completing step N-1
Overall Conversion Rate = Users completing final step / Users entering first step
Drop-off Rate = 1 - Step Conversion Rate
```

### Optimization Priority

Focus on the step with the largest absolute drop-off in potential revenue. A 1% improvement at a high-volume step often matters more than a 10% improvement at a low-volume step.

### Agent Application

Binky and publisher agents should maintain funnel dashboards for each acquisition channel. Identify the weakest step and focus optimization efforts there. Weekly funnel reviews should be standard practice.

---

## 6. Regression Basics

Regression quantifies the relationship between one or more independent variables and a dependent variable.

### Simple Linear Regression

```
Y = β₀ + β₁X + ε
```

Where:
- Y = dependent variable (what you predict)
- X = independent variable (what you use to predict)
- β₀ = intercept (Y when X = 0)
- β₁ = slope (change in Y for each unit change in X)
- ε = error term

**R² (coefficient of determination)**: The proportion of variance in Y explained by X. Range 0-1. Higher is better, but interpret in context. R² = 0.3 is excellent for human behavior data; R² = 0.3 is terrible for physics.

### Multiple Regression

```
Y = β₀ + β₁X₁ + β₂X₂ + ... + βₙXₙ + ε
```

Allows multiple predictors simultaneously. Watch for multicollinearity (predictors correlated with each other), which makes individual coefficients unreliable.

### Interpretation

- β₁ = 0.5 means: "A 1-unit increase in X₁ is associated with a 0.5-unit increase in Y, holding all other variables constant."
- p-value < 0.05 for a coefficient means: the relationship is statistically significant.
- Confidence interval for β₁: the range of plausible true values.

---

## 7. Decision Trees

### Structure

A tree-based model for sequential decision-making under uncertainty.

```
Decision Node (square): A choice you make
Chance Node (circle): An uncertain outcome
Terminal Node (triangle): The final payoff/outcome
```

### Expected Value Calculation

At each chance node:
```
EV = Σ (Probability of outcome × Value of outcome)
```

At each decision node, choose the branch with the highest expected value.

### Decision Tree Example

```
Launch product?
├── Yes (Cost: $500K)
│   ├── Success (60%): Revenue $2M → Net: $1.5M
│   └── Failure (40%): Revenue $100K → Net: -$400K
│   EV = 0.6 × $1.5M + 0.4 × (-$400K) = $740K
└── No
    └── $0
Decision: Launch (EV = $740K > $0)
```

### Value of Information

Before making a decision, consider: would additional information change your choice? If so, how much is that information worth?

```
EVPI = EV with perfect information - EV without information
```

---

## 8. Monte Carlo Simulation

### Concept

Instead of using single-point estimates, model inputs as probability distributions and run thousands of simulations to see the range of possible outcomes.

### Process

1. Identify uncertain variables (revenue growth, churn rate, costs)
2. Define probability distributions for each (normal, triangular, uniform)
3. Run 1,000-10,000 simulations, sampling from each distribution
4. Analyze the output distribution: mean, median, percentiles, probability of specific outcomes

### Why It Matters

Single-point forecasts create false precision. Monte Carlo reveals:
- The probability of achieving the target outcome
- The worst-case scenarios and their likelihood
- Which input variables have the most impact on outcomes (sensitivity)

---

## 9. KPI Design Principles

### What Makes a Good KPI?

**SMART criteria**:
- **Specific**: Clearly defined, no ambiguity
- **Measurable**: Quantifiable with reliable data
- **Actionable**: Connected to decisions the team can influence
- **Relevant**: Aligned with strategic objectives
- **Time-bound**: Measured over a defined period

### KPI Hierarchy

```
North Star Metric (company-level)
├── Revenue KPIs (Binky)
│   ├── MRR, ARR, NDR
│   └── CAC, LTV, conversion rate
├── Product KPIs (Petra)
│   ├── Activation rate, feature adoption
│   └── Time-to-value, task completion rate
├── Financial KPIs (Tina)
│   ├── Burn rate, runway, gross margin
│   └── Revenue per employee, unit economics
└── Operational KPIs (Atlas)
    ├── Agent utilization, task throughput
    └── Error rate, approval cycle time
```

### Leading vs Lagging Indicators

- **Lagging indicators**: Measure outcomes (revenue, profit, churn). Important but backward-looking. By the time you see the number, it's too late to change it.
- **Leading indicators**: Measure activities that predict outcomes (pipeline, engagement, NPS). Forward-looking. More actionable.

**Best practice**: Track 3-5 leading indicators for every critical lagging indicator.

### Vanity Metrics vs Actionable Metrics

| Vanity (Avoid) | Actionable (Use) |
|----------------|------------------|
| Total registered users | Monthly active users |
| Page views | Conversion rate |
| Social media followers | Engagement rate |
| App downloads | Activation rate |
| Total revenue (cumulative) | MRR growth rate |

---

## 10. Analytics Decision Framework for Agents

When making data-driven decisions:

1. **Define the question precisely**: What specific decision will this analysis inform?
2. **Identify the right metric**: Is it actionable, measurable, and aligned with the goal?
3. **Gather data**: Is the data reliable, complete, and representative?
4. **Choose the right method**: Descriptive for understanding, diagnostic for root cause, predictive for forecasting, prescriptive for optimization
5. **Check for biases**: Selection bias, survivorship bias, confounding variables
6. **Assess significance**: Is the result statistically significant AND practically meaningful?
7. **Communicate clearly**: Lead with the insight, support with data, recommend an action
8. **Monitor outcomes**: Did the action produce the expected result? Update models accordingly

---

## References

- Provost, F. & Fawcett, T. *Data Science for Business*
- Davenport, T. & Harris, J. *Competing on Analytics*
- Hubbard, D. (2010). *How to Measure Anything*
- Croll, A. & Yoskovitz, B. *Lean Analytics*
- Silver, N. (2012). *The Signal and the Noise*
- Kahneman, D. (2011). *Thinking, Fast and Slow*
