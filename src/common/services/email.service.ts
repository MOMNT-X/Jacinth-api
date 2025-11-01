import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailTemplates, OtpEmailData, TransactionEmailData } from './email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly appName: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found. Email service will not work.');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.APP_EMAIL || 'noreply@jacinthpharmacy.com';
    this.appName = process.env.APP_NAME || 'Jacinth Pharmacy';
  }

  /**
   * Send OTP email for verification or password reset
   */
  async sendOtpEmail(email: string, data: OtpEmailData): Promise<boolean> {
    try {
      const template = EmailTemplates.getOtpTemplate(data);

      const result = await this.resend.emails.send({
        from: `${this.appName} <${this.fromEmail}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        this.logger.error(`Failed to send OTP email to ${email}:`, result.error);
        return false;
      }

      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending OTP email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send transaction/order confirmation email
   */
  async sendTransactionEmail(email: string, data: TransactionEmailData): Promise<boolean> {
    try {
      const template = EmailTemplates.getTransactionTemplate(data);

      const result = await this.resend.emails.send({
        from: `${this.appName} <${this.fromEmail}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        this.logger.error(`Failed to send transaction email to ${email}:`, result.error);
        return false;
      }

      this.logger.log(`Transaction email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending transaction email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send generic email (for future use)
   */
  async sendEmail(
    email: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    try {
      const result = await this.resend.emails.send({
        from: `${this.appName} <${this.fromEmail}>`,
        to: email,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });

      if (result.error) {
        this.logger.error(`Failed to send email to ${email}:`, result.error);
        return false;
      }

      this.logger.log(`Email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${email}:`, error);
      return false;
    }
  }
}

