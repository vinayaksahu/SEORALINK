import nodemailer, { type Transporter } from "nodemailer";

// Lazy-loaded transporter instance
let transporter: Transporter | null = null;

export function getMailTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "mail.privateemail.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER || "noreply@seoralink.com";
    const pass = process.env.SMTP_PASS || "";

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues
      },
    });
  }

  return transporter;
}

/**
 * Verify SMTP connection credentials with Namecheap Private Email
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const mailer = getMailTransporter();
    await mailer.verify();
    return { success: true, message: "SMTP server connection established successfully!" };
  } catch (error: any) {
    console.error("[SMTP Verification Error]", error);
    return { success: false, message: error.message || "Failed to connect to SMTP server" };
  }
}

/**
 * Send an OTP Verification Email with SEORALINK Korean Business Network branding
 */
export async function sendOtpEmail({
  to,
  otp,
  purpose = "Verification",
  recipientName = "Valued Member",
}: {
  to: string;
  otp: string;
  purpose?: string;
  recipientName?: string;
}) {
  const mailer = getMailTransporter();
  const from = process.env.SMTP_FROM || `"SEORALINK Korea" <noreply@seoralink.com>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SEORALINK Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #040711; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #040711; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0b1325; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #0d1a36 0%, #0b1325 100%);">
                  <div style="display: inline-block; padding: 6px 16px; border-radius: 20px; background-color: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); margin-bottom: 12px;">
                    <span style="color: #d4af37; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">SEORALINK NETWORK</span>
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Security Verification Code</h1>
                  <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Korean Business Network Authentication</p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    Hello <strong>${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                    We received a request for <strong>${purpose}</strong> on your SEORALINK account. Please use the one-time authentication code below to proceed:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="text-align: center; margin: 25px 0; padding: 22px 15px; background: #040711; border: 2px dashed #38bdf8; border-radius: 12px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; display: inline-block; padding-left: 8px;">
                      ${otp}
                    </span>
                    <div style="margin-top: 10px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      ⏱ Valid for 10 minutes
                    </div>
                  </div>

                  <p style="margin: 20px 0 0; color: #ef4444; font-size: 12px; line-height: 1.5; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #ef4444;">
                    <strong>Security Notice:</strong> Never share this OTP with anyone, including SEORALINK operators or support administrators.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #1e293b; background-color: #070e1b;">
                  <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                    &copy; ${new Date().getFullYear()} SEORALINK Korean Business Network. All rights reserved.<br>
                    Automated transmission &bull; Do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `SEORALINK Verification Code: ${otp}\n\nValid for 10 minutes. Do not share this code with anyone.\n\nPurpose: ${purpose}\nRecipient: ${recipientName}`;

  const info = await mailer.sendMail({
    from,
    to,
    subject: `SEORALINK Security Code: ${otp} (for ${purpose})`,
    text,
    html,
  });

  return info;
}

/**
 * Send General Notification / Welcome Email
 */
export async function sendNotificationEmail({
  to,
  subject,
  title,
  message,
  actionText,
  actionUrl,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}) {
  const mailer = getMailTransporter();
  const from = process.env.SMTP_FROM || `"SEORALINK Korea" <noreply@seoralink.com>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #040711; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #040711; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0b1325; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background: #0d1a36;">
                  <span style="color: #d4af37; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">SEORALINK NETWORK</span>
                  <h2 style="margin: 8px 0 0; color: #fff; font-size: 18px;">${title}</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 13px; line-height: 1.7;">${message}</p>
                  ${
                    actionText && actionUrl
                      ? `
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="${actionUrl}" style="background-color: #d4af37; color: #000; padding: 12px 28px; font-size: 13px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block;">
                        ${actionText}
                      </a>
                    </div>
                  `
                      : ""
                  }
                </td>
              </tr>
              <tr>
                <td style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background-color: #070e1b; font-size: 11px; color: #64748b;">
                  &copy; ${new Date().getFullYear()} SEORALINK. Automated notification.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await mailer.sendMail({
    from,
    to,
    subject,
    html,
  });
}
