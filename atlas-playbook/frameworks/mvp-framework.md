# MVP Framework — Atlas UX Edition

## Purpose
Define what Atlas UX's MVP is and — more importantly — what it ISN'T.
Kill scope creep. Ship what sells.

---

## THE MVP CUT TEST

For every feature, ask: "If I remove this, can a salon owner still pay me $99/mo?"

```
MUST HAVE (Lucy can't sell without it):
✅ Lucy answers inbound calls
✅ Lucy greets by business name
✅ Lucy takes messages when she can't help
✅ Lucy books appointments (basic calendar integration)
✅ Lucy sends SMS confirmation to caller
✅ Lucy notifies owner (text + dashboard)
✅ Call log in dashboard
✅ Business setup wizard (name, hours, greeting)
✅ Phone forwarding setup
✅ Stripe billing (signup, payment, manage subscription)
✅ 14-day free trial flow

NICE TO HAVE (ship within 30 days of first customers):
⬜ Mercer outbound calling for customers
⬜ Lucy handles cancellations/rescheduling
⬜ Weekly call report email
⬜ Custom greeting script editor
⬜ Multiple calendar integrations
⬜ SlackWorker channels

NOT MVP (kill it for now):
❌ Zoom integration
❌ Multi-language support
❌ Enterprise tier features
❌ API access for developers
❌ Mobile app
❌ AI call scoring/analytics
❌ Mercer self-serve campaigns for customers
❌ Advanced reporting/dashboards
❌ Integration marketplace
❌ White-label / reseller program
```

## MVP ANTI-PATTERNS (Don't Do These)

```
❌ "Let me just add one more feature before launch"
   → You've been building. It's time to sell.

❌ "I need the dashboard to look perfect"
   → First 10 customers won't care. They care about Lucy answering calls.

❌ "Let me build Mercer's self-serve before I sell"
   → YOU run Mercer manually first. Automate after you prove it works.

❌ "I should support every calendar app"
   → Google Calendar first. Add others when customers ask.

❌ "Enterprise tier needs to be ready"
   → Nobody's buying Enterprise at 0 customers. Focus on $99 Standalone.

❌ "I need a mobile app"
   → Text notifications + mobile-responsive dashboard. App later.
```

## SCOPE CONTROL

When you think about adding something, run this checklist:

```
□ Does a paying customer need this TODAY? (Not "might want" — NEED)
□ Have 3+ trial/paying users asked for this?
□ Does this increase conversion or retention?
□ Can I build this in < 1 week?
□ Will this break something that currently works?

IF LESS THAN 3 CHECKS: Don't build it.
Add it to a "Future" list and move on.
```

## MVP SUCCESS CRITERIA

```
Lucy MVP is successful when:
□ A salon owner can sign up and have Lucy answering within 15 minutes
□ Lucy answers a real customer call and books an appointment
□ The owner sees the booking in their dashboard and gets a text notification
□ This happens reliably, 100 times in a row, without intervention

That's it. Everything else is optimization.
```
