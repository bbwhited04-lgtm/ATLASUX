---
title: "SMS Confirmations Not Sending"
category: "Troubleshooting"
tags: ["SMS", "text messages", "twilio", "notifications", "delivery"]
related:
  - integrations/twilio-telephony
  - troubleshooting/common-errors
  - troubleshooting/getting-help
  - security-privacy/caller-data-handling
---

# SMS Confirmations Not Sending

When Lucy books an appointment, she sends an SMS confirmation to the customer with the date, time, and details. If those messages are not arriving, here is how to diagnose and fix the issue.

## Step 1: Check the Twilio Connection

SMS messages are sent through Twilio. A disconnected or misconfigured Twilio integration is the most common cause.

1. Go to **Settings > Integrations** in your Atlas UX dashboard.
2. Check the **Twilio** card. It should show "Connected" with a green indicator.
3. If it shows an error, click **Update Key** and re-enter your Twilio Account SID, Auth Token, and From Number.
4. Wait up to 5 minutes for the credential cache to refresh after updating.

If Twilio shows connected, move to Step 2.

## Step 2: Verify the Phone Number Format

SMS delivery can fail if phone numbers are not formatted correctly.

- Phone numbers should be in E.164 format: `+1XXXXXXXXXX` for US numbers (country code + 10 digits).
- Common mistakes include missing the `+1` prefix or including dashes and spaces.
- Check that your **From Number** in Settings > Integrations matches the format of the Twilio number assigned to your account.

If the customer provided their number verbally to Lucy, check that Lucy captured it correctly in the appointment record.

## Step 3: Check SMS Templates

Atlas UX uses templates for SMS messages. If a template is misconfigured or empty, messages may fail silently.

1. Go to **Settings > Notifications** or **Settings > SMS Templates** (depending on your plan).
2. Verify that your appointment confirmation template contains the correct merge fields (customer name, date, time).
3. Make sure the template is not blank.

## Step 4: Carrier Filtering Issues

Mobile carriers (AT&T, Verizon, T-Mobile) have aggressive spam filters that can block messages from new or low-volume numbers.

**Signs of carrier filtering:**
- Messages send successfully from your dashboard but the customer never receives them.
- Some customers receive messages but others do not (different carriers).

**What to do:**
- Ensure your Twilio number is registered for A2P (Application-to-Person) messaging. Twilio provides guidance on this in their console.
- Keep SMS content professional and avoid all-caps, excessive links, or phrases that look like spam.
- If you recently got a new Twilio number, it may take a few days for carrier trust scores to build up.

## Step 5: Check the Audit Trail

Atlas UX logs SMS send attempts and their results.

1. Go to **Dashboard > Audit Log**.
2. Filter for SMS-related events.
3. Look for entries with "SMS delivery failed" or Twilio error codes.
4. Common Twilio error codes:
   - **21211** -- Invalid phone number. The customer's number is not valid.
   - **21608** -- Unverified number. Your Twilio account may be in trial mode and can only send to verified numbers.
   - **30007** -- Message filtered by carrier. See Step 4 above.

## Step 6: Send a Test Message

1. Go to your dashboard and find a recent appointment.
2. Use the **Resend Confirmation** option (if available) to trigger a new SMS.
3. Try sending to your own phone number as a test.
4. If the test arrives but customer messages do not, the issue is likely carrier filtering or an incorrect customer number.

## Step 7: Contact Support

If you have checked all the above and SMS still is not working:

1. Note which step you got stuck on.
2. Include the customer phone number (or a test number) that is not receiving messages.
3. Include any Twilio error codes from the audit log.
4. See [Getting Help](getting-help.md) for how to reach us.

## Quick Checklist

- [ ] Twilio integration shows "Connected"
- [ ] From Number is in E.164 format (+1XXXXXXXXXX)
- [ ] SMS templates are configured and not empty
- [ ] Twilio account is not in trial mode (or target numbers are verified)
- [ ] A2P registration is complete for your Twilio number
- [ ] Test SMS to your own phone arrives successfully

For related issues, see [Lucy Not Answering](lucy-not-answering.md) (if calls are also affected) or [Common Errors](common-errors.md) for specific error messages.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
