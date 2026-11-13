import type { UserRole } from '@prisma/client';

export type EmailTemplateType =
  'INVITATION_INITIAL' | 'INVITATION_RESEND' | 'INVITATION_EXPIRY_NOTICE';

export interface InvitationEmailTemplateParams {
  type?: EmailTemplateType | undefined;
  recipientEmail: string;
  recipientName?: string | null | undefined;
  role: UserRole;
  schoolName?: string | null | undefined;
  invitationUrl: string;
  expiresAt: Date;
  supportEmail?: string | undefined;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Platform Super Administrator';
    case 'SCHOOL_ADMIN':
      return 'School Administrator';
    case 'TEACHER':
      return 'Teacher';
    case 'STUDENT':
      return 'Student';
    case 'PARENT':
      return 'Parent / Legal Guardian';
    default:
      return role;
  }
}

function getRoleDescription(role: UserRole, schoolName: string): string {
  switch (role) {
    case 'SCHOOL_ADMIN':
      return `You have been provisioned as the initial School Administrator for ${schoolName}. You will oversee staff onboarding, student admissions, academic configurations, and tenant policies.`;
    case 'TEACHER':
      return `You have been invited to join the teaching faculty at ${schoolName}. You will be able to manage your course sections, take daily attendance, publish assignments, and grade student submissions.`;
    case 'STUDENT':
      return `Your student account at ${schoolName} has been created. You will have access to your daily schedules, course resources, assignments, and academic progress reports.`;
    case 'PARENT':
      return `Your parent/guardian account has been created for ${schoolName}. You will be able to monitor your child's attendance records, academic achievements, and school communications.`;
    case 'SUPER_ADMIN':
      return `You have been granted platform administrator privileges on FSD-SDG-4 Quality Education SaaS.`;
    default:
      return `You have been invited to access the FSD-SDG-4 portal for ${schoolName}.`;
  }
}

export function renderInvitationEmail(params: InvitationEmailTemplateParams): RenderedEmail {
  const {
    type = 'INVITATION_INITIAL',
    recipientEmail,
    recipientName,
    role,
    schoolName = 'FSD-SDG-4 Quality Education',
    invitationUrl,
    expiresAt,
    supportEmail = 'support@fsd-sdg4.edu',
  } = params;

  const roleLabel = getRoleLabel(role);
  const targetSchool = schoolName || 'FSD-SDG-4 Quality Education';
  const formattedExpiry = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const greetingName = recipientName?.trim() ? recipientName.trim() : recipientEmail;

  let subject: string;
  let headline: string;
  let subheadline: string;

  if (type === 'INVITATION_RESEND') {
    subject = `[Action Required] Re-issued Activation Invitation — ${targetSchool}`;
    headline = 'Your Account Activation Link Has Been Re-issued';
    subheadline = `A fresh activation invitation was requested for your ${roleLabel} account at ${targetSchool}.`;
  } else if (type === 'INVITATION_EXPIRY_NOTICE') {
    subject = `[Notice] Your Activation Link is Expiring Soon — ${targetSchool}`;
    headline = 'Your Account Invitation is Expiring Soon';
    subheadline = `Your pending ${roleLabel} account activation link for ${targetSchool} will expire shortly.`;
  } else {
    subject = `Welcome to ${targetSchool} — Activate Your ${roleLabel} Account`;
    headline = `Welcome to ${targetSchool}`;
    subheadline = `You have been invited to join the FSD-SDG-4 Quality Education Platform as a ${roleLabel}.`;
  }

  const roleDescription = getRoleDescription(role, targetSchool);

  // Responsive, inline-styled email template compatible with Gmail, Apple Mail, and Outlook
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container (max 600px) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0F172A; padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
                      SDG-4 • Quality Education
                    </span>
                    <h1 style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 20px; font-weight: 700; line-height: 1.3;">
                      FSD-SDG-4 Platform
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 8px 0; color: #0F172A; font-size: 18px; font-weight: 600;">
                ${escapeHtml(headline)}
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                ${escapeHtml(subheadline)}
              </p>

              <p style="margin: 0 0 16px 0; color: #1E293B; font-size: 14px; line-height: 1.6;">
                Hello <strong>${escapeHtml(greetingName)}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                ${escapeHtml(roleDescription)}
              </p>

              <!-- Account Details Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; border-radius: 8px; border: 1px solid #CBD5E1; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 6px; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Institution</td>
                        <td style="padding-bottom: 6px; color: #0F172A; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(targetSchool)}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 6px; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Assigned Role</td>
                        <td style="padding-bottom: 6px; color: #2563EB; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(roleLabel)}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Invitation Expiry</td>
                        <td style="color: #DC2626; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(formattedExpiry)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Activation CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                      Activate My Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Plain URL -->
              <p style="margin: 0 0 16px 0; color: #64748B; font-size: 12px; line-height: 1.5;">
                If the button above does not work, copy and paste this secure link directly into your browser:
              </p>
              <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 10px 12px; word-break: break-all; margin-bottom: 24px;">
                <a href="${invitationUrl}" style="color: #2563EB; font-size: 12px; text-decoration: underline;">
                  ${escapeHtml(invitationUrl)}
                </a>
              </div>

              <!-- Security Notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-left: 3px solid #EAB308; background-color: #FEFCE8; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; color: #713F12; font-size: 12px; line-height: 1.5;">
                      <strong>Security Notice:</strong> This activation link is unique to you, single-use, and valid for 7 days. Once activated, you will establish your private password. FSD-SDG-4 administrators will never ask for your password.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Need Help Section -->
              <p style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.5;">
                If you did not expect this invitation or need technical assistance, please reach out to your school administrator or email <a href="mailto:${supportEmail}" style="color: #2563EB; text-decoration: none;">${escapeHtml(supportEmail)}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #94A3B8; font-size: 11px;">
                United Nations Sustainable Development Goal 4 • Inclusive and Equitable Quality Education
              </p>
              <p style="margin: 0; color: #94A3B8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} FSD-SDG-4 Platform. All rights reserved. Automated security notification.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Clean, structured plain-text fallback
  const text = `=======================================================
FSD-SDG-4 QUALITY EDUCATION PLATFORM
=======================================================

${headline.toUpperCase()}
${subheadline}

Hello ${greetingName},

${roleDescription}

INVITATION DETAILS:
- Institution:     ${targetSchool}
- Assigned Role:   ${roleLabel}
- Expiration:      ${formattedExpiry} (7 days)

To activate your account and establish your password, visit the link below:
${invitationUrl}

SECURITY NOTICE:
This activation link is unique to you, single-use, and expires after 7 days.
Platform administrators will never ask for your password.

NEED HELP?
If you did not expect this email, contact your school administrator or email ${supportEmail}.

-------------------------------------------------------
UN SDG 4: Ensure inclusive and equitable quality education.
(c) ${new Date().getFullYear()} FSD-SDG-4 Platform. All rights reserved.
`;

  return { subject, html, text };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
