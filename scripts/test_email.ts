import path from "node:path";
import fs from "node:fs";

// Load .env file
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  if (typeof (process as any).loadEnvFile === "function") {
    (process as any).loadEnvFile(envPath);
  } else {
    try {
      const dotenv = require("dotenv");
      dotenv.config({ path: envPath });
    } catch {
      // ignore
    }
  }
}

import { verifySmtpConnection, sendOtpEmail } from "../src/lib/mail";

async function main() {
  console.log("==========================================");
  console.log("📧 SEORALINK Email / SMTP Connection Test");
  console.log("==========================================");
  console.log("Host:", process.env.SMTP_HOST || "(not set, default will be used)");
  console.log("Port:", process.env.SMTP_PORT || "465");
  console.log("Secure:", process.env.SMTP_SECURE || "true");
  console.log("User:", process.env.SMTP_USER || "(not set)");
  console.log("From:", process.env.SMTP_FROM || "(not set)");
  console.log("------------------------------------------");

  console.log("Verifying SMTP connection credentials...");
  const verification = await verifySmtpConnection();

  if (!verification.success) {
    console.error("❌ SMTP Verification Failed:", verification.message);
    console.log("\n💡 Gmail Setup Tips:");
    console.log("1. Make sure you are using a 16-character Google 'App Password' (not your normal password).");
    console.log("2. 2-Step Verification must be enabled on your Google Account.");
    console.log("3. Generate App Password at: https://myaccount.google.com/apppasswords");
    process.exit(1);
  }

  console.log("✅ SMTP Verification Successful:", verification.message);

  const targetEmail = process.argv[2];
  if (targetEmail) {
    console.log(`\nSending test OTP email to: ${targetEmail}...`);
    try {
      const result = await sendOtpEmail({
        to: targetEmail,
        otp: "849201",
        purpose: "Test Setup Verification",
        recipientName: "Test User",
      });
      console.log("✅ Test email sent successfully! MessageId:", (result as any)?.messageId || "Delivered");
    } catch (err: any) {
      console.error("❌ Failed to send test email:", err.message);
    }
  } else {
    console.log("\n💡 Tip: Run with an email argument to send a test OTP email:");
    console.log("   npx tsx scripts/test_email.ts your-email@example.com");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
