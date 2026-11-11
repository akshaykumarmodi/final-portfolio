import type { IncomingMessage, ServerResponse } from "node:http";
import nodemailer from "nodemailer";

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  honeypot?: string;
}

// In-memory rate limiting map for basic spam protection on serverless instances
const recentSubmissions = new Map<string, number>();

function sanitize(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseJsonBody(req: IncomingMessage & { body?: any }): Promise<ContactRequestBody> {
  return new Promise((resolve, reject) => {
    // If Vercel already parsed the body
    if (req.body && typeof req.body === "object") {
      return resolve(req.body);
    }
    if (typeof req.body === "string") {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }

    let rawData = "";
    req.on("data", (chunk) => {
      rawData += chunk;
      // Prevent payload over 500KB
      if (rawData.length > 500000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(rawData ? JSON.parse(rawData) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

/**
 * Vercel Serverless Function handler for /api/contact.
 * Supports both Node.js (req, res) and Web Standard (Request) execution.
 */
export default async function handler(req: any, res: any) {
  // CORS & Preflight handling
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Please send a POST request.`,
    });
  }

  try {
    const body: ContactRequestBody = await parseJsonBody(req);

    // 1. Bot Honeypot protection
    if (body.honeypot && body.honeypot.trim().length > 0) {
      // Silently accept without sending to defeat spam scrapers
      return res.status(200).json({
        success: true,
        message: "Message received successfully.",
      });
    }

    const name = body.name?.trim() || "";
    const email = body.email?.trim() || "";
    const subject = body.subject?.trim() || "Portfolio Inquiry";
    const message = body.message?.trim() || "";

    // 2. Input validation
    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Please enter your full name (at least 2 characters).",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    if (!message || message.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Message must be at least 5 characters.",
      });
    }

    // 3. Simple Rate Limiting (max 1 message per email every 30 seconds)
    const clientKey = `${email.toLowerCase()}`;
    const now = Date.now();
    const lastSent = recentSubmissions.get(clientKey);
    if (lastSent && now - lastSent < 30000) {
      return res.status(429).json({
        success: false,
        error: "Please wait 30 seconds before submitting another inquiry.",
      });
    }
    recentSubmissions.set(clientKey, now);

    // 4. Resolve SMTP Credentials from Environment Variables
    const smtpHost = process.env["SMTP_HOST"]?.trim() || "smtp.gmail.com";
    const envPortRaw = process.env["SMTP_PORT"]?.trim();
    const smtpPort = envPortRaw ? parseInt(envPortRaw, 10) : 587;
    const smtpUser = process.env["SMTP_USER"]?.trim() || "akshay123modi@gmail.com";
    const smtpPassword = process.env["SMTP_PASSWORD"]?.trim();
    const smtpFrom = process.env["SMTP_FROM"]?.trim() || `"Akshay Portfolio" <${smtpUser}>`;
    const receiverEmail =
      process.env["CONTACT_RECEIVER_EMAIL"]?.trim() ||
      process.env["ADMIN_EMAIL"]?.trim() ||
      "akshay123modi@gmail.com";

    if (!smtpPassword) {
      console.error("[api/contact] Missing SMTP_PASSWORD environment variable in Vercel.");
      return res.status(500).json({
        success: false,
        error: "SMTP service is not configured on the server. Please add SMTP_PASSWORD in Vercel Environment Variables.",
      });
    }

    // 5. Create Nodemailer Transport
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });

    const safeName = sanitize(name);
    const safeEmail = sanitize(email);
    const safeSubject = sanitize(subject);
    const safeMessage = sanitize(message).replace(/\n/g, "<br/>");
    const timestamp = new Date().toUTCString();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Portfolio Message</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0b0816; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #130f26; border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
    <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.1)); padding: 28px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
      <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #22d3ee; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px;">
        NEW PORTFOLIO INQUIRY
      </span>
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
        ${safeName}
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a78bfa;">
        Subject: ${safeSubject}
      </p>
    </div>
    <div style="padding: 24px;">
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">From</div>
        <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-top: 2px;">
          <a href="mailto:${safeEmail}" style="color: #38bdf8; text-decoration: none;">${safeEmail}</a>
        </div>
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px;">Date</div>
        <div style="font-size: 13px; color: #cbd5e1; margin-top: 2px;">${timestamp}</div>
      </div>
      <div style="background: rgba(168, 85, 247, 0.08); border-left: 3px solid #a855f7; border-radius: 8px; padding: 16px 18px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #c084fc; letter-spacing: 1px; margin-bottom: 8px;">Message</div>
        <div style="font-size: 14px; line-height: 1.6; color: #f1f5f9;">${safeMessage}</div>
      </div>
      <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px;">
        <a href="mailto:${safeEmail}?subject=${encodeURIComponent("Re: " + subject)}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #06b6d4); color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 9999px;">
          Reply to ${safeName} &rarr;
        </a>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const plainTextContent = `New Contact Inquiry from Akshay Portfolio\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nDate: ${timestamp}\n\nMessage:\n${message}\n`;

    await transporter.sendMail({
      from: smtpFrom,
      to: receiverEmail,
      replyTo: `"${name}" <${email}>`,
      subject: `New Portfolio Message — ${name} (${subject})`,
      text: plainTextContent,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "SMTP delivery failed";
    console.error("[api/contact] Error sending message:", errorMsg);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver email: ${errorMsg}`,
    });
  }
}
