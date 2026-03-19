---
title: "Calendar Setup"
category: "Appointments"
tags: ["calendar", "Google Calendar", "availability", "double-booking", "setup"]
related: ["google-calendar-sync.md", "booking-flow.md", "appointment-types.md"]
---

# Calendar Setup

Connecting your calendar is the first step to letting Lucy book appointments for you. Once connected, Lucy can see your real-time availability, avoid double-bookings, and add new appointments directly to your schedule. This guide covers which calendars are supported, how to connect them, and how to set your availability so Lucy books the right slots.

## Supported Calendars

Atlas UX currently supports **Google Calendar**. This is the most widely used calendar among small businesses and trade shops, and it gives Lucy full read-and-write access to your schedule.

If you use Google Workspace (formerly G Suite) for your business, that works too -- Lucy connects to whatever Google account you authorize.

For a detailed walkthrough of the Google Calendar connection process, see [Google Calendar Sync](google-calendar-sync.md).

## How to Connect Your Calendar

1. Log in to your Atlas UX dashboard.
2. Go to **Settings** then **Integrations**.
3. Find **Google Calendar** and click **Connect**.
4. You will be redirected to Google's sign-in page. Choose the Google account that has your business calendar.
5. Grant Atlas UX permission to view and manage your calendar events.
6. Once authorized, you will be redirected back to Atlas UX with a confirmation message.

The whole process takes about 30 seconds. You only need to do it once -- your connection stays active until you disconnect it.

## Choosing Which Calendar Lucy Uses

If your Google account has multiple calendars (for example, "Work," "Personal," and "Holidays"), you can choose which one Lucy reads from and writes to. In most cases, you want Lucy on your primary business calendar.

To select your calendar:

1. After connecting, go to **Settings** then **Calendar**.
2. You will see a list of all calendars on your Google account.
3. Select the calendar you want Lucy to manage.
4. Click **Save**.

Lucy will only check availability and create bookings on the calendar you select. Your personal calendar stays private.

## Setting Your Availability

Your calendar events tell Lucy when you are busy, but you also need to set your general business hours so she knows when to offer appointments. This prevents callers from booking a 6 AM haircut or a Sunday plumbing job (unless you want that).

To set your hours:

1. Go to **Settings** then **Availability**.
2. Set your working hours for each day of the week.
3. Mark any days you do not work as **Off**.
4. Click **Save**.

Lucy combines your business hours with your actual calendar events. If you work Monday through Friday, 8 AM to 5 PM, but you have a dentist appointment Tuesday at 2 PM, Lucy will not offer that slot.

## Avoiding Double-Bookings

Double-bookings are one of the biggest headaches for trade businesses. Lucy prevents them by checking your calendar in real time before offering any time slot. Here is how it works:

- When a caller asks for an appointment, Lucy reads your calendar at that moment.
- She only offers slots that are free according to both your business hours and your existing events.
- Once a caller confirms a time, Lucy writes the event to your calendar immediately, blocking that slot for anyone else.
- If two people call at nearly the same time, the first confirmed booking wins. Lucy will offer the second caller different options.

This means your calendar is always the single source of truth. If you manually add an event -- a personal errand, a job you booked yourself, anything -- Lucy will see it and work around it.

## Buffer Time Between Appointments

If you need travel time or a break between jobs, you can set a buffer in your availability settings. For example, a 30-minute buffer means Lucy will not book back-to-back appointments. She will leave a gap so you can get from one job to the next.

To set buffer time:

1. Go to **Settings** then **Availability**.
2. Find **Buffer time between appointments**.
3. Set your preferred buffer (15, 30, or 60 minutes).
4. Click **Save**.

## Tips for a Clean Schedule

- **Keep your calendar up to date.** If you book a job over text or in person, add it to your calendar so Lucy does not offer that slot.
- **Use your business hours.** Do not rely only on calendar events. Set your hours so Lucy has a clear picture of when you are available.
- **Check your calendar selection.** Make sure Lucy is connected to the right calendar, especially if you have multiple Google calendars.

Once your calendar is connected and your availability is set, Lucy handles booking automatically. See [How Appointment Booking Works](booking-flow.md) for the full end-to-end flow.


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
