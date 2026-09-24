import nodemailer, {
  Transporter,
} from 'nodemailer';

import {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../email-provider.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor() {
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASS'];
    const from = process.env['SMTP_FROM'];

    if (!user) {
      throw new Error('SMTP_USER is not configured');
    }

    if (!pass) {
      throw new Error('SMTP_PASS is not configured');
    }

    if (!from) {
      throw new Error('SMTP_FROM is not configured');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
      port: Number(process.env['SMTP_PORT'] ?? 465),
      secure:
        process.env['SMTP_SECURE'] !== 'false',
      auth: {
        user,
        pass,
      },
    });
  }

  async verify(): Promise<void> {
    await this.transporter.verify();
  }

  async send(
    input: SendEmailInput,
  ): Promise<SendEmailResult> {
    const from = process.env['SMTP_FROM'];

    if (!from) {
      throw new Error('SMTP_FROM is not configured');
    }

    const result = await this.transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.body,
      attachments: input.attachments,
    });

    return {
      providerMessageId: result.messageId,
    };
  }
}