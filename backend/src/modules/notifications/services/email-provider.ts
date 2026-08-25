import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/** Used automatically whenever SMTP isn't configured — logs instead of failing, so notifications still get marked "sent" (dispatched) rather than piling up forever waiting for credentials that may never come in a dev environment. */
class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    logger.info(
      { to: message.to, subject: message.subject },
      `📧 [console email provider — no SMTP configured] Would send: "${message.subject}" to ${message.to}`
    );
  }
}

class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
  }
}

export function createEmailProvider(): EmailProvider {
  if (!env.SMTP_HOST) {
    logger.warn(
      'SMTP_HOST is not set — notifications will be logged to the console instead of actually sent. ' +
        'Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD in .env for real email delivery.'
    );
    return new ConsoleEmailProvider();
  }
  return new SmtpEmailProvider();
}
