import { createServerFn } from "@tanstack/react-start";
import * as db from "./server-db";
import type { Project } from "@/content/projects";
import type { JourneyMilestone } from "@/content/journey";

// ---------------------------------------------------------------------------
// Projects Server Functions
// ---------------------------------------------------------------------------
export const fetchProjectsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await db.getProjects();
});

export const saveProjectFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; project: Partial<Project> }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    if (data.project.id) {
      return await db.updateProject(data.project.id, data.project);
    }
    return await db.addProject(data.project);
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; id: string }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.deleteProject(data.id);
  });

export const reorderProjectsFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; projects: Project[] }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.reorderProjects(data.projects);
  });

// ---------------------------------------------------------------------------
// Journey Milestones Server Functions
// ---------------------------------------------------------------------------
export const fetchJourneyFn = createServerFn({ method: "GET" }).handler(async () => {
  return await db.getJourney();
});

export const saveMilestoneFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; milestone: Partial<JourneyMilestone> }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    if (data.milestone.id) {
      return await db.updateMilestone(data.milestone.id, data.milestone);
    }
    return await db.addMilestone(data.milestone);
  });

export const deleteMilestoneFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; id: string }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.deleteMilestone(data.id);
  });

export const reorderMilestonesFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; milestones: JourneyMilestone[] }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.reorderMilestones(data.milestones);
  });

// ---------------------------------------------------------------------------
// Admin Auth Server Functions
// ---------------------------------------------------------------------------
export const adminLoginFn = createServerFn({ method: "POST" })
  .validator((data: { username: string; pass: string }) => data)
  .handler(async ({ data }) => {
    return await db.authenticateAdmin(data.username, data.pass);
  });

export const adminVerifySessionFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const valid = await db.verifyAdminToken(data.token);
    return { valid };
  });

export const adminLogoutFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    await db.revokeAdminToken(data.token);
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Image Upload Server Functions (Backend-managed storage)
// ---------------------------------------------------------------------------
export const uploadImageFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token?: string | undefined;
      filename: string;
      mimeType: string;
      base64Data: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) {
      throw new Error("Unauthorized: Admin authentication required");
    }
    return await db.saveUploadedImage(data);
  });

export const deleteImageFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; url: string }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) {
      throw new Error("Unauthorized: Admin authentication required");
    }
    const success = await db.deleteUploadedFileIfOrphaned(data.url);
    return { success };
  });

// ---------------------------------------------------------------------------
// Contact Submissions & Self-Managed SMTP Email Notifications
// ---------------------------------------------------------------------------
export const sendContactMessageFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      name: string;
      email: string;
      subject?: string | undefined;
      message: string;
      honeypot?: string | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    return await db.submitContact(data);
  });

export const fetchContactSubmissionsFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.getContactSubmissions();
  });

export const markContactReadFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; id: string; read: boolean }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.markContactRead(data.id, data.read);
  });

export const deleteContactSubmissionFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; id: string }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.deleteContactSubmission(data.id);
  });

export const retryContactEmailFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; id: string }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.retryContactEmail(data.id);
  });

export const fetchSmtpStatusFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.getSmtpStatus();
  });

export const testSmtpConnectionFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; config?: Partial<db.SiteSettings> | undefined }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.testSmtpConnection(data.config);
  });

export const fetchSettingsFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.getSettings();
  });

export const updateSettingsFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; settings: Partial<db.SiteSettings> }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.updateSettings(data.settings);
  });

export const testEmailAutomationFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string | undefined; webhookUrl?: string | undefined }) => data)
  .handler(async ({ data }) => {
    const isAuthed = await db.verifyAdminToken(data.token);
    if (!isAuthed) throw new Error("Unauthorized: Admin authentication required");
    return await db.testEmailAutomation(data.webhookUrl);
  });

