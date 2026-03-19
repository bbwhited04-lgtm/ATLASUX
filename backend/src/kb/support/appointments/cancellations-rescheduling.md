---
title: "Cancellations and Rescheduling"
category: "Appointments"
tags: ["cancellations", "rescheduling", "calendar", "SMS", "policy"]
related: ["booking-flow.md", "calendar-setup.md", "google-calendar-sync.md"]
---

# Cancellations and Rescheduling

Things come up. Customers need to move appointments, and sometimes they need to cancel altogether. Lucy handles both so you do not have to take those calls yourself. This guide covers how callers cancel or reschedule, how to set your cancellation policy, and what happens to your calendar and notifications when changes are made.

## How Callers Cancel an Appointment

When a customer calls back to cancel, Lucy recognizes them and pulls up their upcoming appointment. Here is how the conversation typically goes:

1. The caller says something like "I need to cancel my appointment" or "I can't make it on Tuesday."
2. Lucy confirms which appointment they are referring to (if they have more than one upcoming).
3. Lucy asks them to confirm the cancellation.
4. Once confirmed, Lucy removes the appointment from your calendar, sends the caller an SMS confirming the cancellation, and notifies you on Slack.

The whole thing takes under a minute. Your calendar opens back up immediately, so that slot is available for other callers.

For details on how SMS notifications work, see [SMS Confirmations](../phone-sms/sms-confirmations.md). For Slack alerts, see [Slack Alerts](../notifications/slack-alerts.md).

## How Callers Reschedule

Rescheduling works the same way as booking a new appointment, but Lucy handles the old one at the same time:

1. The caller says they need to move their appointment.
2. Lucy pulls up their existing booking and confirms which one they want to change.
3. Lucy checks your calendar for new available times, just like the original booking flow.
4. She offers open slots and the caller picks one.
5. Once confirmed, Lucy updates the event on your calendar -- the old time is freed up and the new time is blocked.
6. The caller gets an SMS with the updated appointment details.
7. You get a Slack notification about the change.

Lucy does not delete the old appointment and create a new one separately. She updates the existing booking so your records stay clean and you can see it was a reschedule, not a brand-new booking.

For the full original booking flow, see [How Appointment Booking Works](booking-flow.md).

## Setting Your Cancellation Policy

You can configure how Lucy handles cancellations based on your business needs. Go to **Settings** then **Appointments** then **Cancellation Policy** to set these options:

### Cancellation window

Set a minimum notice period for cancellations. Common options:

- **No restriction** -- Callers can cancel any time, even last-minute.
- **24 hours** -- Callers must cancel at least 24 hours before the appointment.
- **48 hours** -- Callers must cancel at least 48 hours before.

If a caller tries to cancel inside your window, Lucy will let them know the policy. For example: "Your appointment is tomorrow at 10 AM, and our cancellation policy requires 24 hours notice. Would you like me to take a message for the owner instead?"

### Reschedule limits

You can allow unlimited reschedules or set a limit (for example, one reschedule per appointment). This prevents callers from moving the same appointment around five times.

### Policy message

Add a short policy message that Lucy reads to callers when they cancel or reschedule. Keep it friendly -- something like "We ask for 24 hours notice for cancellations so we can offer the slot to other customers" goes over much better than a formal legal disclaimer.

## Automatic Calendar Updates

When a cancellation or reschedule is confirmed, your calendar updates automatically:

- **Cancellation:** The calendar event is removed. The time slot becomes available for new bookings immediately.
- **Reschedule:** The calendar event moves to the new date and time. The old slot opens up and the new slot is blocked.

This works through the same two-way sync with Google Calendar described in [Google Calendar Sync](google-calendar-sync.md). Changes typically appear within seconds.

## SMS Notifications for Changes

Every cancellation and reschedule triggers an SMS to the caller so they have a written record:

- **Cancellation SMS:** "Your [service type] appointment on [date] at [time] has been cancelled. Call us anytime to rebook."
- **Reschedule SMS:** "Your [service type] appointment has been moved to [new date] at [new time]. See you then!"

These messages go out automatically. You do not need to send them yourself.

## Slack Notifications

Your team gets a Slack alert for every change, so no one is caught off guard:

- **Cancellation alert:** Includes the customer name, the service that was cancelled, and the time slot that opened up.
- **Reschedule alert:** Includes the old time, the new time, and the customer details.

This keeps your whole team in the loop, especially if you have a dispatcher or office manager watching the schedule. For setup, see [Slack Alerts](../notifications/slack-alerts.md).

## Handling No-Shows

If a customer simply does not show up and does not call to cancel, the appointment stays on your calendar. Lucy does not automatically mark no-shows -- that is something you handle on your end. You can note it in your records so you have a history if the same customer no-shows again.

## Tips for Reducing Cancellations

- **Send reminders.** SMS confirmations at booking time help, but a day-before reminder is even better. Lucy sends these automatically based on your settings.
- **Set a reasonable policy.** A 24-hour cancellation window is standard for most trades. It gives you time to fill the slot without being too rigid for customers.
- **Make rescheduling easy.** Customers who can reschedule easily are less likely to just no-show. Lucy makes it a one-call process.


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
