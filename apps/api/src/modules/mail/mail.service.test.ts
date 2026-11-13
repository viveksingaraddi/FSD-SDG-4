import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Transporter } from 'nodemailer';
import {
  dispatchInvitationEmail,
  getMailTransporter,
  isMailConfigured,
  sendMail,
  setMailTransporterForTesting,
  verifyMailConnection,
} from './mail.service.js';
import { renderInvitationEmail } from './mail.templates.js';
import { prisma } from '../../shared/db/prisma.js';

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: {
    emailOutbox: {
      create: vi.fn(),
      update: vi.fn(),
    },
    userInvitation: {
      update: vi.fn(),
    },
  },
}));

describe('Mail Service & Gmail SMTP Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMailTransporterForTesting(null);
  });

  describe('Email Templates (mail.templates.ts)', () => {
    const defaultParams = {
      recipientEmail: 'sarah.admin@oakridge.edu',
      recipientName: 'Sarah Jenkins',
      role: 'SCHOOL_ADMIN' as const,
      schoolName: 'Oakridge High School',
      invitationUrl: 'https://app.fsd-sdg4.edu/accept-invitation?token=test-token-1234',
      expiresAt: new Date('2026-11-21T12:00:00Z'),
      supportEmail: 'support@fsd-sdg4.edu',
    };

    it('renders School Administrator invitation with school context, branding, and CTA', () => {
      const { subject, html, text } = renderInvitationEmail(defaultParams);

      expect(subject).toContain(
        'Welcome to Oakridge High School — Activate Your School Administrator Account',
      );
      expect(html).toContain('FSD-SDG-4 Platform');
      expect(html).toContain('SDG-4 • Quality Education');
      expect(html).toContain('Sarah Jenkins');
      expect(html).toContain('Oakridge High School');
      expect(html).toContain('School Administrator');
      expect(html).toContain('Activate My Account');
      expect(html).toContain('https://app.fsd-sdg4.edu/accept-invitation?token=test-token-1234');
      expect(html).toContain('support@fsd-sdg4.edu');
      expect(html).not.toContain('temporary password');
      expect(html).not.toContain('initial password');

      expect(text).toContain('FSD-SDG-4 QUALITY EDUCATION PLATFORM');
      expect(text).toContain('Sarah Jenkins');
      expect(text).toContain('Oakridge High School');
      expect(text).toContain('School Administrator');
      expect(text).toContain('https://app.fsd-sdg4.edu/accept-invitation?token=test-token-1234');
    });

    it('renders Teacher invitation with appropriate faculty description', () => {
      const { subject, html, text } = renderInvitationEmail({
        ...defaultParams,
        recipientEmail: 'robert.teacher@oakridge.edu',
        recipientName: 'Robert Langdon',
        role: 'TEACHER',
      });

      expect(subject).toContain('Activate Your Teacher Account');
      expect(html).toContain('join the teaching faculty');
      expect(text).toContain('join the teaching faculty');
    });

    it('renders Student invitation with student-specific guidance', () => {
      const { subject, html, text } = renderInvitationEmail({
        ...defaultParams,
        recipientEmail: 'alex.student@oakridge.edu',
        recipientName: 'Alex Smith',
        role: 'STUDENT',
      });

      expect(subject).toContain('Activate Your Student Account');
      expect(html).toContain('student account at Oakridge High School has been created');
      expect(text).toContain('student account at Oakridge High School has been created');
    });

    it('renders Parent / Guardian invitation with student monitoring context', () => {
      const { subject, html, text } = renderInvitationEmail({
        ...defaultParams,
        recipientEmail: 'parent.mary@family.com',
        recipientName: 'Mary Smith',
        role: 'PARENT',
      });

      expect(subject).toContain('Activate Your Parent / Legal Guardian Account');
      expect(html).toContain('parent/guardian account has been created');
      expect(text).toContain('parent/guardian account has been created');
    });

    it('renders Re-issued / Resend invitation with action required notice', () => {
      const { subject, html, text } = renderInvitationEmail({
        ...defaultParams,
        type: 'INVITATION_RESEND',
      });

      expect(subject).toContain('[Action Required] Re-issued Activation Invitation');
      expect(html).toContain('Your Account Activation Link Has Been Re-issued');
      expect(text).toContain('YOUR ACCOUNT ACTIVATION LINK HAS BEEN RE-ISSUED');
    });

    it('renders Expiry notice template when invitation is near expiration', () => {
      const { subject, html, text } = renderInvitationEmail({
        ...defaultParams,
        type: 'INVITATION_EXPIRY_NOTICE',
      });

      expect(subject).toContain('[Notice] Your Activation Link is Expiring Soon');
      expect(html).toContain('Your Account Invitation is Expiring Soon');
      expect(text).toContain('YOUR ACCOUNT INVITATION IS EXPIRING SOON');
    });
  });

  describe('Mail Transporter Configuration', () => {
    it('initializes transporter with secure settings', () => {
      const transporter = getMailTransporter();
      expect(transporter).toBeDefined();
    });

    it('verifies configuration check helper', () => {
      const configured = isMailConfigured();
      expect(typeof configured).toBe('boolean');
    });

    it('handles verifyMailConnection error gracefully when SMTP fails', async () => {
      const mockTransporter = {
        verify: vi
          .fn()
          .mockRejectedValue(
            new Error('Invalid login: 535-5.7.8 Username and Password not accepted'),
          ),
      } as unknown as Transporter;

      setMailTransporterForTesting(mockTransporter);

      const res = await verifyMailConnection();
      expect(res.ok).toBe(false);
      expect(res.error).toContain('Username and Password not accepted');
    });

    it('handles verifyMailConnection success', async () => {
      const mockTransporter = {
        verify: vi.fn().mockResolvedValue(true),
      } as unknown as Transporter;

      setMailTransporterForTesting(mockTransporter);

      const res = await verifyMailConnection();
      expect(res.ok).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe('sendMail', () => {
    it('successfully transmits email using mock transport', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: '<msg-12345@gmail.com>' }),
      } as unknown as Transporter;

      setMailTransporterForTesting(mockTransporter);

      const res = await sendMail({
        to: 'teacher@school.edu',
        subject: 'Welcome',
        html: '<p>Hello</p>',
        text: 'Hello',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('<msg-12345@gmail.com>');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'teacher@school.edu',
          subject: 'Welcome',
        }),
      );
    });

    it('catches SMTP errors without crashing and returns sanitized error', async () => {
      const mockTransporter = {
        sendMail: vi
          .fn()
          .mockRejectedValue(new Error('ETIMEDOUT: Connection to smtp.gmail.com:465 timed out')),
      } as unknown as Transporter;

      setMailTransporterForTesting(mockTransporter);

      const res = await sendMail({
        to: 'teacher@school.edu',
        subject: 'Welcome',
        html: '<p>Hello</p>',
        text: 'Hello',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Connection to smtp.gmail.com:465 timed out');
    });
  });

  describe('dispatchInvitationEmail (Transactional Outbox Strategy)', () => {
    it('creates outbox entry, transmits email, and updates outbox + invitation to SENT on success', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: '<gmail-ack-999>' }),
      } as unknown as Transporter;

      setMailTransporterForTesting(mockTransporter);

      vi.mocked(prisma.emailOutbox.create).mockResolvedValue({
        id: 'outbox-uuid-1',
        recipientEmail: 'new.teacher@school.edu',
        status: 'PENDING',
      } as never);

      const result = await dispatchInvitationEmail({
        invitationId: 'inv-uuid-1',
        rawToken: 'secret-token-hex-64-chars',
        invitationUrl: 'https://app.fsd-sdg4.edu/accept-invitation?token=secret-token-hex-64-chars',
        recipientEmail: 'new.teacher@school.edu',
        recipientName: 'Alice Green',
        role: 'TEACHER',
        schoolId: 'school-uuid-1',
        schoolName: 'Greenwood International',
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
        type: 'INVITATION_INITIAL',
      });

      expect(result.delivered).toBe(true);
      expect(result.outboxId).toBe('outbox-uuid-1');

      // Outbox created as PENDING
      expect(prisma.emailOutbox.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invitationId: 'inv-uuid-1',
          recipientEmail: 'new.teacher@school.edu',
          status: 'PENDING',
          templateName: 'INVITATION_INITIAL',
        }),
      });

      // Outbox updated to SENT
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith({
        where: { id: 'outbox-uuid-1' },
        data: expect.objectContaining({
          status: 'SENT',
          messageId: '<gmail-ack-999>',
          lastError: null,
        }),
      });

      // Invitation record updated to SENT
      expect(prisma.userInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-uuid-1' },
        data: expect.objectContaining({
          deliveryStatus: 'SENT',
          deliveryError: null,
        }),
      });
    });

    it('marks outbox and userInvitation as FAILED when SMTP delivery fails, without throwing unhandled error', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error('535 5.7.8 Bad credentials')),
      } as unknown as Transporter;

      setMailTransporterForTesting(mockTransporter);

      vi.mocked(prisma.emailOutbox.create).mockResolvedValue({
        id: 'outbox-uuid-2',
        recipientEmail: 'failed.admin@school.edu',
        status: 'PENDING',
      } as never);

      const result = await dispatchInvitationEmail({
        invitationId: 'inv-uuid-2',
        rawToken: 'secret-token-hex-64-chars',
        invitationUrl: 'https://app.fsd-sdg4.edu/accept-invitation?token=secret-token-hex-64-chars',
        recipientEmail: 'failed.admin@school.edu',
        recipientName: 'Failed Admin',
        role: 'SCHOOL_ADMIN',
        schoolId: 'school-uuid-1',
        schoolName: 'Oakridge High',
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
      });

      expect(result.delivered).toBe(false);
      expect(result.error).toContain('535 5.7.8 Bad credentials');

      // Outbox updated to FAILED
      expect(prisma.emailOutbox.update).toHaveBeenCalledWith({
        where: { id: 'outbox-uuid-2' },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: '535 5.7.8 Bad credentials',
        }),
      });

      // Invitation updated to FAILED
      expect(prisma.userInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-uuid-2' },
        data: expect.objectContaining({
          deliveryStatus: 'FAILED',
          deliveryError: '535 5.7.8 Bad credentials',
        }),
      });
    });
  });
});
