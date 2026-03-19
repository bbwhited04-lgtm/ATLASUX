---
title: "Lucy Isn't Answering Calls"
category: "Troubleshooting"
tags: ["lucy", "calls", "phone", "not answering", "diagnosis"]
related:
  - integrations/twilio-telephony
  - integrations/elevenlabs-voice
  - troubleshooting/common-errors
  - troubleshooting/getting-help
---

# Lucy Isn't Answering Calls

If Lucy is not picking up when customers call your business number, do not panic. This is almost always a configuration or connection issue that you can diagnose in a few minutes. Walk through the steps below in order.

## Step 1: Check Your Phone Number Setup

The most common cause is a phone number that is not properly linked to Lucy's voice agent.

1. Log in to your Atlas UX dashboard.
2. Go to **Settings > Phone**.
3. Confirm that a phone number is displayed and marked as **Active**.
4. If no number is shown, your Twilio number may not have been assigned yet. See [Twilio Telephony](../integrations/twilio-telephony.md) for setup instructions.

If a number is listed but calls still are not getting through, move to Step 2.

## Step 2: Verify the Twilio Connection

Lucy's phone system runs on Twilio. If the Twilio credentials are invalid or expired, calls cannot reach Lucy.

1. Go to **Settings > Integrations**.
2. Check the **Twilio** integration card. It should show a green "Connected" status.
3. If it shows "Disconnected" or "Error," click **Update Key** and re-enter your Twilio Account SID, Auth Token, and From Number.
4. After updating, wait up to 5 minutes for the credential cache to refresh.

If Twilio shows connected but calls still fail, move to Step 3.

## Step 3: Check the ElevenLabs Voice Agent

Lucy's voice is powered by ElevenLabs. If the voice agent is not properly configured, calls may connect but Lucy will not speak.

1. Go to **Settings > Integrations** and verify the **ElevenLabs** integration shows "Connected."
2. If disconnected, add your ElevenLabs API key. See [ElevenLabs Voice](../integrations/elevenlabs-voice.md).
3. Check your Atlas UX dashboard for any error banners related to voice agent configuration.

## Step 4: Verify Business Hours Configuration

Lucy may be configured to only answer during certain hours.

1. Go to **Settings > Business Hours**.
2. Check that your hours of operation are set correctly.
3. Verify the time zone is correct for your location. A wrong time zone can make Lucy think it is after hours when it is not.
4. If you want Lucy to answer 24/7, ensure no hour restrictions are set.

## Step 5: Test With a Call

Make a test call from a different phone (not the one linked to your account):

1. Dial your Atlas UX business number.
2. Wait at least 4 rings before concluding it is not working.
3. If you hear ringing but no answer, the issue is likely between Twilio and ElevenLabs.
4. If you get a carrier error ("number not in service"), the Twilio number may need to be re-provisioned.

## Step 6: Check the Audit Trail

Atlas UX logs all system activity. The audit trail can reveal what is happening behind the scenes.

1. Go to **Dashboard > Audit Log**.
2. Look for recent entries related to incoming calls or ElevenLabs webhook errors.
3. Error-level entries (marked in red) will indicate what failed.

See [Audit Trail](../security-privacy/audit-trail.md) for more on reading the audit log.

## Step 7: Contact Support

If you have worked through all the steps above and Lucy is still not answering:

1. Note which step failed or seemed abnormal.
2. Take a screenshot of your Settings > Integrations page showing connection statuses.
3. Contact support with this information. See [Getting Help](getting-help.md) for how to reach us and what details to include.

## Quick Checklist

- [ ] Phone number is assigned and active
- [ ] Twilio integration shows "Connected"
- [ ] ElevenLabs integration shows "Connected"
- [ ] Business hours and time zone are correct
- [ ] Test call from an external phone rings through
- [ ] Audit log does not show critical errors

Most issues are resolved at Steps 1-3. If your integrations show connected and calls still fail, our support team can dig into the server-side logs to find the root cause.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
