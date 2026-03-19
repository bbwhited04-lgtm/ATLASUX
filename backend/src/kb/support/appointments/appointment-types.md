---
title: "Setting Up Appointment Types"
category: "Appointments"
tags: ["appointment types", "services", "duration", "pricing", "configuration"]
related: ["booking-flow.md", "calendar-setup.md", "cancellations-rescheduling.md"]
---

# Setting Up Appointment Types

Every trade business offers different services, and each one takes a different amount of time. A furnace repair is not the same as a quick consultation. Appointment types let you define the services you offer so Lucy can match callers to the right one, block off the correct amount of time on your calendar, and keep your schedule running smoothly.

## What Are Appointment Types?

An appointment type is a service your business offers that can be booked over the phone. Each type has a name, a duration, and an optional price. When a caller asks Lucy for an appointment, she uses your appointment types to figure out which service fits and how long to block on your calendar.

Here are some examples by trade:

| Business | Appointment Type | Duration |
|----------|-----------------|----------|
| HVAC | Furnace repair | 2 hours |
| HVAC | AC tune-up | 1 hour |
| Salon | Haircut | 45 minutes |
| Salon | Color and cut | 2 hours |
| Plumber | Drain cleaning | 1 hour |
| Plumber | Free estimate | 30 minutes |
| General | Consultation | 30 minutes |

## Creating an Appointment Type

1. Log in to your Atlas UX dashboard.
2. Go to **Settings** then **Appointment Types**.
3. Click **Add Appointment Type**.
4. Fill in the details:
   - **Name:** What you call the service (for example, "Furnace Repair" or "Haircut").
   - **Duration:** How long the appointment takes. Be realistic -- if a furnace repair usually runs 2 hours, set it to 2 hours. Lucy uses this to block the right amount of time on your calendar.
   - **Price (optional):** If you want Lucy to mention pricing to callers, add it here. If you leave it blank, Lucy will not quote a price and can let the caller know that pricing depends on the job.
   - **Description (optional):** A short note about what the service includes. This helps Lucy give better answers when callers ask questions.
5. Click **Save**.

You can add as many appointment types as you need. Most businesses have between 3 and 10.

## How Lucy Offers the Right Service

When a caller describes what they need, Lucy listens and matches their request to one of your appointment types. Here is how that works in practice:

- A caller says "My furnace stopped working." Lucy recognizes this as a furnace repair and offers available 2-hour slots.
- A caller says "I just need a trim." Lucy matches this to a haircut and offers 45-minute slots.
- A caller says "I want to get a quote on some plumbing work." Lucy matches this to a free estimate and offers 30-minute windows.

Lucy does not just match keywords -- she understands the intent behind what the caller is saying. If someone says "My heater is making a weird noise," she still matches it to furnace repair even though they did not use that exact phrase.

For more on how Lucy handles calls and understands callers, see [How Lucy Works](../lucy/how-lucy-works.md) and [Call Handling](../lucy/call-handling.md).

## Editing and Removing Appointment Types

To change an appointment type:

1. Go to **Settings** then **Appointment Types**.
2. Click on the service you want to edit.
3. Update the name, duration, price, or description.
4. Click **Save**.

To remove a service you no longer offer, click **Delete** on that appointment type. Existing bookings for that service will not be affected -- only future bookings.

## Duration Tips

Getting your durations right makes a big difference in how well your schedule flows:

- **Be honest about how long things take.** If a job usually runs 90 minutes, do not set it to 60 and hope for the best. You will end up running late all day.
- **Include setup and cleanup time.** If you need 15 minutes to prep before a job, build that into the duration or use buffer time in your [Calendar Setup](calendar-setup.md).
- **Use your shortest realistic time.** If a drain cleaning takes 45 minutes to an hour, set it to 1 hour. It is better to have a few extra minutes between jobs than to overlap.

## Pricing Display

When you add a price to an appointment type, Lucy can share it with callers during the booking conversation. Here is how pricing works:

- **Price set:** Lucy will say something like "A furnace tune-up is $129 and takes about an hour. Would you like to book one?"
- **No price set:** Lucy will say something like "I can get you booked for a furnace repair. Pricing depends on the specifics, but we can go over that when the technician arrives."

You are in control. If your pricing varies a lot by job, leave the price blank and let your tech quote it on-site. If you have fixed-rate services, adding the price up front helps callers make a faster decision.

## What Happens During Booking

Once Lucy identifies the right service, the rest of the flow is automatic:

1. Lucy checks your calendar for open slots that fit the service duration.
2. She offers the caller two or three available times.
3. The caller picks one and confirms.
4. Lucy books it on your calendar with the service type, caller name, and phone number.
5. An SMS confirmation goes to the caller, and you get a Slack notification.

For the full step-by-step, see [How Appointment Booking Works](booking-flow.md).


---
## Media

> **Tags:** `google` · `calendar` · `appointments` · `scheduling` · `oauth` · `api`

### Official Resources
- [Official Documentation](https://developers.google.com/calendar)
- [Google Calendar API](https://developers.google.com/calendar)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### Video Tutorials
- [Google Calendar API Integration Tutorial](https://www.youtube.com/results?search_query=google+calendar+api+integration+tutorial+2025) — *Credit: Google on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
