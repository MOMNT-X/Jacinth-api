import { Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: twilio.Twilio;
  private readonly phoneNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken) {
      this.logger.warn(
        'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not found. SMS service will not work.',
      );
      this.client = null as any;
    } else {
      this.client = twilio(accountSid, authToken);
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOtpSms(phoneNumber: string, code: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    if (!this.client) {
      this.logger.error('Twilio client not initialized. Check your environment variables.');
      return { success: false, error: 'Twilio service not configured' };
    }

    if (!this.phoneNumber) {
      this.logger.error('TWILIO_PHONE_NUMBER not configured.');
      return { success: false, error: 'Twilio phone number not configured' };
    }

    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const message = await this.client.messages.create({
        body: `Your Jacinth Pharmacy verification code is: ${code}. This code expires in 10 minutes.`,
        from: this.phoneNumber,
        to: formattedPhone,
      });

      this.logger.log(`OTP SMS sent successfully to ${formattedPhone}. Message SID: ${message.sid}`);
      return { success: true, messageSid: message.sid };
    } catch (error: any) {
      this.logger.error(`Error sending OTP SMS to ${phoneNumber}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send generic SMS message
   */
  async sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    if (!this.client) {
      this.logger.error('Twilio client not initialized. Check your environment variables.');
      return { success: false, error: 'Twilio service not configured' };
    }

    if (!this.phoneNumber) {
      this.logger.error('TWILIO_PHONE_NUMBER not configured.');
      return { success: false, error: 'Twilio phone number not configured' };
    }

    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: formattedPhone,
      });

      this.logger.log(`SMS sent successfully to ${formattedPhone}. Message SID: ${result.sid}`);
      return { success: true, messageSid: result.sid };
    } catch (error: any) {
      this.logger.error(`Error sending SMS to ${phoneNumber}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}


