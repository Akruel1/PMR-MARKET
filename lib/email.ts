import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@marketplace.com';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://pmrmarket.com';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailData): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email service not configured. Email would be sent:', { to, subject });
    return false;
  }

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Template for new message notification
export async function sendNewMessageEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  adTitle?: string
): Promise<boolean> {
  const subject = adTitle 
    ? `New message about "${adTitle}"`
    : `New message from ${senderName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-left: 4px solid #4A90E2; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>You have received a new message from <strong>${senderName}</strong>:</p>
            <div class="message-box">
              <p>${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}</p>
            </div>
            ${adTitle ? `<p>About: <strong>${adTitle}</strong></p>` : ''}
            <a href="${BASE_URL}/messages" class="button">View Message</a>
            <div class="footer">
              <p>You're receiving this email because someone sent you a message on Marketplace.</p>
              <p>© ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    New message from ${senderName}
    
    ${messagePreview}
    
    ${adTitle ? `About: ${adTitle}` : ''}
    
    View your messages: ${BASE_URL}/messages
  `;

  return await sendEmail({ to: recipientEmail, subject, html, text });
}

// Template for ad approval notification
export async function sendAdApprovedEmail(
  userEmail: string,
  userName: string,
  adTitle: string,
  adSlug: string
): Promise<boolean> {
  const subject = `✅ Your ad "${adTitle}" has been approved`;
  
  const adUrl = `${BASE_URL}/ads/${adSlug}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 5px; color: #155724; }
          .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Ad Approved!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="success-box">
              <p style="margin: 0; font-size: 18px;"><strong>Great news!</strong></p>
              <p style="margin: 5px 0 0 0;">Your ad "<strong>${adTitle}</strong>" has been approved and is now live on Marketplace.</p>
            </div>
            <p>Your ad is now visible to all users and they can contact you to purchase.</p>
            <a href="${adUrl}" class="button">View Your Ad</a>
            <div class="footer">
              <p>You're receiving this email because you created an ad on Marketplace.</p>
              <p>© ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Great news!
    
    Your ad "${adTitle}" has been approved and is now live on Marketplace.
    
    View your ad: ${adUrl}
  `;

  return await sendEmail({ to: userEmail, subject, html, text });
}

// Template for ad rejection notification
export async function sendAdRejectedEmail(
  userEmail: string,
  userName: string,
  adTitle: string,
  reason?: string
): Promise<boolean> {
  const subject = `❌ Your ad "${adTitle}" was rejected`;
  
  const profileUrl = `${BASE_URL}/profile`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #f8d7da; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; border-radius: 5px; color: #721c24; }
          .button { display: inline-block; padding: 12px 30px; background: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Ad Rejected</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="warning-box">
              <p style="margin: 0; font-size: 18px;"><strong>Update on your ad</strong></p>
              <p style="margin: 5px 0 0 0;">Your ad "<strong>${adTitle}</strong>" was rejected by our moderation team.</p>
            </div>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '<p>Please check your messages for more details from our moderation team.</p>'}
            <p>You can create a new ad that meets our guidelines or contact support if you have questions.</p>
            <a href="${profileUrl}" class="button">View Your Ads</a>
            <div class="footer">
              <p>You're receiving this email because you created an ad on Marketplace.</p>
              <p>© ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Update on your ad
    
    Your ad "${adTitle}" was rejected by our moderation team.
    
    ${reason ? `Reason: ${reason}` : 'Please check your messages for more details.'}
    
    View your ads: ${profileUrl}
  `;

  return await sendEmail({ to: userEmail, subject, html, text });
}

















