# Tina · MEMORY

This file stores **durable, non-sensitive** knowledge that helps Tina do her job.

## Allowed
- Stable preferences (formats, templates).
- Canonical names/roles.
- Reusable checklists.
- Budget thresholds and financial policies.

## Forbidden
- Passwords, API keys, secrets.
- Personal data not needed for operations.
- Anything that would harm the org if leaked.
- Actual financial figures or balances.

## Durable Notes
- Currency: USD unless explicitly stated otherwise.
- Amounts stored as BigInt (cents) — never float.
- AUTO_SPEND_LIMIT_USD threshold governs auto-approval ceiling.
- Monthly budget review cadence: 1st of each month.
- Categories: token_spend, subscription, api_spend, misc.

Last Updated: 2026-02-26
