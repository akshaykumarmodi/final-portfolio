import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password?: string | undefined;
  from: string;
  receiverEmail: string;
  secure?: boolean | undefined;
}

export interface SmtpStatusResult {
  configured: boolean;
  host?: string | undefined;
  port?: number | undefined;
  user?: string | undefined;
  from?: string | undefined;
  receiverEmail?: string | undefined;
  hasPassword?: boolean | undefined;
  source?: "env" | "database" | "none" | undefined;
  reason?: string | undefined;
}

export interface SendEmailResult {
  success: boolean;
  status: "SENT" | "FAILED" | "NOT_CONFIGURED";
  messageId?: string | undefined;
  error?: string | undefined;
}

/**
 * Resolves SMTP configuration in priority order:
 * 1. Environment variables (process.env.SMTP_*)
 * 2. Backend persisted site settings (memoryDb.settings)
 */
export function resolveSmtpConfig(customSettings?: {
  smtpHost?: string | undefined;
  smtpPort?: number | string | undefined;
  smtpUser?: string | undefined;
  smtpPassword?: string | undefined;
  smtpFrom?: string | undefined;
  notificationEmail?: string | undefined;
}): { config: SmtpConfig | null; status: SmtpStatusResult } {
  // Check environment variables first
  const envHost = process.env["SMTP_HOST"]?.trim();
  const envPortRaw = process.env["SMTP_PORT"]?.trim();
  const envUser = process.env["SMTP_USER"]?.trim();
  const envPassword = process.env["SMTP_PASSWORD"]?.trim();
  const envFrom = process.env["SMTP_FROM"]?.trim();
  const envReceiver =
    process.env["CONTACT_RECEIVER_EMAIL"]?.trim() ||
    process.env["ADMIN_EMAIL"]?.trim() ||
    "akshay123modi@gmail.com";

  if (envHost && envUser && envPassword) {
    const port = envPortRaw ? parseInt(envPortRaw, 10) : 465;
    const config: SmtpConfig = {
      host: envHost,
      port: isNaN(port) ? 465 : port,
      user: envUser,
      password: envPassword,
      from: envFrom || `"Akshay Portfolio" <${envUser}>`,
      receiverEmail: envReceiver,
      secure: port === 465,
    };
    return {
      config,
      status: {
        configured: true,
        host: config.host,
        port: config.port,
        user: config.user,
        from: config.from,
        receiverEmail: config.receiverEmail,
        hasPassword: true,
        source: "env",
      },
    };
  }

  // Check custom database settings
  const dbHost = customSettings?.smtpHost?.trim();
  const dbPortRaw = customSettings?.smtpPort;
  const dbUser = customSettings?.smtpUser?.trim();
  const dbPassword = customSettings?.smtpPassword?.trim();
  const dbFrom = customSettings?.smtpFrom?.trim();
  const dbReceiver = customSettings?.notificationEmail?.trim() || "akshay123modi@gmail.com";

  if (dbHost && dbUser && dbPassword) {
    const port = typeof dbPortRaw === "number" ? dbPortRaw : dbPortRaw ? parseInt(dbPortRaw, 10) : 465;
    const config: SmtpConfig = {
      host: dbHost,
      port: isNaN(port) ? 465 : port,
      user: dbUser,
      password: dbPassword,
      from: dbFrom || `"Akshay Portfolio" <${dbUser}>`,
      receiverEmail: dbReceiver,
      secure: port === 465,
    };
    return {
      config,
      status: {
        configured: true,
        host: config.host,
        port: config.port,
        user: config.user,
        from: config.from,
        receiverEmail: config.receiverEmail,
        hasPassword: true,
        source: "database",
      },
    };
  }

  // If partially configured, report what is missing
  const missingParts: string[] = [];
  if (!envHost && !dbHost) missingParts.push("SMTP_HOST");
  if (!envUser && !dbUser) missingParts.push("SMTP_USER");
  if (!envPassword && !dbPassword) missingParts.push("SMTP_PASSWORD");

  return {
    config: null,
    status: {
      configured: false,
      source: "none",
      receiverEmail: envReceiver || dbReceiver,
      reason: `SMTP not configured. Missing: ${missingParts.join(", ")}. Provide via .env or Admin Settings.`,
    },
  };
}

/**
 * Creates formatted email template (HTML + Plaintext) for contact notifications.
 * Crafted with obsidian dark mode, electric violet & cyan accents for mobile & desktop.
 */
export function formatContactNotificationEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}) {
  const formattedDate = new Date(data.createdAt).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  const emailSubject = `New Portfolio Contact Message — ${data.name}`;

  const plainText = `
New message received through your portfolio!

=======================================================
PORTFOLIO CONTACT SUBMISSION
=======================================================

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Received At: ${formattedDate}

-------------------------------------------------------
MESSAGE:
-------------------------------------------------------
${data.message}

=======================================================
Reply directly to this email or contact ${data.email}
Sent by Akshay Kumar Modi's Portfolio Self-Managed Backend
`.trim();

  // Escape HTML characters
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br/>");
  const replyMailto = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(`Re: ${data.subject}`)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070414;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070414;
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0f0a26;
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.2);
    }
    .header {
      background: linear-gradient(135deg, #180d38 0%, #0c081e 100%);
      padding: 28px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #22d3ee;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.4);
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
    }
    .subtitle {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #a78bfa;
    }
    .content {
      padding: 28px 24px;
    }
    .info-grid {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .info-row {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-row:first-child {
      padding-top: 0;
    }
    .label {
      font-size: 11px;
      font-family: monospace;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 1px;
    }
    .value {
      font-size: 15px;
      color: #ffffff;
      font-weight: 600;
      margin-top: 2px;
      word-break: break-word;
    }
    .value a {
      color: #38bdf8;
      text-decoration: none;
    }
    .message-box {
      background: rgba(168, 85, 247, 0.08);
      border-left: 3px solid #a855f7;
      border-top: 1px solid rgba(168, 85, 247, 0.2);
      border-right: 1px solid rgba(168, 85, 247, 0.2);
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .message-title {
      font-size: 12px;
      font-family: monospace;
      text-transform: uppercase;
      color: #c084fc;
      letter-spacing: 1px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .message-body {
      font-size: 14px;
      line-height: 1.6;
      color: #f1f5f9;
      white-space: normal;
      word-break: break-word;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 10px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
    }
    .footer {
      padding: 20px 24px;
      background: rgba(0, 0, 0, 0.4);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="badge">Portfolio Transmit</span>
        <h1 class="title">New Contact Message</h1>
        <p class="subtitle">Direct communication from your personal portfolio</p>
      </div>

      <div class="content">
        <div class="info-grid">
          <div class="info-row">
            <div class="label">Sender Name</div>
            <div class="value">${safeName}</div>
          </div>
          <div class="info-row">
            <div class="label">Email Address</div>
            <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
          </div>
          <div class="info-row">
            <div class="label">Subject</div>
            <div class="value">${safeSubject}</div>
          </div>
          <div class="info-row">
            <div class="label">Received At</div>
            <div class="value" style="font-size: 13px; font-weight: normal; color: #cbd5e1;">${formattedDate}</div>
          </div>
        </div>

        <div class="message-box">
          <div class="message-title">Message Body</div>
          <div class="message-body">${safeMessage}</div>
        </div>

        <div class="btn-container">
          <a href="${replyMailto}" class="btn">Reply Directly to ${safeName}</a>
        </div>
      </div>

      <div class="footer">
        Akshay Kumar Modi Portfolio &bull; Self-Managed SMTP Notification Engine &bull; Instant Delivery
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  return {
    subject: emailSubject,
    text: plainText,
    html,
  };
}

/**
 * Sends real email notification via SMTP transport.
 * Never prints passwords or credentials to logs.
 */
export async function sendContactEmailNotification(
  data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  },
  customSettings?: {
    smtpHost?: string | undefined;
    smtpPort?: number | string | undefined;
    smtpUser?: string | undefined;
    smtpPassword?: string | undefined;
    smtpFrom?: string | undefined;
    notificationEmail?: string | undefined;
  },
): Promise<SendEmailResult> {
  const { config, status } = resolveSmtpConfig(customSettings);

  if (!config) {
    return {
      success: false,
      status: "NOT_CONFIGURED",
      error: status.reason || "SMTP is not configured. Email notification skipped.",
    };
  }

  try {
    const isSslPort = config.port === 465;
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSslPort, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        // Do not fail on valid self-signed / cloud certificates
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10s timeout
    });

    const emailContent = formatContactNotificationEmail(data);

    const info = await transporter.sendMail({
      from: config.from,
      to: config.receiverEmail,
      replyTo: `"${data.name}" <${data.email}>`,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    return {
      success: true,
      status: "SENT",
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "SMTP transport error occurred.";
    console.error("[smtp-notification] Email delivery failed:", errorMsg);
    return {
      success: false,
      status: "FAILED",
      error: errorMsg,
    };
  }
}

/**
 * Tests connection to the SMTP server and optionally sends a verification test email.
 */
export async function testSmtpConnection(customSettings?: {
  smtpHost?: string | undefined;
  smtpPort?: number | string | undefined;
  smtpUser?: string | undefined;
  smtpPassword?: string | undefined;
  smtpFrom?: string | undefined;
  notificationEmail?: string | undefined;
}): Promise<{ success: boolean; message: string }> {
  const { config, status } = resolveSmtpConfig(customSettings);

  if (!config) {
    return {
      success: false,
      message: status.reason || "SMTP credentials are not configured.",
    };
  }

  try {
    const isSslPort = config.port === 465;
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSslPort,
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });

    // Verify SMTP connection configuration
    await transporter.verify();

    // Send actual verification test email
    const testData = {
      name: "Akshay Portfolio Notification Engine",
      email: config.user,
      subject: "⚡ Test Email Notification — SMTP Connection Verified",
      message:
        "Congratulations! Your self-managed SMTP email notification system is fully configured and operational. New submissions from your portfolio contact form will arrive directly in your inbox and trigger push notifications on your phone.",
      createdAt: new Date().toISOString(),
    };

    const emailContent = formatContactNotificationEmail(testData);

    const sendInfo = await transporter.sendMail({
      from: config.from,
      to: config.receiverEmail,
      replyTo: config.user,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    return {
      success: true,
      message: `SMTP connection verified and test notification sent to ${config.receiverEmail} (Message ID: ${sendInfo.messageId})!`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to connect to SMTP server";
    return {
      success: false,
      message: `SMTP Connection Failed: ${errMsg}`,
    };
  }
}

