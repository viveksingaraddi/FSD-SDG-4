#!/usr/bin/env tsx
/**
 * CLI utility to test Nodemailer SMTP connection using transporter.verify().
 * Usage:
 *   pnpm --filter @fsd-sdg4/api mail:verify
 */

import { env } from '../config/env.js';
import { getMailTransporter, isMailConfigured } from '../modules/mail/mail.service.js';

async function main(): Promise<void> {
  console.log('=====================================================');
  console.log('   EDVARQ Nodemailer SMTP Connection Verification');
  console.log('=====================================================\n');

  console.log('Configuration Settings:');
  console.log('  MAIL_HOST:        ', env.MAIL_HOST);
  console.log('  MAIL_PORT:        ', env.MAIL_PORT);
  console.log('  MAIL_SECURE:      ', env.MAIL_SECURE);
  console.log('  MAIL_USER:        ', env.MAIL_USER || '(not configured)');
  console.log(
    '  MAIL_APP_PASSWORD:',
    env.MAIL_APP_PASSWORD ? `******** (${env.MAIL_APP_PASSWORD.length} chars)` : '(not configured)',
  );
  console.log('  MAIL_FROM_NAME:   ', env.MAIL_FROM_NAME);
  console.log('');

  if (!isMailConfigured()) {
    console.error('❌ Error: MAIL_USER or MAIL_APP_PASSWORD is not set in apps/api/.env');
    console.error(
      '   Please add your Gmail address and 16-character App Password to apps/api/.env\n',
    );
    process.exit(1);
  }

  console.log('Connecting to SMTP server and verifying authentication...');
  const transporter = getMailTransporter();

  try {
    const verified = await transporter.verify();
    console.log('✅ Connection verified successfully! transporter.verify() returned:', verified);
    console.log('   The Nodemailer transporter is ready to deliver invitation emails.\n');
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ SMTP verification failed with error:');
    console.error(`   ${message}\n`);
    if (
      message.includes('535') ||
      message.includes('BadCredentials') ||
      message.includes('Username and Password not accepted')
    ) {
      console.error('💡 Troubleshooting Tip for Gmail 535 BadCredentials:');
      console.error('   1. Ensure 2-Step Verification is enabled on your Google Account.');
      console.error(
        '   2. Generate an "App Password" at https://myaccount.google.com/apppasswords',
      );
      console.error('   3. Set MAIL_USER to your full Gmail address.');
      console.error('   4. Set MAIL_APP_PASSWORD to the 16-character App Password.');
      console.error('   5. Do NOT use your primary Google account password.\n');
    }
    process.exit(1);
  }
}

void main();
