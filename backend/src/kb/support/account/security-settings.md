---
title: "Security Settings"
category: "Account"
tags: ["security", "two-factor", "2fa", "session", "login-history", "devices", "mfa"]
related: ["password-reset.md", "team-members.md", "updating-profile.md", "../billing/payment-methods.md"]
---

# Security Settings

Your Atlas UX account holds your business data, customer information, call history, and billing details. Keeping it secure is important -- and we give you the tools to do it. Here is how to lock things down.

## Two-Factor Authentication (2FA)

Two-factor authentication adds a second step to your login. Even if someone gets your password, they cannot access your account without the second factor. We strongly recommend turning it on.

### How to Enable 2FA

1. Log in to your Atlas UX dashboard
2. Go to **Settings** and then **Security**
3. Click **Enable Two-Factor Authentication**
4. Scan the QR code with an authenticator app on your phone (Google Authenticator, Authy, or Microsoft Authenticator all work)
5. Enter the 6-digit code from the app to confirm
6. Save your backup codes in a safe place

### Backup Codes

When you enable 2FA, you receive a set of backup codes. These are one-time-use codes that let you log in if you lose access to your authenticator app (phone lost, broken, or wiped). Store them somewhere secure -- a password manager, a printed sheet in your office safe, or a locked file. Each backup code can only be used once.

### Disabling 2FA

If you need to turn off two-factor authentication:

1. Go to **Settings** and then **Security**
2. Click **Disable Two-Factor Authentication**
3. Confirm with your current password or a 2FA code

Only do this if you have a good reason. Your account is more secure with 2FA enabled.

## Session Management

A session is an active login. Every time you log in from a browser or device, it creates a session. You can see and manage all your active sessions.

### Viewing Active Sessions

1. Go to **Settings** and then **Security**
2. Scroll to **Active Sessions**

You will see a list showing:

- **Device type** -- Desktop, mobile, or tablet
- **Browser** -- Chrome, Safari, Firefox, etc.
- **Location** -- Approximate location based on IP address
- **Last active** -- When the session was last used

### Ending a Session

If you see a session you do not recognize, or you want to log out of a device remotely:

1. Find the session in the list
2. Click **End Session** or **Log Out**

That session is immediately terminated. If someone was using it, they are logged out and would need your password (and 2FA code, if enabled) to get back in.

**Tip:** If you see an unfamiliar session, end it immediately, then change your password. See [Password Reset](password-reset.md).

## Login History

Your login history shows every login attempt -- successful and failed -- for your account. This helps you spot suspicious activity.

1. Go to **Settings** and then **Security**
2. Scroll to **Login History**

Each entry shows:

- **Date and time** of the attempt
- **Success or failure** -- Did the login work or was it rejected?
- **IP address** -- Where the attempt came from
- **Device and browser** -- What was used

If you see failed login attempts from unfamiliar locations, someone may be trying to access your account. Take these steps:

1. Change your password immediately (see [Password Reset](password-reset.md))
2. Enable 2FA if you have not already
3. Review your active sessions and end any you do not recognize

## Connected Devices

If you use Atlas UX on multiple devices -- your office computer, your phone on the job site, a tablet at home -- they all show up under connected devices. This is a quick way to see everywhere your account is logged in.

## How to Secure Your Account: A Checklist

Here is a practical checklist for keeping your Atlas UX account safe:

- [ ] **Use a strong, unique password** -- Not the same one you use for email or other services
- [ ] **Enable two-factor authentication** -- The single most effective thing you can do
- [ ] **Save your backup codes** -- Store them securely offline
- [ ] **Review active sessions regularly** -- End any you do not recognize
- [ ] **Check login history** -- Look for failed attempts or unfamiliar locations
- [ ] **Remove former team members** -- When someone leaves your business, remove their access immediately. See [Team Members](team-members.md)
- [ ] **Do not share your login** -- Each person should have their own account
- [ ] **Keep your email secure** -- Your email is the key to password resets, so protect it too

## Common Questions

**What authenticator apps work with Atlas UX?**
Any standard TOTP (time-based one-time password) app works. Popular options include Google Authenticator, Authy, Microsoft Authenticator, and 1Password.

**I lost my phone and cannot access my authenticator. What do I do?**
Use one of your backup codes to log in. If you do not have your backup codes, contact our support team. We will verify your identity and help you regain access.

**Can I require 2FA for all team members?**
Admins can encourage team members to enable 2FA. If mandatory 2FA is important to your business, let our support team know -- we are exploring this as a feature.

**Is my payment information secure?**
Yes. All payment processing is handled by Stripe, and your card details never touch our servers. See [Payment Methods](../billing/payment-methods.md) for more details.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
