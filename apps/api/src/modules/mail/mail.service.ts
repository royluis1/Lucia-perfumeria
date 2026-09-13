import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor() {
    const host = process.env.MAIL_HOST?.trim();
    const port = Number(process.env.MAIL_PORT ?? 1025);
    const user = process.env.MAIL_USER?.trim();
    const pass = process.env.MAIL_PASS?.trim();

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: Number(process.env.MAIL_SECURE ?? 0) === 1,
        auth: user && pass ? { user, pass } : undefined,
        ignoreTLS: Number(process.env.MAIL_IGNORE_TLS ?? 1) === 1,
      });
    } else {
      this.transporter = null;
      this.logger.warn(
        'MAIL_HOST no configurado. Los emails se loguean en consola (Mailhog en http://localhost:8025).',
      );
    }
  }

  async send(message: MailMessage) {
    const from =
      process.env.MAIL_FROM?.trim() || 'Lucía Perfumería <no-reply@lucia-perfumeria.com>';

    if (!this.transporter) {
      this.logger.log(`[MAIL] to=${message.to} subject="${message.subject}"`);
      this.logger.log(`[MAIL] ${message.html.replace(/\s+/g, ' ').slice(0, 500)}`);
      return;
    }

    await this.transporter.sendMail({ from, to: message.to, subject: message.subject, html: message.html });
  }
}