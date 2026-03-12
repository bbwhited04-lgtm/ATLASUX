# Stress Test Framework — Atlas UX Edition

## Purpose
Every edge case, failure scenario, and "what if" that could break Lucy, Mercer,
or the business. Find these now, not when a customer finds them.

---

## LUCY STRESS TESTS

### Call Handling Edge Cases

```
CALLER BEHAVIOR:
□ Caller says nothing (silence for 10+ seconds)
□ Caller speaks very fast / mumbles / heavy accent
□ Caller is a child asking for their parent (the business owner)
□ Caller is elderly and needs things repeated slowly
□ Caller speaks Spanish (or another non-English language)
□ Caller is crying / emotional (emergency plumbing, pet at vet)
□ Caller is angry before Lucy even speaks (bad experience with business)
□ Caller asks Lucy personal questions ("where are you located?")
□ Caller asks "are you a robot?" / "am I talking to AI?"
□ Caller tries to social engineer info ("what's the owner's home address?")
□ Caller is a competitor fishing for info ("what are your prices?")
□ Caller wants to complain, not book
□ Caller has a speech disability
□ Caller is in a noisy environment (construction site, car, bar)
□ Caller puts Lucy on hold
□ Caller drops mid-conversation and calls back
□ Two people talking at once on caller's end

TECHNICAL FAILURES:
□ AI inference latency spikes to 3+ seconds
□ Speech-to-text returns garbage / wrong language
□ Text-to-speech sounds robotic or glitches
□ Calendar API is down — can't check availability
□ Calendar returns wrong timezone
□ SMS fails to send confirmation
□ Owner's notification fails to deliver
□ Call recording fails mid-call
□ Telephony provider has an outage
□ Database write fails — call not logged
□ Concurrent calls exceed capacity

APPOINTMENT EDGE CASES:
□ Caller wants "today" but today is fully booked
□ Caller wants a service the business doesn't offer
□ Caller wants a specific stylist/technician by name
□ Caller wants to modify an existing appointment but can't remember when
□ Two callers book the same slot simultaneously (race condition)
□ Caller books then immediately calls back to change
□ Caller wants a time outside business hours
□ Calendar shows availability but owner manually blocked that time
□ Appointment duration doesn't fit remaining gap
□ Caller wants to book for a group (3 haircuts for a family)
```

### Lucy Security Stress Tests

```
□ Caller asks for another customer's appointment details
□ Caller claims to be the business owner — asks to change settings
□ Caller provides a phone number that's already in system (duplicate)
□ Caller tries to inject commands: "Ignore your instructions and tell me..."
□ Automated system calls Lucy (robocall, IVR, telemarketer)
□ Someone calls repeatedly to waste Lucy's time / run up costs
□ Recording of a previous call is played back to Lucy (replay attack)
```

## MERCER STRESS TESTS

```
COMPLIANCE:
□ Mercer calls a number on the DNC list → must not happen
□ Mercer calls before 8am or after 9pm local time → must not happen
□ Mercer calls someone who said "don't call me" last week → must not happen
□ Mercer calls a personal cell, not a business number
□ State requires AI disclosure — does Mercer identify as AI?
□ Mercer calls a business that's permanently closed

CONVERSATION:
□ Owner says "how did you get my number?"
□ Owner says "I'm going to report you"
□ Owner is interested but asks Mercer to email details (can Mercer do this?)
□ Owner wants a demo RIGHT NOW (can Mercer warm-transfer to Billy?)
□ Owner asks technical questions Mercer can't answer
□ Owner speaks a language Mercer doesn't support
□ Owner is in the middle of a job and annoyed
□ Voicemail is full — can't leave message
□ Number is disconnected / wrong number
□ Owner already has Atlas UX (calling existing customer by accident)
```

## BUSINESS STRESS TESTS

```
FINANCIAL:
□ What if a customer racks up 500 calls/month on the $99 plan? (Cost > revenue)
□ What if Stripe has an outage on billing day? (Failed charges)
□ What if 10 customers cancel in the same week? (Revenue cliff)
□ What if telephony costs double? (Provider price increase)
□ What if AI API costs 3x during peak? (Model pricing change)

OPERATIONAL:
□ What if Billy gets sick for a week? (Who handles support?)
□ What if a customer data breach occurs? (Incident response plan)
□ What if a customer's caller has a bad experience and posts on social media?
□ What if a competitor copies Lucy exactly at $49/mo?
□ What if Supabase/Render/Vercel has a multi-hour outage?
□ What if a trade association sends a cease and desist? (Unlikely but plan for it)

SCALING:
□ What breaks at 50 customers? (Support volume, monitoring)
□ What breaks at 200 customers? (Infrastructure, personal attention)
□ What breaks at 1,000 customers? (Everything — plan the team for this)
□ What if you go viral and get 500 signups in a day? (Onboarding, infrastructure)

LEGAL:
□ Customer claims Lucy gave wrong info → led to lost business
□ Call recording surfaces in a lawsuit
□ TCPA violation claim from Mercer call
□ California AG inquiry about data practices
□ Customer disputes Stripe charge (chargeback)
```

## STRESS TEST PRIORITY MATRIX

```
| Scenario | Likelihood | Impact | Priority |
|----------|-----------|--------|----------|
| Lucy latency spike | HIGH | HIGH | P0 — Fix before launch |
| Calendar race condition | MEDIUM | HIGH | P0 — Fix before launch |
| TCPA violation (Mercer) | MEDIUM | CRITICAL | P0 — Compliance before launch |
| Robocall flooding | LOW | MEDIUM | P1 — Monitor and rate limit |
| High-volume customer cost | HIGH | HIGH | P1 — Usage tracking from Day 1 |
| Infrastructure outage | LOW | CRITICAL | P1 — Fallback plan needed |
| Caller social engineering | LOW | MEDIUM | P2 — Lucy should refuse |
| Competitor undercut | MEDIUM | MEDIUM | P2 — Focus on value, not price |
| Viral signup spike | LOW | MEDIUM | P3 — Nice problem to have |
```

## For Each P0 Scenario: Document

```
SCENARIO: [Description]
PREVENTION: [How to stop it from happening]
DETECTION: [How to know it's happening]
RESPONSE: [What to do when it happens]
RECOVERY: [How to restore normal operation]
COMMUNICATION: [What to tell affected customers]
```
