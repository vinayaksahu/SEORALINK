import nodemailer, { type Transporter } from "nodemailer";

// Lazy-loaded transporter instance
let transporter: Transporter | null = null;

export function getMailTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER || "seoralinksupport@gmail.com";
    const pass = process.env.SMTP_PASS || "oxmigvhtzwvxmyux";

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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return transporter;
}

/**
 * Verify SMTP connection credentials
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
  const from = process.env.SMTP_FROM || `"SEORALINK" <seoralinksupport@gmail.com>`;
  const subject = `${otp} is your SEORALINK verification code`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${otp} - SEORALINK Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 32px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="padding: 24px 28px; text-align: center; background-color: #0b1325; border-bottom: 3px solid #d4af37;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 1px;">SEORALINK</h1>
                  <p style="margin: 4px 0 0; color: #94a3b8; font-size: 12px;">Security Verification</p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 28px;">
                  <p style="margin: 0 0 14px; color: #1e293b; font-size: 15px; font-weight: 600;">
                    Hello ${recipientName},
                  </p>
                  <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.5;">
                    Your one-time verification code for <strong>${purpose}</strong> is:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="text-align: center; margin: 24px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; display: inline-block; padding-left: 8px;">
                      ${otp}
                    </span>
                    <div style="margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 500;">
                      ⏱ Valid for 10 minutes
                    </div>
                  </div>

                  <p style="margin: 20px 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                    If you did not request this verification code, please ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 28px; text-align: center; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
                  <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                    &copy; ${new Date().getFullYear()} SEORALINK. All rights reserved.<br>
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

  const text = `SEORALINK Verification Code: ${otp}\n\nValid for 10 minutes.\n\nPurpose: ${purpose}\nRecipient: ${recipientName}\n\nIf you did not request this code, you can safely ignore this email.`;

  const mailOptions = {
    from,
    to,
    replyTo: "seoralinksupport@gmail.com",
    subject,
    text,
    html,
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      "Importance": "high",
      "X-Entity-Ref-ID": `otp-${Date.now()}-${otp}`,
    },
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    return info;
  } catch (primaryError: any) {
    console.warn("[Primary SMTP Failed, attempting Port 587 STARTTLS fallback]", primaryError?.message);

    const fallbackMailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.SMTP_USER || "seoralinksupport@gmail.com",
        pass: process.env.SMTP_PASS || "oxmigvhtzwvxmyux",
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const fallbackInfo = await fallbackMailer.sendMail(mailOptions);
    return fallbackInfo;
  }
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
  const from = process.env.SMTP_FROM || `"SEORALINK Korea" <seoralinksupport@gmail.com>`;

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
                  <div style="margin-bottom: 12px;">
                    <img src="https://seoralink.com/logo-icon.png" alt="SEORALINK" width="48" height="48" style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35); vertical-align: middle;" />
                  </div>
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
