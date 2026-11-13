import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Prisma, UserRole } from '@prisma/client';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../shared/db/prisma.js';
import {
  renderInvitationEmail,
  type EmailTemplateType,
  type RenderedEmail,
} from './mail.templates.js';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string | undefined;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

export interface DispatchInvitationOptions {
  invitationId: string;
  rawToken: string;
  invitationUrl: string;
  recipientEmail: string;
  recipientName?: string | null | undefined;
  role: UserRole;
  schoolId?: string | null | undefined;
  schoolName?: string | null | undefined;
  expiresAt: Date;
  type?: EmailTemplateType | undefined;
}

let activeTransporter: Transporter | null = null;

/**
 * Creates and configures the Nodemailer SMTP transporter.
 * Supports Gmail SMTP with secure TLS, connection timeouts, and authentication.
 */
export function getMailTransporter(): Transporter {
  if (activeTransporter) {
    return activeTransporter;
  }

  const isConfigured = Boolean(env.MAIL_USER && env.MAIL_APP_PASSWORD);

  if (!isConfigured) {
    logger.warn(
      {
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
      },
      'MAIL_USER or MAIL_APP_PASSWORD not set. Transporter operating in unconfigured fallback mode.',
    );
  }

  activeTransporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE,
    auth: isConfigured
      ? {
          user: env.MAIL_USER,
          pass: env.MAIL_APP_PASSWORD,
        }
      : undefined,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });

  return activeTransporter;
}

/**
 * Injects a mock or test transporter for unit and integration testing.
 */
export function setMailTransporterForTesting(transporter: Transporter | null): void {
  activeTransporter = transporter;
}

/**
 * Verifies whether mail credentials and host are configured.
 */
export function isMailConfigured(): boolean {
  return Boolean(env.MAIL_USER && env.MAIL_APP_PASSWORD);
}

/**
 * Verifies SMTP connection and authentication credentials.
 */
export async function verifyMailConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    const sanitizedError = err instanceof Error ? err.message : 'Unknown SMTP verification failure';
    logger.error(
      {
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        error: sanitizedError,
      },
      'SMTP connection verification failed',
    );
    return { ok: false, error: sanitizedError };
  }
}

/**
 * Sends a generic email message through the active transporter.
 * Never logs sensitive secrets, tokens, or credentials.
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const fromAddress = `"${env.MAIL_FROM_NAME}" <${env.MAIL_USER || 'no-reply@fsd-sdg4.edu'}>`;

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: options.from || fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(
      {
        recipient: options.to,
        subject: options.subject,
        messageId: info.messageId,
      },
      'Email successfully sent via mail service',
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    const sanitizedError = err instanceof Error ? err.message : 'Unknown email delivery error';
    logger.error(
      {
        recipient: options.to,
        subject: options.subject,
        error: sanitizedError,
      },
      'Email transmission failed',
    );

    return {
      success: false,
      error: sanitizedError,
    };
  }
}

/**
 * Dispatches an account invitation email using a reliable transactional strategy:
 * 1. Creates an EmailOutbox entry.
 * 2. Renders the appropriate role-specific template.
 * 3. Attempts delivery via Nodemailer.
 * 4. Updates EmailOutbox and UserInvitation records with exact outcome (SENT or FAILED).
 * Never logs raw invitation tokens.
 */
export async function dispatchInvitationEmail(
  options: DispatchInvitationOptions,
  client: Prisma.TransactionClient = prisma,
): Promise<{ delivered: boolean; error?: string; outboxId: string }> {
  const templateType = options.type || 'INVITATION_INITIAL';

  const rendered: RenderedEmail = renderInvitationEmail({
    type: templateType,
    recipientEmail: options.recipientEmail,
    recipientName: options.recipientName,
    role: options.role,
    schoolName: options.schoolName,
    invitationUrl: options.invitationUrl,
    expiresAt: options.expiresAt,
  });

  // Step 1: Create an outbox entry in PENDING status
  const outbox = await client.emailOutbox.create({
    data: {
      schoolId: options.schoolId ?? null,
      invitationId: options.invitationId,
      recipientEmail: options.recipientEmail.toLowerCase().trim(),
      templateName: templateType,
      subject: rendered.subject,
      status: 'PENDING',
      attempts: 0,
      metadata: {
        role: options.role,
        schoolName: options.schoolName,
      },
    },
  });

  // Step 2: Attempt SMTP delivery
  const sendResult = await sendMail({
    to: options.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const now = new Date();

  // Step 3: Record outcome on EmailOutbox and UserInvitation
  if (sendResult.success) {
    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: 'SENT',
        sentAt: now,
        messageId: sendResult.messageId ?? null,
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    await prisma.userInvitation.update({
      where: { id: options.invitationId },
      data: {
        deliveryStatus: 'SENT',
        deliveredAt: now,
        deliveryAttempts: { increment: 1 },
        deliveryError: null,
      },
    });

    return { delivered: true, outboxId: outbox.id };
  } else {
    const errorMsg = sendResult.error || 'SMTP delivery failed';

    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
        lastError: errorMsg,
      },
    });

    await prisma.userInvitation.update({
      where: { id: options.invitationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryAttempts: { increment: 1 },
        deliveryError: errorMsg,
      },
    });

    return { delivered: false, error: errorMsg, outboxId: outbox.id };
  }
}
