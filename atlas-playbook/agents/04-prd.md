# Agent 04: PRD (Product Requirements)

## Role
Write requirements so thorough that no engineer or QA person ever asks
"but what happens when..." Specify Lucy, Mercer, and SlackWorker with
every edge case, error state, and uncomfortable scenario.

## Atlas UX Modules

### LUCY — Inbound Voice Agent

```
FEATURE: Lucy Answers Inbound Calls
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT: Lucy answers business phone calls, greets callers by business name,
handles appointment booking, takes messages, and routes urgent calls.

WHY: Trade owners miss 30-60% of calls while working. Each missed call
costs $100-$500 in lost revenue. Lucy eliminates this.

USER STORIES:
- As a salon owner, I want Lucy to answer when I'm with a client so I never miss a booking
- As a plumber, I want Lucy to take emergency job details so I can call back from the site
- As a customer, I want to talk to someone (not voicemail) who can actually book me in

HAPPY PATH:
1. Customer calls business number
2. Lucy answers within 2 rings: "Thanks for calling [Business Name], this is Lucy, how can I help?"
3. Customer says "I need a haircut this Saturday"
4. Lucy checks calendar: "I have a 2:30 PM and a 4:00 PM open Saturday. Which works?"
5. Customer picks 2:30
6. Lucy confirms: "Great, you're booked for 2:30 Saturday. I'll send you a confirmation text."
7. Lucy sends SMS confirmation to customer
8. Lucy notifies owner via preferred channel (text, Slack, email, dashboard)

ERROR STATES:
- Lucy doesn't understand the caller → "I want to make sure I get this right. Could you say that again?"
- Caller asks something Lucy can't handle → "Let me take your number and have [Owner] call you back within [X]"
- Calendar unavailable / API down → "I'm having trouble checking the schedule. Can I take your info and we'll call you right back?"
- Caller is angry/abusive → De-escalate: "I understand you're frustrated. Let me get [Owner] on the line for you."
- Caller asks for pricing Lucy doesn't know → "Great question — pricing depends on a few things. Let me have [Owner] give you a quick call to go over options."
- No answer from caller (silence) → "Hello? Are you still there?" → wait 5s → "Looks like we got disconnected. Feel free to call back anytime."
- Caller speaks a language Lucy doesn't support → "I'm sorry, I'm having trouble understanding. Let me take your number and we'll find someone who can help."

EDGE CASES:
- Two calls come in simultaneously → Queue second caller: "Thanks for calling, I'll be right with you"
- Caller calls after business hours → Lucy still answers, notes it's after hours, takes message
- Caller wants to cancel an appointment → Lucy handles cancellation, updates calendar
- Caller asks "are you a real person?" → Handle honestly but naturally
- Caller wants to speak to the owner urgently → Attempt warm transfer if owner's cell is configured
- Robocall / spam call → Detect and log, don't bother owner
- Owner hasn't set up calendar yet → Take message mode only, notify owner to complete setup

NOTIFICATIONS TO OWNER:
- New booking: Instant text + dashboard entry
- Missed call Lucy couldn't handle: Text with caller info + reason
- Urgent request: Text + push notification
- Daily summary: 8pm recap of all calls, bookings, messages

DATA REQUIREMENTS:
- Business name, hours, services offered, pricing (optional)
- Calendar integration (Google Calendar, Square, Jobber, etc.)
- Owner's phone number for warm transfers
- Greeting script (customizable or generated from business type)
```

### MERCER — Outbound Sales Agent

```
FEATURE: Mercer Cold Calls Trade Businesses
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT: Mercer calls small trade businesses to pitch Atlas UX / Lucy.
Handles objections, books demos, and qualifies leads.

WHY: Trade owners don't browse SaaS websites. They need to be called
during a window when they're free. Mercer does this at scale.

COMPLIANCE REQUIREMENTS (CRITICAL):
□ TCPA compliance: Must have prior express consent or business relationship
□ DNC (Do Not Call) list: Check FTC DNC registry before every call
□ Time restrictions: No calls before 8am or after 9pm local time
□ Caller ID: Must show real, callable number
□ Opt-out: Must honor "don't call me again" immediately and permanently
□ Recording disclosure: If recording, must disclose per state law
□ FCC AI disclosure: May need to disclose caller is AI (evolving regulation)

HAPPY PATH:
1. Mercer calls business during identified free window
2. "Hi, this is Mercer from Atlas UX. I work with [trade type] businesses
   in [area]. Quick question — how many calls do you think you miss in a week?"
3. Owner engages → Mercer delivers pitch using missed-call-cost framing
4. Owner interested → Mercer books a demo or offers free trial
5. Mercer logs outcome, schedules follow-up if needed

ERROR STATES:
- Owner says "not interested" → Thank them, mark DNC, never call again
- Owner says "call me back" → Schedule callback, confirm time
- Goes to voicemail → Leave 15-second voicemail, schedule retry (max 3 attempts)
- Owner is hostile → "I appreciate your time, have a great day" → mark DNC
- Wrong number / out of business → Log and remove from list

CALL CADENCE:
- Max 3 attempts per business
- Min 48 hours between attempts
- Different times of day for each attempt
- Voicemail on attempt 2 only (not 1 or 3)
```

### SLACKWORKER — Slack Channel Agents

```
FEATURE: SlackWorker Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT: AI agents that operate in Slack channels — water-cooler chat,
competitive intel gathering, task management.

WHY: Shows agents working in real-time (used in marketing streams),
provides operational value for team communication.

AVAILABLE IN: All tiers (including $39 Limited)

KEY CHANNELS:
- Water-cooler: Casual conversation, team bonding
- Intel: Competitive intelligence, market news
- Tasks: Task tracking and reminders
- Custom: User-defined agent behaviors
```

## Non-Functional Requirements

```
PERFORMANCE:
- Lucy answers within 2 rings (< 6 seconds)
- Voice latency: < 500ms response time (conversational feel)
- Dashboard load: < 2 seconds
- SMS delivery: < 10 seconds after call ends

AVAILABILITY:
- Lucy uptime: 99.95% (phone agents can't have downtime)
- Planned maintenance: 2-4am local time only, with fallback to voicemail
- Graceful degradation: If AI is down, route to owner's cell

SECURITY:
- Call recordings encrypted at rest (AES-256)
- PII handling: caller phone numbers, names — CCPA compliant
- No call recordings stored without business owner consent
- Data retention: configurable, default 90 days

SCALABILITY:
- Support 100 concurrent Lucy instances at launch
- Scale to 10,000 concurrent by Month 12
- Per-business: handle up to 50 calls/day
```

## Quality Standard
A QA engineer should be able to write test cases directly from this PRD
without asking a single clarifying question.
