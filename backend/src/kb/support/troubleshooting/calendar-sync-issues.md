---
title: "Calendar Sync Issues"
category: "Troubleshooting"
tags: ["calendar", "Google Calendar", "sync", "appointments", "OAuth", "time zone"]
related:
  - troubleshooting/common-errors
  - troubleshooting/getting-help
  - integrations/api-keys
---

# Calendar Sync Issues

Lucy books appointments directly into your calendar during phone calls. If appointments are not showing up, are appearing at the wrong time, or your calendar seems disconnected, follow the steps below to get things working again.

## Step 1: Check the Calendar Connection

Atlas UX connects to Google Calendar using OAuth -- a secure authorization method where you sign in with your Google account and grant Atlas UX permission to read and write calendar events.

1. Go to **Settings > Integrations** in your Atlas UX dashboard.
2. Find the **Google Calendar** card.
3. If it shows "Connected," your calendar link is active.
4. If it shows "Disconnected" or "Requires Reauthorization," click **Reconnect** and sign in with your Google account again.

Google OAuth tokens can expire or be revoked, which is the most common reason for a dropped connection.

## Step 2: Reconnect Google Calendar

If the connection dropped, here is how to re-establish it:

1. Click **Reconnect** on the Google Calendar integration card.
2. Choose the Google account that has the calendar you want Lucy to use.
3. On the Google permissions screen, make sure you grant **all requested permissions**, including:
   - View and edit events on all your calendars
   - See your primary Google Calendar address
4. Click **Allow** to complete the connection.
5. Return to Atlas UX. The integration should now show "Connected."

**Common mistake:** Choosing the wrong Google account. If you have a personal and a business Google account, make sure you select the one with your business calendar.

## Step 3: Check OAuth Permissions

If you reconnected but sync still is not working, Google may have partial permissions:

1. Go to [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
2. Find **Atlas UX** in the list of apps with access to your account.
3. Click on it and verify it has calendar read/write permissions.
4. If permissions look wrong, click **Remove Access**, then reconnect from Atlas UX (Step 2).

Removing and re-granting access forces a clean OAuth handshake that often fixes permission issues.

## Step 4: Force a Calendar Refresh

Sometimes the sync just needs a nudge:

1. Go to **Settings > Integrations > Google Calendar**.
2. If a **Refresh** or **Sync Now** button is available, click it.
3. Wait 1-2 minutes, then check your Google Calendar for recent appointments.
4. If new appointments booked by Lucy during calls are missing, try booking a test appointment through the dashboard to see if it appears.

## Step 5: Check Time Zone Settings

Time zone mismatches are a common source of confusion. An appointment booked for 2 PM might show up at 5 PM or 11 AM if time zones do not match.

1. In Atlas UX, go to **Settings > Business Profile** and check your time zone.
2. In Google Calendar, go to **Settings > General > Time Zone** and confirm it matches.
3. If they do not match, update one or both so they are consistent.

Lucy uses your Atlas UX time zone when booking. If your Google Calendar is set to a different zone, the event will appear shifted.

## Step 6: Double-Booking Prevention

Atlas UX checks your calendar for conflicts before Lucy books an appointment. If customers are reporting double-bookings:

1. Verify that the calendar Lucy is connected to is the same one you use for manual bookings.
2. If you manage availability on a separate calendar, make sure both are visible to Atlas UX.
3. Check that manually-added events are not marked as "Free" in Google Calendar -- Lucy looks for "Busy" time blocks to avoid conflicts.

## Step 7: Contact Support

If calendar sync still is not working after these steps:

1. Note which step failed or seemed off.
2. Check the audit log for calendar-related errors (look for "Calendar access denied" entries).
3. Include your Google account email (the one connected to Atlas UX) when contacting support.
4. See [Getting Help](getting-help.md) for contact details.

## Quick Checklist

- [ ] Google Calendar integration shows "Connected"
- [ ] Correct Google account is linked
- [ ] Full calendar permissions are granted
- [ ] Time zones match between Atlas UX and Google Calendar
- [ ] Manual events are marked as "Busy" (not "Free")
- [ ] Test appointment booked through dashboard appears in Google Calendar

For specific error messages like "Calendar access denied," see [Common Errors](common-errors.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
