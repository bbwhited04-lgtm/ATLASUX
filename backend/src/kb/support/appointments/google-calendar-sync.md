---
title: "Google Calendar Sync"
category: "Appointments"
tags: ["Google Calendar", "OAuth", "sync", "two-way sync", "troubleshooting"]
related: ["calendar-setup.md", "booking-flow.md", "cancellations-rescheduling.md"]
---

# Google Calendar Sync

This guide walks you through connecting Google Calendar to Atlas UX, explains what gets synced, and covers common troubleshooting steps. Once connected, Lucy can read your schedule, book appointments directly onto your calendar, and keep everything in sync automatically.

## Connecting Google Calendar Step by Step

1. **Log in** to your Atlas UX dashboard.
2. Navigate to **Settings** then **Integrations**.
3. Click **Connect** next to Google Calendar.
4. A Google sign-in window will open. Choose the Google account where your business calendar lives.
5. Google will ask you to grant Atlas UX permission to "See, edit, share, and permanently delete all the calendars you can access using Google Calendar." This sounds broad, but Atlas UX only reads and writes to the specific calendar you select in the next step.
6. Click **Allow**.
7. You will be redirected back to Atlas UX with a green confirmation banner.
8. Go to **Settings** then **Calendar** and select which calendar Lucy should use.

That is it. The connection stays active until you manually disconnect.

## What the OAuth Flow Means (Plain English)

When you click "Connect," you are using a standard Google security process called OAuth. Here is what is actually happening in simple terms:

- Google asks you to confirm that Atlas UX can access your calendar.
- You log in with your own Google credentials. Atlas UX never sees your Google password.
- Google gives Atlas UX a secure token that lets us read and write calendar events on your behalf.
- You can revoke this access at any time from your Google account settings.

This is the same process used by thousands of apps that connect to Google. Your credentials stay with Google -- we only get a limited-access pass.

## What Gets Synced

Here is exactly what flows between Google Calendar and Atlas UX:

| Direction | What Syncs |
|-----------|-----------|
| Google to Atlas UX | Existing events (so Lucy knows when you are busy) |
| Google to Atlas UX | Event changes (if you move or cancel something, Lucy sees it) |
| Atlas UX to Google | New appointments booked by Lucy |
| Atlas UX to Google | Cancellations and reschedules made through Lucy |

### What does NOT sync

- Atlas UX does not pull your personal contacts from Google.
- Atlas UX does not access your Gmail, Google Drive, or any other Google service.
- Events on calendars you have not selected are ignored.

## Two-Way Sync Behavior

The sync between Atlas UX and Google Calendar works in both directions:

**Google to Atlas UX:** When you add, move, or delete an event on your Google Calendar, Atlas UX picks up the change. This means if you book a job yourself or block off time for an errand, Lucy will see it and avoid offering that slot to callers.

**Atlas UX to Google:** When Lucy books an appointment, it appears on your Google Calendar within moments. If a caller cancels or reschedules through Lucy, the calendar event is updated or removed automatically. See [Cancellations and Rescheduling](cancellations-rescheduling.md) for details on how that works.

**Sync timing:** Changes typically appear within a few seconds to a couple of minutes. It is not instant-to-the-millisecond, but it is fast enough that double-bookings are extremely rare. Lucy also does a real-time availability check at the moment of booking as an extra safeguard.

## Troubleshooting Sync Issues

### Calendar not showing up after connecting

- Make sure you selected the correct Google account during the OAuth step. If you have multiple Google accounts, it is easy to pick the wrong one.
- Go to **Settings** then **Calendar** and check that a calendar is selected. The connection might be active but no calendar is chosen yet.

### Events not syncing from Google

- Verify the event is on the calendar you selected in Atlas UX, not a different calendar on the same account.
- Check that the event is not on a shared calendar you do not own. Atlas UX syncs your own calendars, not calendars shared with you by others.
- Wait a couple of minutes. Sync is near real-time but not instant.

### Lucy booked an appointment but it is not on my Google Calendar

- Go to **Settings** then **Integrations** and check that Google Calendar still shows as connected. Occasionally, Google tokens expire and you need to reconnect.
- If the status shows "Disconnected," click **Connect** again to re-authorize. Your existing bookings will not be lost.

### "Access denied" or permission errors

- You may have revoked Atlas UX access from your Google account settings. Go to [Google Account Permissions](https://myaccount.google.com/permissions), find Atlas UX, and remove it. Then reconnect from the Atlas UX dashboard to get a fresh authorization.

### Duplicate events appearing

- This usually happens if you manually created a calendar event for the same appointment Lucy booked. Let Lucy handle bookings that come through calls, and only add events manually for jobs you booked outside of Atlas UX.

## Disconnecting Google Calendar

If you need to disconnect:

1. Go to **Settings** then **Integrations**.
2. Click **Disconnect** next to Google Calendar.
3. Existing appointments already on your calendar will stay there, but Lucy will no longer be able to check availability or book new appointments.

You can reconnect at any time by following the setup steps above.

For general calendar setup including availability hours and buffer time, see [Calendar Setup](calendar-setup.md). For the full booking process, see [How Appointment Booking Works](booking-flow.md).


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
