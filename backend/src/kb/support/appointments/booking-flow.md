---
title: "How Appointment Booking Works"
category: "Appointments"
tags: ["booking", "appointments", "Lucy", "SMS", "calendar", "Slack"]
related: ["calendar-setup.md", "appointment-types.md", "cancellations-rescheduling.md"]
---

# How Appointment Booking Works

Lucy handles appointment booking from start to finish so you never miss a job. When a customer calls, Lucy walks them through scheduling -- checking your availability, offering open time slots, confirming the booking, and notifying you instantly. Here is how the whole process works.

## Step 1: The Customer Asks for an Appointment

When someone calls your business, Lucy greets them with your custom welcome message and asks how she can help. If the caller wants to schedule a service, Lucy kicks off the booking flow automatically. She knows your business type and the services you offer, so she asks the right follow-up questions -- like what kind of work they need done, how urgent it is, and when they are available.

For more on how Lucy handles calls overall, see [How Lucy Works](../lucy/how-lucy-works.md).

## Step 2: Lucy Checks Your Availability

Lucy pulls your real-time availability from your connected calendar. She knows which time slots are open and which are already booked, so she never double-books you. If you have blocked off lunch breaks, personal time, or travel days, Lucy respects those too.

To make this work, you need to connect your calendar first. See [Calendar Setup](calendar-setup.md) for instructions.

## Step 3: Lucy Offers Available Times

Based on what the caller needs and your open slots, Lucy suggests two or three available times. She keeps it conversational -- something like "I have Tuesday at 10 AM or Wednesday at 2 PM. Which works better for you?" If neither works, she offers more options until the caller finds a fit.

Lucy also factors in the service duration. A 2-hour furnace repair gets a different set of available windows than a 30-minute consultation. You control these durations in your [Appointment Types](appointment-types.md) settings.

## Step 4: The Caller Confirms

Once the caller picks a time, Lucy confirms the details back to them: the service type, the date and time, and your business address if it is an in-person visit. She asks the caller to confirm, and only locks in the booking once they say yes.

## Step 5: SMS Confirmation Goes Out

Right after the booking is confirmed, Lucy sends the caller an SMS confirmation with the appointment details. This gives them a written record they can refer back to -- no more "wait, when was that again?" moments.

The text includes the date, time, service type, and your business name. For details on how SMS confirmations work and how to customize them, see [SMS Confirmations](../phone-sms/sms-confirmations.md).

## Step 6: It Hits Your Calendar

The confirmed appointment is added directly to your connected calendar. You will see it show up with the customer's name, phone number, service type, and any notes from the call. This means your schedule stays accurate whether you booked the job yourself or Lucy did it for you.

If you use Google Calendar, the sync happens in near real-time. See [Google Calendar Sync](google-calendar-sync.md) for specifics on how this works.

## Step 7: You Get Notified on Slack

As soon as the booking is locked in, Lucy sends a notification to your Slack channel with all the details: who called, what they need, and when the appointment is. This way you and your team know about new jobs the moment they are booked, even if you are out on a call.

For setup and customization of Slack alerts, see [Slack Alerts](../notifications/slack-alerts.md).

## What Happens After Hours?

Lucy works 24/7. If a customer calls at 9 PM on a Saturday wanting to book a Monday appointment, Lucy handles it the same way. The booking goes on your calendar, the SMS goes out, and the Slack notification fires -- all without you lifting a finger.

## Quick Summary

| Step | What Happens |
|------|-------------|
| 1 | Customer calls and asks for an appointment |
| 2 | Lucy checks your calendar for open slots |
| 3 | Lucy offers available times |
| 4 | Caller picks a time and confirms |
| 5 | SMS confirmation sent to the caller |
| 6 | Appointment added to your calendar |
| 7 | Slack notification sent to you and your team |

That is the full booking flow. Once your calendar is connected and your services are configured, Lucy takes care of the rest. You focus on the work -- she handles the phone.


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
