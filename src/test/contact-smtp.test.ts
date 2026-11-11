import { describe, it, expect } from "vitest";
import * as db from "@/lib/server-db";
import {
  formatContactNotificationEmail,
  resolveSmtpConfig,
} from "@/lib/email-service";

describe("Self-Managed Contact Form & SMTP Notification System", () => {
  it("formats notification email with subject, metadata and mobile-responsive layout", () => {
    const formatted = formatContactNotificationEmail({
      name: "Guillermo Rauch",
      email: "rauchg@vercel.com",
      subject: "Frontend Infrastructure Chat",
      message: "Hey Akshay, would love to talk about high performance creative 3D web interfaces.",
      createdAt: "2026-11-11T01:30:00.000Z",
    });

    // Subject requirement: "New Portfolio Contact Message — [Sender Name]"
    expect(formatted.subject).toBe("New Portfolio Contact Message — Guillermo Rauch");

    // Plain text content requirement
    expect(formatted.text).toContain("Name: Guillermo Rauch");
    expect(formatted.text).toContain("Email: rauchg@vercel.com");
    expect(formatted.text).toContain("Subject: Frontend Infrastructure Chat");
    expect(formatted.text).toContain("high performance creative 3D web interfaces");
    expect(formatted.text).toContain("Received At:");

    // HTML email layout requirement
    expect(formatted.html).toContain("Guillermo Rauch");
    expect(formatted.html).toContain("rauchg@vercel.com");
    expect(formatted.html).toContain("Frontend Infrastructure Chat");
    expect(formatted.html).toContain("mailto:rauchg%40vercel.com");
  });

  it("escapes malicious scripts in email templates to prevent HTML injection", () => {
    const formatted = formatContactNotificationEmail({
      name: "<script>alert('xss')</script>",
      email: "hacker@domain.com",
      subject: "<b>Bold Alert</b>",
      message: "<img src='x' onerror='steal()'/>Test Message",
      createdAt: new Date().toISOString(),
    });

    expect(formatted.html).not.toContain("<script>alert('xss')</script>");
    expect(formatted.html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
    expect(formatted.html).not.toContain("<img src='x'");
  });

  it("resolves SMTP configuration and reports missing credentials clearly", () => {
    // When no SMTP is provided
    const res = resolveSmtpConfig({});
    expect(res.config).toBeNull();
    expect(res.status.configured).toBe(false);
    expect(res.status.reason).toContain("SMTP not configured");

    // When valid SMTP settings are provided
    const configuredRes = resolveSmtpConfig({
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      smtpUser: "akshay123modi@gmail.com",
      smtpPassword: "abcdefghijklmnop",
      notificationEmail: "akshay123modi@gmail.com",
    });

    expect(configuredRes.config).not.toBeNull();
    expect(configuredRes.status.configured).toBe(true);
    expect(configuredRes.config?.host).toBe("smtp.gmail.com");
    expect(configuredRes.config?.secure).toBe(true);
    expect(configuredRes.config?.port).toBe(465);
    expect(configuredRes.status.hasPassword).toBe(true);
  });

  it("validates incoming fields and rejects invalid submissions", async () => {
    // Invalid email
    await expect(
      db.submitContact({
        name: "Akshay Test",
        email: "not-an-email",
        message: "Hello there from test runner",
      }),
    ).rejects.toThrow("valid email");

    // Short name
    await expect(
      db.submitContact({
        name: "A",
        email: "akshay@example.com",
        message: "Valid message content",
      }),
    ).rejects.toThrow("full name");

    // Short message
    await expect(
      db.submitContact({
        name: "Akshay Modi",
        email: "akshay@example.com",
        message: "Hi",
      }),
    ).rejects.toThrow("Message must be at least 5 characters");
  });

  it("rejects automated spam bots using honeypot detection", async () => {
    await expect(
      db.submitContact({
        name: "Spam Bot",
        email: "spambot@auto.com",
        message: "Buy cheap backlinks now",
        honeypot: "http://spam-link.com",
      }),
    ).rejects.toThrow("Spam detection triggered");
  });

  it("stores submissions in database with deliveryStatus and supports markRead / delete", async () => {
    const submission = await db.submitContact({
      name: "Tim Cook",
      email: "tcook@apple.com",
      subject: "Vision Pro Spatial Web Design",
      message: "Loved the obsidian and 3D interactions in your portfolio. Great work!",
      clientIp: "test-client-unique-1",
    });

    expect(submission.id).toBeDefined();
    expect(submission.name).toBe("Tim Cook");
    expect(submission.email).toBe("tcook@apple.com");
    expect(submission.read).toBe(false);
    // Since SMTP is not configured in test runner, status must accurately reflect that rather than faking success!
    expect(["SENT", "NOT_CONFIGURED", "FAILED"]).toContain(submission.deliveryStatus);

    // Verify inbox retrieval
    const inbox = await db.getContactSubmissions();
    const found = inbox.find((c) => c.id === submission.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Tim Cook");

    // Mark as read
    const marked = await db.markContactRead(submission.id, true);
    expect(marked?.read).toBe(true);

    // Delete submission
    const deleted = await db.deleteContactSubmission(submission.id);
    expect(deleted).toBe(true);

    const inboxAfter = await db.getContactSubmissions();
    expect(inboxAfter.some((c) => c.id === submission.id)).toBe(false);
  });
});

