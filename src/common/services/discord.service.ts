import { Injectable, Logger } from '@nestjs/common';

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly webhookUrl: string;

  constructor() {
    this.webhookUrl =
      process.env.DISCORD_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1433976995708145725/Pgu1FitT9qiFbjrX2tMhLgifg_j4YnXaTidctOXQM1bqtTa-gwq2ndBP_NMxzjgMo5MW';
  }

  /**
   * Send a message to Discord webhook
   */
  async sendMessage(
    content: string,
    embeds?: DiscordEmbed[],
  ): Promise<boolean> {
    try {
      const payload: any = {
        content,
      };

      if (embeds && embeds.length > 0) {
        payload.embeds = embeds.map((embed) => ({
          title: embed.title,
          description: embed.description,
          color: embed.color || 0x667eea,
          fields: embed.fields || [],
          footer: embed.footer,
          timestamp: embed.timestamp || new Date().toISOString(),
        }));
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Discord webhook failed: ${response.status} - ${errorText}`,
        );
        return false;
      }

      this.logger.log('Discord notification sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Error sending Discord notification:', error);
      return false;
    }
  }

  /**
   * Send user signup notification
   */
  async InitiatedSignup(data: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '🎉 New User has initiated Signup',
      description:
        'A new user has  verified email using otp, proceeding to complete signup',
      color: 0x4ade80, // Green
      fields: [
        {
          name: 'Email',
          value: data.email,
          inline: true,
        },
        {
          name: 'Full Name',
          value: data.fullName,
          inline: true,
        },
        {
          name: 'User ID',
          value: data.userId,
          inline: false,
        },
      ],
      footer: {
        text: 'Jacinth Pharmacy',
      },
    };

    return this.sendMessage('', [embed]);
  }
  async notifyUserSignup(data: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '🎉 New User Signup',
      description: 'User has completed signup, we have a newbie on board',
      color: 0x4ade80, // Green
      fields: [
        {
          name: 'Email',
          value: data.email,
          inline: true,
        },
        {
          name: 'Full Name',
          value: data.fullName,
          inline: true,
        },
        {
          name: 'User ID',
          value: data.userId,
          inline: false,
        },
      ],
      footer: {
        text: 'Jacinth Pharmacy',
      },
    };

    return this.sendMessage('', [embed]);
  }

  /**
   * Send transaction/purchase notification
   */
  async notifyTransaction(data: {
    orderId: string;
    userId: string;
    userEmail: string;
    totalAmount: string;
    itemsCount: number;
    paymentMethod: string;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '💰 New Order',
      description: 'A new order has been placed',
      color: 0x3b82f6, // Blue
      fields: [
        {
          name: 'Order ID',
          value: `#${data.orderId}`,
          inline: true,
        },
        {
          name: 'Customer',
          value: data.userEmail,
          inline: true,
        },
        {
          name: 'Total Amount',
          value: data.totalAmount,
          inline: true,
        },
        {
          name: 'Items',
          value: `${data.itemsCount} item(s)`,
          inline: true,
        },
        {
          name: 'Payment Method',
          value: data.paymentMethod,
          inline: true,
        },
        {
          name: 'User ID',
          value: data.userId,
          inline: false,
        },
      ],
      footer: {
        text: 'Jacinth Pharmacy',
      },
    };

    return this.sendMessage('', [embed]);
  }

  /**
   * Send custom notification
   */
  async notifyCustom(
    title: string,
    description: string,
    fields?: Array<{ name: string; value: string; inline?: boolean }>,
  ): Promise<boolean> {
    const embed: DiscordEmbed = {
      title,
      description,
      color: 0x667eea, // Purple
      fields: fields || [],
      footer: {
        text: 'Jacinth Pharmacy',
      },
    };

    return this.sendMessage('', [embed]);
  }
}
