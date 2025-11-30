import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { EmailTemplates, OtpEmailData, TransactionEmailData } from './email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appName: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.error('SENDGRID_API_KEY not found. Email service will not work.');
      this.logger.error('Please set SENDGRID_API_KEY in your .env file');
    } else {
      try {
        sgMail.setApiKey(apiKey);
        this.logger.log('SendGrid API key configured successfully');
      } catch (error) {
        this.logger.error('Failed to configure SendGrid API key:', error);
      }
    }
    
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.APP_EMAIL || 'noreply@jacinthpharmacy.com';
    this.appName = process.env.APP_NAME || 'Jacinth Pharmacy';
    
    if (!process.env.SENDGRID_FROM_EMAIL && !process.env.APP_EMAIL) {
      this.logger.warn(`Using default from email: ${this.fromEmail}`);
      this.logger.warn('Make sure this email is verified in your SendGrid account');
    }
  }

  /**
   * Send OTP email for verification or password reset
   */
  async sendOtpEmail(email: string, data: OtpEmailData): Promise<boolean> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.error('Cannot send email: SENDGRID_API_KEY is not configured');
      return false;
    }

    try {
      const template = EmailTemplates.getOtpTemplate(data);

      const msg = {
        to: email,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await sgMail.send(msg);
      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      const errorDetails = error.response?.body || error.message || error;
      
      // Provide more helpful error messages
      if (error.response?.body?.errors) {
        const errors = error.response.body.errors;
        errors.forEach((err: any) => {
          if (err.message?.includes('Permission denied') || err.message?.includes('wrong credentials')) {
            this.logger.error(`SendGrid Authentication Error: Invalid API key or insufficient permissions`);
            this.logger.error(`Please verify your SENDGRID_API_KEY in the .env file`);
          } else if (err.message?.includes('from') || err.message?.includes('sender')) {
            this.logger.error(`SendGrid Sender Error: The "from" email (${this.fromEmail}) is not verified in SendGrid`);
            this.logger.error(`Please verify the sender email in your SendGrid account or update SENDGRID_FROM_EMAIL`);
          } else {
            this.logger.error(`SendGrid Error: ${err.message}`);
          }
        });
      } else {
        this.logger.error(`Error sending OTP email to ${email}:`, errorDetails);
      }
      
      return false;
    }
  }

  /**
   * Send transaction/order confirmation email
   */
  async sendTransactionEmail(email: string, data: TransactionEmailData): Promise<boolean> {
    try {
      const template = EmailTemplates.getTransactionTemplate(data);

      const msg = {
        to: email,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await sgMail.send(msg);
      this.logger.log(`Transaction email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error sending transaction email to ${email}:`, error.response?.body || error.message);
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
      const msg = {
        to: email,
        from: this.fromEmail,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error sending email to ${email}:`, error.response?.body || error.message);
      return false;
    }
  }
}

