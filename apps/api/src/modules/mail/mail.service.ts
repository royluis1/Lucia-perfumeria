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
    const user = process.env.MAIL_USER?.trim();
    const pass = process.env.MAIL_PASS?.trim();
    const defaultPort = host?.toLowerCase().includes('gmail') ? 587 : 1025;
    const port = Number(process.env.MAIL_PORT ?? defaultPort) || defaultPort;
    const secure =
      process.env.MAIL_SECURE !== undefined
        ? Number(process.env.MAIL_SECURE) === 1
        : port === 465;

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
        ignoreTLS: Number(process.env.MAIL_IGNORE_TLS ?? 0) === 1,
      });
      if (!user || !pass) {
        this.logger.warn(
          `MAIL_USER/MAIL_PASS no configurados: los proveedores (Gmail, etc.) rechazarán los envíos reales.`,
        );
      }
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