# Email Delivery Setup & Gmail SMTP Integration Guide

This guide details the configuration, security controls, and operational workflows for email delivery within the **FSD-SDG-4 Quality Education SaaS platform**.

---

## 1. Overview & Architecture

The email subsystem powers secure hierarchical user provisioning across the platform:

- **Platform Super Admin** &rarr; Initial School Administrator provisioning.
- **School Administrator** &rarr; Teacher, Student, and Parent/Guardian invitations.
- **Lifecycle Management** &rarr; Re-issuing expired or lost activation invitations.

### Centralized Architecture & Transactional Outbox

1. **Isolated Module**: Located in [`apps/api/src/modules/mail/`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/mail/).
2. **Transactional Outbox Strategy**:
   - Invitation record (`UserInvitation`) and an `EmailOutbox` record are created inside the database transaction in `PENDING` state.
   - Upon transaction commit, the mail service transmits the message via Nodemailer.
   - If transmission succeeds: `EmailOutbox.status` &rarr; `SENT`, `UserInvitation.deliveryStatus` &rarr; `SENT`.
   - If transmission fails (e.g. invalid credentials, network timeout): `EmailOutbox.status` &rarr; `FAILED`, `UserInvitation.deliveryStatus` &rarr; `FAILED`, and the sanitized error message is recorded. The invitation remains valid in the database so that administrators can review the failure, resend, or copy the link directly.
3. **Zero Plaintext Tokens**: Raw invitation tokens (32-byte cryptographic entropy) are transmitted exclusively within the email's one-time link and are **never** logged, persisted in plaintext, or included in error traces.

---

## 2. Gmail SMTP Configuration for Development

For local development and staging environments, the platform integrates with Google Workspace / Gmail SMTP.

### Step 1: Enable 2-Step Verification

1. Sign in to the designated official **FSD-SDG-4 Gmail account**.
2. Navigate to **Google Account Settings** &rarr; **Security** (`https://myaccount.google.com/security`).
3. Under _"How you sign in to Google"_, ensure **2-Step Verification** is turned **ON**.

### Step 2: Generate an App Password

> [!IMPORTANT]
> Standard Gmail passwords will **NOT** work for SMTP authentication when 2-Step Verification is active. You must generate a dedicated 16-character Google App Password.

1. In **Google Account Settings** &rarr; **Security**, search for **App passwords** (or go to `https://myaccount.google.com/apppasswords`).
2. Enter an app name (e.g., `FSD-SDG-4 Backend Dev`).
3. Click **Create**.
4. Google will display a 16-character passcode (formatted as `xxxx xxxx xxxx xxxx`).
5. Copy this passcode. Remove any spaces when placing it into your environment file.

### Step 3: Configure Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` (if not already done) and specify the following parameters:

```env
# Application Public Base URL
APP_BASE_URL=http://localhost:5173

# Gmail SMTP Email Delivery
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your_organization_account@gmail.com
MAIL_APP_PASSWORD=abcdefghijklmnop
MAIL_FROM_NAME="FSD-SDG-4 Quality Education"
```

#### Supported SMTP Port Configurations:

- **Port 465 (Recommended for Gmail SSL)**:
  - `MAIL_PORT=465`
  - `MAIL_SECURE=true`
- **Port 587 (STARTTLS)**:
  - `MAIL_PORT=587`
  - `MAIL_SECURE=false`

---

## 3. Environment Variables Specification

| Variable            | Type    | Default                       | Description                                                                |
| ------------------- | ------- | ----------------------------- | -------------------------------------------------------------------------- |
| `APP_BASE_URL`      | URL     | `http://localhost:5173`       | Public frontend URL used to assemble `/accept-invitation?token=...` links. |
| `MAIL_HOST`         | String  | `smtp.gmail.com`              | SMTP server hostname.                                                      |
| `MAIL_PORT`         | Integer | `465`                         | SMTP port (`465` for SSL, `587` for STARTTLS).                             |
| `MAIL_SECURE`       | Boolean | `true`                        | Connection security mode (`true` for port 465).                            |
| `MAIL_USER`         | String  | _Empty_                       | SMTP sender email address / username.                                      |
| `MAIL_APP_PASSWORD` | String  | _Empty_                       | 16-character Google App Password.                                          |
| `MAIL_FROM_NAME`    | String  | `FSD-SDG-4 Quality Education` | Display name in the recipient's email client.                              |

> [!WARNING]
> Never commit actual `.env` files, Gmail addresses, or App Passwords to Git. All secrets must remain local or in secure CI/CD secret managers.

---

## 4. Email Templates

Responsive, accessible HTML and plain-text templates are generated in [`mail.templates.ts`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/apps/api/src/modules/mail/mail.templates.ts):

| Template Scenario             | Subject Line Pattern                                                  | Description                                                                                             |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Initial School Admin**      | `Welcome to [School] — Activate Your School Administrator Account`    | Sent when Super Admin provisions a school. Contains tenant context and administrative responsibilities. |
| **Initial Teacher**           | `Welcome to [School] — Activate Your Teacher Account`                 | Sent when School Admin invites a teacher. Explains course management, grading, and attendance tools.    |
| **Initial Student**           | `Welcome to [School] — Activate Your Student Account`                 | Sent upon student enrollment. Explains schedule, assignments, and learning resources.                   |
| **Initial Parent / Guardian** | `Welcome to [School] — Activate Your Parent / Legal Guardian Account` | Sent when a parent account is linked to an enrolled student. Explains portal monitoring features.       |
| **Invitation Resend**         | `[Action Required] Re-issued Activation Invitation — [School]`        | Sent when an administrator resends an invitation (previous token is revoked).                           |
| **Expiration Notice**         | `[Notice] Your Activation Link is Expiring Soon — [School]`           | Reminder notification for pending invitations nearing the 7-day limit.                                  |

### Template Standards

- **Branding**: FSD-SDG-4 Header Banner, UN Sustainable Development Goal 4 mission reminder, and role-specific color accents.
- **Security Callout**: Highlights that the link is unique, single-use, expires in 7 days, and that staff will never request passwords.
- **Accessibility & Compatibility**: Inline CSS styling optimized for Gmail web/mobile, Apple Mail, and Outlook.
- **Fallback Plain-Text**: Clean structured plain text included with every message.

---

## 5. Local Testing & Verification

### Automated Testing

Automated tests never send real emails over the network. They use a mocked transport or in-memory assertions:

```bash
# Run mail service tests
pnpm --filter '@fsd-sdg4/api' exec vitest run src/modules/mail/mail.service.test.ts

# Run all API tests
pnpm --filter '@fsd-sdg4/api' test
```

### Manual Verification

1. Start the backend: `pnpm --filter '@fsd-sdg4/api' dev`
2. Start the web frontend: `pnpm --filter '@fsd-sdg4/web' dev`
3. Log in as a School Administrator at `http://localhost:5173/login`.
4. Navigate to **Invitations** (`http://localhost:5173/admin/invitations`).
5. Click **Invite User**, fill in recipient details, and submit.
6. Verify:
   - If Gmail credentials are set, the recipient receives the branded activation email.
   - The invitations table shows **Delivered** in green under the _Email Delivery_ column.
   - If credentials are empty or incorrect, the table shows **Failed** with the error tooltip, and the link dialog still allows copying the activation link.

---

## 6. Troubleshooting Common Issues

### 1. `535-5.7.8 Username and Password not accepted`

- **Cause**: Standard Google account password used instead of an App Password, or 2-Step Verification is disabled.
- **Fix**: Verify 2-Step Verification is active, generate a fresh 16-character App Password, and verify `MAIL_USER` matches the Google Account.

### 2. `ETIMEDOUT` or Connection Refused

- **Cause**: Network firewall or ISP blocking outbound SMTP port 465.
- **Fix**: Switch to port 587 with STARTTLS:
  ```env
  MAIL_PORT=587
  MAIL_SECURE=false
  ```

### 3. Google Daily Sending Limits

- **Cause**: Standard free Gmail accounts have a sending limit of ~500 emails/day; Google Workspace accounts allow ~2,000 emails/day.
- **Fix**: For high-volume testing or load tests, do not use personal Gmail. Use mock transports or dedicated test tools.

---

## 7. Production Deployment Considerations

While Gmail SMTP with App Passwords is valid for development, staging, and small-scale pilot deployments, production deployments should transition to:

1. **Google Workspace OAuth 2.0 (Service Account / 3LO)**: Eliminates static passwords in favor of short-lived JWT access tokens.
2. **Dedicated Transactional Email Providers**:
   - **Amazon SES** (Simple Email Service)
   - **SendGrid**
   - **Postmark**
   - **Resend**
3. **Benefits of Dedicated Transactional Providers**:
   - Custom SPF, DKIM, and DMARC domain validation for high deliverability.
   - Webhook-based bounce, complaint, and delivery tracking.
   - High sending quotas and reputation management.
