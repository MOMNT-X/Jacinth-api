export interface OtpEmailData {
  code: string;
  type: 'verification' | 'reset' | 'email-update';
}

export interface TransactionEmailData {
  orderId: string;
  totalAmount: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  customerName: string;
}

export class EmailTemplates {
  static getOtpTemplate(data: OtpEmailData): { subject: string; html: string; text: string } {
    const appName = process.env.APP_NAME || 'Jacinth Pharmacy';
    const typeText =
      data.type === 'verification'
        ? 'Email Verification'
        : data.type === 'reset'
          ? 'Password Reset'
          : 'Email Update';
    const purpose =
      data.type === 'verification'
        ? 'verify your email address'
        : data.type === 'reset'
          ? 'reset your password'
          : 'complete your email update';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typeText} - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${appName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin-top: 0; font-size: 20px;">${typeText}</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Use the verification code below to ${purpose}:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${data.code}
                </div>
              </div>
              
              <p style="color: #999999; font-size: 14px; line-height: 1.6;">
                This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
${appName} - ${typeText}

Hi there,

Use the verification code below to ${purpose}:

Code: ${data.code}

This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim();

    return { subject: `${typeText} Code - ${appName}`, html, text };
  }

  static getTransactionTemplate(data: TransactionEmailData): { subject: string; html: string; text: string } {
    const appName = process.env.APP_NAME || 'Jacinth Pharmacy';

    const itemsHtml = data.items
      .map(
        (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef; color: #333333;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center; color: #666666;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: right; color: #333333; font-weight: bold;">${item.price}</td>
    </tr>
  `,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${appName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin-top: 0; font-size: 20px;">Order Confirmation</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Hi ${data.customerName},
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your order! We've received your order and it's being processed.
              </p>
              
              <div style="margin: 30px 0;">
                <p style="color: #333333; font-size: 14px; font-weight: bold; margin-bottom: 10px;">Order ID: #${data.orderId}</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f8f9fa;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e9ecef; color: #333333;">Item</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e9ecef; color: #333333;">Quantity</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e9ecef; color: #333333;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #e9ecef; font-weight: bold; color: #333333;">Total:</td>
                      <td style="padding: 12px; text-align: right; border-top: 2px solid #e9ecef; font-weight: bold; color: #667eea; font-size: 18px;">${data.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                We'll send you another email once your order has been shipped.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
${appName} - Order Confirmation

Hi ${data.customerName},

Thank you for your order! We've received your order and it's being processed.

Order ID: #${data.orderId}

Items:
${data.items.map((item) => `- ${item.name} x${item.quantity} - ${item.price}`).join('\n')}

Total: ${data.totalAmount}

We'll send you another email once your order has been shipped.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim();

    return { subject: `Order Confirmation #${data.orderId} - ${appName}`, html, text };
  }
}

