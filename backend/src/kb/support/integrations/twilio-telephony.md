---
title: "Twilio Telephony & SMS"
category: "Integrations"
tags: ["twilio", "phone", "SMS", "calls", "telephony", "phone number"]
related:
  - integrations/elevenlabs-voice
  - troubleshooting/lucy-not-answering
  - troubleshooting/sms-not-sending
  - security-privacy/caller-data-handling
---

# Twilio Telephony & SMS

Atlas UX uses **Twilio** to power all phone calls and SMS text messages. Twilio is a cloud communications platform trusted by hundreds of thousands of businesses worldwide. When a customer calls your business number and Lucy picks up, or when an SMS confirmation is sent after booking, Twilio is making it happen.

## How Your Business Number Works

When you sign up for Atlas UX, your business gets a dedicated phone number through Twilio. This is the number your customers call to reach Lucy. Here is how it works:

1. **Incoming calls** -- When someone dials your number, Twilio routes the call to Lucy's voice agent powered by [ElevenLabs](elevenlabs-voice.md). Lucy answers, has a natural conversation, and can book appointments or take messages.
2. **Outbound SMS** -- After Lucy books an appointment or takes a message, Twilio sends SMS confirmations to your customer with the details.
3. **Number portability** -- If you already have a business number, ask our team about porting it to Twilio so your existing customers do not have to learn a new number.

Your Twilio number is linked directly to your Atlas UX tenant, so calls and messages are always routed to the right business.

## Call Quality

Twilio operates a global network of carrier connections, which means:

- **Reliable connections** -- Calls are routed through Twilio's redundant infrastructure with carrier-grade reliability.
- **Clear audio** -- Twilio uses high-quality audio codecs so your callers hear Lucy clearly, and Lucy hears them clearly.
- **24/7 availability** -- Your number is always active. Lucy answers at 2 AM just as professionally as she does at 2 PM.

## SMS Delivery

SMS messages sent through Atlas UX are delivered via Twilio's messaging infrastructure:

- **Appointment confirmations** -- After Lucy books a call, the customer gets an SMS with the date, time, and any details.
- **Delivery tracking** -- Twilio tracks whether messages were delivered, and Atlas UX logs the result.
- **Carrier compatibility** -- Twilio works with all major US carriers (AT&T, Verizon, T-Mobile) and most international carriers.

If SMS messages are not arriving, see [SMS Not Sending](../troubleshooting/sms-not-sending.md) for troubleshooting steps.

## Phone Number Management

Your phone number is managed through your Atlas UX dashboard:

- **View your number** -- Go to Settings > Phone to see your assigned business number.
- **Update call routing** -- Configure business hours, after-hours behavior, and human escalation numbers.
- **Multiple numbers** -- Enterprise plans can support multiple numbers for different locations or departments.

You do not need to log into Twilio directly. All management happens through Atlas UX.

## How Twilio Credentials Work

Atlas UX connects to Twilio using three credentials: an Account SID (your account identifier), an Auth Token (for secure API access), and a From Number (your business number). These credentials are:

- **Encrypted at rest** using AES-256-GCM encryption via our credential resolver. See [API Keys](api-keys.md) for more on credential management.
- **Per-tenant isolated** -- Your Twilio credentials are separate from every other Atlas UX customer.
- **Cached securely** -- Credentials are cached in memory for 5 minutes to keep call handling fast, then refreshed from the encrypted store.

## Frequently Asked Questions

**Can I use my existing phone number?**
Yes, in most cases. Number porting from your current carrier to Twilio is supported. Contact our team to start the process.

**Are calls recorded?**
See [Caller Data Handling](../security-privacy/caller-data-handling.md) for details on what Lucy captures during calls.

**What happens if Twilio has an outage?**
Twilio has a strong uptime record, but if issues occur, calls can fail over to your escalation number. Check [Lucy Not Answering](../troubleshooting/lucy-not-answering.md) for diagnostic steps.

**Do SMS messages cost extra?**
SMS is included in your Atlas UX plan. Standard messaging rates apply within the US. International SMS may incur additional charges.

**Can customers text my number?**
Inbound SMS support depends on your plan and configuration. Contact support for setup details via [Getting Help](../troubleshooting/getting-help.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
