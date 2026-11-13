import { describe, it, expect } from "vitest";
import * as db from "@/lib/server-db";

describe("Backend Database & Auth System", () => {
  it("authenticates admin with valid credentials", async () => {
    // Test with 'admin'
    const res = await db.authenticateAdmin("admin", "akshay98127");
    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();

    const valid = await db.verifyAdminToken(res.token);
    expect(valid).toBe(true);

    // Test with email
    const emailRes = await db.authenticateAdmin("akshay123modi@gmail.com", "akshay98127");
    expect(emailRes.success).toBe(true);
    expect(emailRes.token).toBeDefined();

    // Test with 'akshay'
    const nameRes = await db.authenticateAdmin("akshay", "akshay98127");
    expect(nameRes.success).toBe(true);
  });

  it("rejects invalid admin credentials", async () => {
    const res = await db.authenticateAdmin("admin", "wrong-password");
    expect(res.success).toBe(false);
  });

  it("loads baseline projects and supports adding, updating and deleting", async () => {
    const initial = await db.getProjects();
    expect(initial.length).toBeGreaterThanOrEqual(3);

    const created = await db.addProject({
      title: "Test Quantum Simulator",
      tagline: "Quantum physics web experiment",
      description: "A physics engine built in TypeScript.",
      category: "Creative",
      tech: ["WebGL", "Three.js"],
      published: true,
      featured: false,
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe("Test Quantum Simulator");

    const updated = await db.updateProject(created.id, { featured: true });
    expect(updated.featured).toBe(true);

    const deleted = await db.deleteProject(created.id);
    expect(deleted).toBe(true);
  });

  it("loads journey milestones and supports full milestone CRUD", async () => {
    const milestones = await db.getJourney();
    expect(milestones.length).toBeGreaterThanOrEqual(6);
    expect(milestones[0]?.id).toBe("m-02-learning");

    const newMilestone = await db.addMilestone({
      title: "AI Hackathon Finalist",
      subtitle: "National AI Challenge",
      description: "Won second runner-up for building an applied vision model.",
      year: "2025",
      stage: "hackathons",
      category: "Competitions",
      status: "completed",
      highlighted: true,
      published: true,
    });

    expect(newMilestone.id).toBeDefined();

    const updated = await db.updateMilestone(newMilestone.id, {
      title: "AI Hackathon Winner",
    });
    expect(updated.title).toBe("AI Hackathon Winner");

    const deleted = await db.deleteMilestone(newMilestone.id);
    expect(deleted).toBe(true);
  });

  it("records contact submissions properly", async () => {
    const submission = await db.submitContact({
      name: "Satya Nadella",
      email: "satya@microsoft.com",
      subject: "Collaboration Opportunity",
      message: "Impressive portfolio and applied engineering work.",
    });

    expect(submission.id).toBeDefined();
    const inbox = await db.getContactSubmissions();
    expect(inbox.some((m) => m.id === submission.id)).toBe(true);
  });

  describe("Direct Image Upload & Storage System", () => {
    // 1x1 transparent PNG encoded in base64
    const validPngBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    it("validates authentic image magic bytes and rejects non-image scripts", () => {
      // 1x1 PNG buffer
      const pngBuf = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );
      const res = db.validateImageMagicBytes(pngBuf);
      expect(res.valid).toBe(true);
      expect(res.ext).toBe("png");
      expect(res.mimeType).toBe("image/png");

      // Shell script disguised as image
      const scriptBuf = Buffer.from("#!/bin/bash\necho 'malicious'", "utf8");
      const scriptRes = db.validateImageMagicBytes(scriptBuf);
      expect(scriptRes.valid).toBe(false);

      // HTML file disguised as image
      const htmlBuf = Buffer.from("<svg onload='alert(1)'></svg>", "utf8");
      const htmlRes = db.validateImageMagicBytes(htmlBuf);
      expect(htmlRes.valid).toBe(false);
    });

    it("uploads and stores a valid image to backend storage", async () => {
      const upload = await db.saveUploadedImage({
        filename: "test-hero.png",
        mimeType: "image/png",
        base64Data: validPngBase64,
      });

      expect(upload.url).toMatch(/^\/uploads\/proj-\d+-[a-f0-9]+\.png$/);
      expect(upload.filename).toBeDefined();
      expect(upload.size).toBeGreaterThan(0);
      expect(upload.mimeType).toBe("image/png");

      const fs = await import("node:fs");
      const path = await import("node:path");

      const publicPath = path.join(process.cwd(), "public", upload.url.replace(/^\//, ""));
      const dataPath = path.join(process.cwd(), "data", "uploads", upload.filename);

      expect(fs.existsSync(publicPath)).toBe(true);
      expect(fs.existsSync(dataPath)).toBe(true);

      // Create a project referencing this image
      const project = await db.addProject({
        title: "Project With Uploaded Image",
        tagline: "Test",
        category: "Web Apps",
        tech: ["React"],
        image: upload.url,
      });

      // While project references this image, orphan cleanup will NOT delete it
      const notDeleted = await db.deleteUploadedFileIfOrphaned(upload.url);
      expect(notDeleted).toBe(false);
      expect(fs.existsSync(publicPath)).toBe(true);

      // Now delete the project: orphan cleanup will delete the image file safely
      await db.deleteProject(project.id);
      expect(fs.existsSync(publicPath)).toBe(false);
      expect(fs.existsSync(dataPath)).toBe(false);
    });

    it("rejects non-image payloads and oversized files", async () => {
      // Reject non-image
      await expect(
        db.saveUploadedImage({
          filename: "bad.png",
          base64Data: Buffer.from("Not an image").toString("base64"),
        }),
      ).rejects.toThrow("Invalid image format");

      // Reject file > 5 MB
      const oversizedBuf = Buffer.alloc(5.5 * 1024 * 1024);
      await expect(
        db.saveUploadedImage({
          filename: "huge.png",
          base64Data: oversizedBuf.toString("base64"),
        }),
      ).rejects.toThrow("exceeds the 5 MB limit");
    });

    it("verifies upload authentication enforcement logic", async () => {
      // Unauthenticated / bad token
      const isBadAuthed = await db.verifyAdminToken("invalid-token");
      expect(isBadAuthed).toBe(false);

      // Authenticated admin token
      const auth = await db.authenticateAdmin("admin", "akshay98127");
      expect(auth.token).toBeDefined();

      const isGoodAuthed = await db.verifyAdminToken(auth.token);
      expect(isGoodAuthed).toBe(true);

      // Proceed with upload when verified
      if (isGoodAuthed) {
        const upload = await db.saveUploadedImage({
          filename: "authed-photo.png",
          mimeType: "image/png",
          base64Data: validPngBase64,
        });

        expect(upload.url).toMatch(/^\/uploads\/proj-/);
        await db.deleteUploadedFileIfOrphaned(upload.url);
      }
    });
  });
});

