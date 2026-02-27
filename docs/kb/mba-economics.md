# Managerial Economics

## Purpose

This document equips Atlas UX agents with economic reasoning skills for market analysis, pricing decisions, competitive strategy, and resource allocation. Agents need to think like economists — understanding incentives, trade-offs, marginal analysis, and market dynamics to make optimal decisions under uncertainty.

---

## 1. Supply and Demand Fundamentals

### The Law of Demand
As price increases (all else equal), quantity demanded decreases. The demand curve slopes downward. Exceptions are rare (Giffen goods, Veblen goods).

### The Law of Supply
As price increases (all else equal), quantity supplied increases. The supply curve slopes upward.

### Market Equilibrium
Where supply equals demand. At this price and quantity, there is no surplus or shortage.

```
Equilibrium: Qd(P*) = Qs(P*)
```

### Shifts vs Movements

**Movement along a curve**: Caused by a change in the good's own price.
**Shift of a curve**: Caused by a change in other factors.

Demand shifts from: income changes, substitute/complement prices, tastes, expectations, population.
Supply shifts from: input costs, technology, number of sellers, expectations, government policy.

### Agent Application

When agents analyze a market opportunity, they must distinguish between price effects (movement) and structural changes (shifts). A competitor lowering prices causes movement along the demand curve. A new regulation banning substitutes shifts the demand curve outward.

---

## 2. Elasticity

### Price Elasticity of Demand (PED)

```
PED = % Change in Quantity Demanded / % Change in Price
```

| |PED| | Classification | Implication |
|-------|---------------|-------------|
| > 1 | Elastic | Price increase reduces total revenue |
| = 1 | Unit elastic | Revenue unchanged |
| < 1 | Inelastic | Price increase raises total revenue |
| = 0 | Perfectly inelastic | Quantity unaffected by price (vertical demand) |
| = ∞ | Perfectly elastic | Any price increase loses all demand (horizontal demand) |

**Determinants of elasticity**:
- Availability of substitutes (more substitutes = more elastic)
- Necessity vs luxury (necessities are inelastic)
- Proportion of budget (larger share = more elastic)
- Time horizon (more elastic in the long run)
- Brand loyalty (strong loyalty = inelastic)

### Revenue Optimization Using Elasticity

```
Marginal Revenue = P × (1 + 1/PED)
```

- If demand is elastic: Lower price to increase revenue
- If demand is inelastic: Raise price to increase revenue
- Revenue is maximized where PED = -1

### Income Elasticity of Demand (YED)

```
YED = % Change in Quantity Demanded / % Change in Income
```

- YED > 0: Normal good (demand rises with income)
- YED > 1: Luxury good (demand rises faster than income)
- 0 < YED < 1: Necessity (demand rises slower than income)
- YED < 0: Inferior good (demand falls as income rises)

### Cross-Price Elasticity (XED)

```
XED = % Change in Quantity of A / % Change in Price of B
```

- XED > 0: Substitutes (price of B rises, demand for A rises)
- XED < 0: Complements (price of B rises, demand for A falls)
- XED ≈ 0: Unrelated goods

---

## 3. Market Structures

### Perfect Competition

**Characteristics**: Many small firms, identical products, free entry/exit, perfect information, price takers.

**Implications**: Firms earn zero economic profit in the long run. Price = Marginal Cost = Minimum Average Total Cost. No pricing power.

**Relevance**: Commodity markets, some agricultural products. Agents should recognize when a market is trending toward commoditization.

### Monopolistic Competition

**Characteristics**: Many firms, differentiated products, free entry/exit, some pricing power.

**Implications**: Firms can charge above marginal cost due to differentiation. Economic profits attract entry, eroding margins over time. Key to success is continuous differentiation.

**Relevance**: Most consumer markets, restaurants, retail, SaaS (within segments).

### Oligopoly

**Characteristics**: Few large firms, high barriers to entry, interdependent decisions, differentiated or standardized products.

**Implications**: Each firm must consider competitor reactions. Game theory applies. Tendency toward tacit collusion on price. Non-price competition (R&D, branding, features) is common.

**Relevance**: Airlines, telecom, cloud computing, automotive. The structure most relevant to technology markets.

### Monopoly

**Characteristics**: Single seller, no close substitutes, high barriers to entry.

**Implications**: Firm sets price above marginal cost. Charges the highest price the market will bear. Deadweight loss (economic inefficiency). Subject to antitrust regulation.

**Types**: Natural monopoly (high fixed costs, economies of scale), legal monopoly (patents, licenses), platform monopoly (winner-take-all network effects).

---

## 4. Game Theory Basics

### Key Concepts

**Players**: Decision-makers (firms, agents, individuals).
**Strategies**: Available choices for each player.
**Payoffs**: Outcomes resulting from strategy combinations.
**Nash Equilibrium**: No player can improve their payoff by unilaterally changing strategy.

### The Prisoner's Dilemma

The most important game in business strategy.

|  | Competitor Cooperates | Competitor Defects |
|---|---|---|
| **You Cooperate** | Both get moderate reward (3,3) | You get worst outcome (0,5) |
| **You Defect** | You get best outcome (5,0) | Both get poor outcome (1,1) |

**Nash Equilibrium**: Both defect (even though both cooperating is better). This explains why price wars happen, why cartels break down, and why short-term incentives can destroy long-term value.

**Escaping the dilemma**: Repeated games, reputation effects, credible commitments, contractual agreements.

### First-Mover Advantage vs Second-Mover Advantage

**First-mover benefits**: Preempt resources, establish brand, set standards, capture switching costs, ride the learning curve.

**First-mover disadvantages**: High uncertainty costs, free-rider problem (competitors learn from your mistakes), market may not be ready, technology may shift.

**When first-mover advantage is durable**: Strong network effects, high switching costs, patent protection, control of scarce resources.

**When second-mover advantage wins**: Technology is evolving rapidly, customer preferences are unclear, high exploration costs, standards wars.

### Signaling and Screening

**Signaling**: Actions by the informed party to reveal private information credibly (e.g., warranty as quality signal, education as ability signal).

**Screening**: Actions by the uninformed party to induce information revelation (e.g., insurance deductible tiers, product line price discrimination).

---

## 5. Pricing Under Uncertainty

### Marginal Analysis for Decision-Making

The core economic principle: any action should be taken if and only if its marginal benefit exceeds its marginal cost.

```
Optimal quantity: where Marginal Revenue = Marginal Cost
```

**Sunk costs are irrelevant**: Only marginal (forward-looking) costs and benefits matter. The $1M already spent on a failing project is sunk. The only question is whether the next dollar invested has a positive expected return.

### Price Discrimination

Charging different prices to different customers for the same product:

- **First degree**: Perfect price discrimination — charge each customer their maximum willingness to pay. Theoretically captures all consumer surplus. Rarely achievable.
- **Second degree**: Different prices based on quantity or version (bulk discounts, tiered pricing, freemium). Self-selection mechanism.
- **Third degree**: Different prices for different market segments (student discounts, geographic pricing, time-based pricing). Most common.

**Conditions for price discrimination**: Market power, identifiable segments, limited arbitrage (resale prevention).

### Bundling

Selling multiple products together at a price lower than the sum of individual prices. Effective when customer valuations for individual products are negatively correlated (customers who value A highly tend to value B less, and vice versa). Bundling captures more total consumer surplus than individual pricing.

---

## 6. Externalities and Market Failures

### Externalities

Costs or benefits that affect parties not involved in a transaction.

**Negative externalities** (pollution, congestion): Market produces too much. Correction: taxes (Pigouvian), regulation, cap-and-trade, property rights.

**Positive externalities** (education, vaccination, R&D): Market produces too little. Correction: subsidies, mandates, public provision.

### Public Goods

Non-rivalrous (one person's use doesn't diminish another's) and non-excludable (can't prevent people from using it). Free-rider problem leads to under-provision. Examples: national defense, open-source software, basic research.

### Information Asymmetry

- **Adverse selection**: Pre-contractual problem. The informed party has an incentive to misrepresent quality. Result: "market for lemons" — good quality exits the market. Solution: signaling, warranties, third-party certification.
- **Moral hazard**: Post-contractual problem. The informed party changes behavior after the agreement. Result: excessive risk-taking, shirking. Solution: monitoring, incentive alignment, deductibles.

---

## 7. Behavioral Economics

Classical economics assumes rational actors. Behavioral economics recognizes systematic irrationalities.

### Prospect Theory (Kahneman & Tversky)

People evaluate outcomes relative to a reference point, not absolute values. Key findings:
- **Loss aversion**: Losses hurt approximately 2x as much as equivalent gains feel good
- **Diminishing sensitivity**: The difference between $0 and $100 feels larger than between $1,000 and $1,100
- **Reference dependence**: A $50K salary feels great if you expected $40K, terrible if you expected $60K

### Endowment Effect

People value what they already own more highly than what they don't. Sellers demand more than buyers will pay for the identical item. This creates market friction and explains resistance to change.

### Hyperbolic Discounting

People disproportionately prefer immediate rewards over future rewards, even when the future reward is objectively better. This explains procrastination, under-saving, and preference for short-term gains.

### Nudge Theory (Thaler & Sunstein)

Small design choices ("nudges") can steer behavior without restricting options:
- Default options (opt-out vs opt-in)
- Framing effects
- Social proof ("87% of your peers chose this")
- Simplification (reduce friction)

### Agent Application

Agents should anticipate behavioral biases in customers and stakeholders. When presenting options, default to the recommended choice. Frame outcomes in terms of loss avoidance (more motivating than gain framing). Use social proof in marketing content.

---

## 8. Economic Decision Framework for Agents

When evaluating any economic decision:

1. **Identify the relevant costs**: Only marginal, forward-looking costs matter. Exclude sunk costs.
2. **Assess the market structure**: What pricing power exists? Who are the competitors? What are the barriers?
3. **Estimate elasticity**: How will customers respond to price changes? Use historical data.
4. **Apply game theory**: What will competitors do in response? Is this a repeated or one-shot game?
5. **Check for externalities**: Are there costs or benefits not captured in the transaction?
6. **Account for behavioral factors**: How do biases affect customer or stakeholder decisions?
7. **Use marginal analysis**: Does the marginal benefit exceed the marginal cost?
8. **Evaluate under uncertainty**: What are the scenarios? What is the expected value? What is the downside risk?

---

## 9. Key Economic Indicators Agents Should Monitor

| Indicator | What It Signals | Impact on Business |
|-----------|----------------|-------------------|
| GDP Growth | Overall economic expansion/contraction | Affects demand, hiring, investment |
| Inflation (CPI) | Price level changes | Affects costs, pricing, real returns |
| Interest Rates | Cost of borrowing | Affects capital costs, valuations, consumer spending |
| Unemployment | Labor market conditions | Affects hiring costs, consumer spending |
| Consumer Confidence | Spending intentions | Leading indicator of demand |
| PMI (Purchasing Managers Index) | Manufacturing/services activity | Leading indicator of economic direction |

---

## References

- Mankiw, N.G. *Principles of Economics*
- Besanko, D. et al. *Economics of Strategy*
- Kahneman, D. & Tversky, A. (1979). "Prospect Theory"
- Thaler, R. & Sunstein, C. (2008). *Nudge*
- Varian, H. *Intermediate Microeconomics*
- Dixit, A. & Nalebuff, B. *The Art of Strategy*
