import { PROJECTS, type Project } from "../content/projects";
import { JOURNEY_MILESTONES, type JourneyMilestone } from "../content/journey";
import {
  sendContactEmailNotification,
  testSmtpConnection as executeSmtpTest,
  resolveSmtpConfig,
  type SmtpStatusResult,
} from "./email-service";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  deliveryStatus: "SENT" | "FAILED" | "NOT_CONFIGURED" | "PENDING";
  deliveryError?: string | undefined;
}

export interface AdminUser {
  id: string;
  username: string;
  role: "admin";
}

export interface SiteSettings {
  googleWebhookUrl?: string | undefined;
  notificationEmail?: string | undefined;
  smtpHost?: string | undefined;
  smtpPort?: number | string | undefined;
  smtpUser?: string | undefined;
  smtpPassword?: string | undefined;
  smtpFrom?: string | undefined;
}

interface DbSchema {
  projects: Project[];
  journey: JourneyMilestone[];
  contacts: ContactSubmission[];
  adminTokens: Record<string, { username: string; expiresAt: number }>;
  settings?: SiteSettings | undefined;
}

// In-memory runtime cache
let memoryDb: DbSchema = {
  projects: [...PROJECTS],
  journey: [...JOURNEY_MILESTONES],
  contacts: [],
  adminTokens: {},
  settings: {
    notificationEmail: process.env["CONTACT_RECEIVER_EMAIL"] || "akshay123modi@gmail.com",
    googleWebhookUrl: process.env["GOOGLE_SCRIPT_WEBHOOK_URL"] || "",
  },
};

let isInitialized = false;

// Helpers to interact with filesystem and environment in Node environment
async function getNodeModules() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const os = await import("node:os");
  const crypto = await import("node:crypto");
  return { fs, path, os, crypto };
}

async function getDataPaths() {
  const { path, os } = await getNodeModules();
  const isServerless = Boolean(
    process.env["VERCEL"] ||
    process.env["AWS_LAMBDA_FUNCTION_NAME"] ||
    process.env["NOW_REGION"]
  );

  const baseDir = isServerless
    ? path.join(os.tmpdir(), "akm-portfolio-data")
    : path.join(process.cwd(), "data");

  const bundledDir = path.join(process.cwd(), "data");
  const dbPath = path.join(baseDir, "portfolio-db.json");
  const bundledDbPath = path.join(bundledDir, "portfolio-db.json");

  return {
    isServerless,
    baseDir,
    bundledDir,
    dbPath,
    bundledDbPath,
    dataUploads: path.join(baseDir, "uploads"),
    publicUploads: path.join(process.cwd(), "public", "uploads"),
  };
}

async function initDb() {
  if (isInitialized) return;
  isInitialized = true;

  if (typeof window !== "undefined") return;

  try {
    const { fs, path } = await getNodeModules();
    const { baseDir, dbPath, bundledDbPath, dataUploads, publicUploads } = await getDataPaths();

    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (err) {
        console.warn("[server-db] Base directory create warning:", err);
      }
    }

    // Attempt to load from active dbPath first; fallback to bundledDbPath
    const sourcePath = fs.existsSync(dbPath)
      ? dbPath
      : fs.existsSync(bundledDbPath)
        ? bundledDbPath
        : null;

    if (sourcePath) {
      try {
        const raw = fs.readFileSync(sourcePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          memoryDb.projects = parsed.projects;
        }
        if (parsed.journey && Array.isArray(parsed.journey) && parsed.journey.length > 0) {
          memoryDb.journey = parsed.journey;
        }
        if (parsed.contacts && Array.isArray(parsed.contacts)) {
          memoryDb.contacts = parsed.contacts.map((c: any) => ({
            id: c.id,
            name: c.name || "Anonymous",
            email: c.email || "no-email@provided.com",
            subject: c.subject || "Portfolio Inquiry",
            message: c.message || "",
            createdAt: c.createdAt || new Date().toISOString(),
            read: typeof c.read === "boolean" ? c.read : false,
            deliveryStatus: c.deliveryStatus || "SENT",
            ...(c.deliveryError ? { deliveryError: c.deliveryError } : {}),
          }));
        }
        if (parsed.adminTokens) {
          memoryDb.adminTokens = { ...memoryDb.adminTokens, ...parsed.adminTokens };
        }
        if (parsed.settings) {
          memoryDb.settings = parsed.settings;
        }
      } catch (e) {
        console.warn("[server-db] Failed to parse db json:", e);
      }
    } else {
      // First run: save bundled baseline to disk if writable
      try {
        fs.writeFileSync(dbPath, JSON.stringify(memoryDb, null, 2), "utf8");
      } catch {}
    }

    // Ensure upload directories exist and sync files from data/uploads to public/uploads
    try {
      if (!fs.existsSync(publicUploads)) {
        fs.mkdirSync(publicUploads, { recursive: true });
      }
    } catch {}
    try {
      if (!fs.existsSync(dataUploads)) {
        fs.mkdirSync(dataUploads, { recursive: true });
      }
    } catch {}

    // Restore any persistent uploads from data/uploads into public/uploads
    if (fs.existsSync(dataUploads) && fs.existsSync(publicUploads)) {
      try {
        const files = fs.readdirSync(dataUploads);
        for (const file of files) {
          const src = path.join(dataUploads, file);
          const dst = path.join(publicUploads, file);
          if (!fs.existsSync(dst) && fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dst);
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn("[server-db] Initialization fallback to in-memory store:", err);
  }
}

async function persistDb() {
  if (typeof window !== "undefined") return;

  try {
    const { fs, path } = await getNodeModules();
    const { baseDir, dbPath } = await getDataPaths();

    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (err) {
        console.warn("[server-db] Base directory create warning on persist:", err);
      }
    }

    const tmpPath = `${dbPath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(memoryDb, null, 2), "utf8");
    try {
      fs.renameSync(tmpPath, dbPath);
    } catch {
      // If rename fails across partitions/tmp mounts, fallback to copy + delete
      fs.copyFileSync(tmpPath, dbPath);
      try { fs.unlinkSync(tmpPath); } catch {}
    }

    // Sync memoryDb.journey back to src/content/journey.ts if running in local environment
    try {
      const journeyFilePath = path.join(process.cwd(), "src", "content", "journey.ts");
      if (fs.existsSync(journeyFilePath) && Array.isArray(memoryDb.journey) && memoryDb.journey.length > 0) {
        const currentContent = fs.readFileSync(journeyFilePath, "utf8");
        const marker = "export const JOURNEY_MILESTONES: JourneyMilestone[] = ";
        const idx = currentContent.indexOf(marker);
        if (idx !== -1) {
          const header = currentContent.substring(0, idx + marker.length);
          const formatted = JSON.stringify(memoryDb.journey, null, 2);
          const newContent = `${header}${formatted};\n`;
          if (newContent !== currentContent) {
            fs.writeFileSync(journeyFilePath, newContent, "utf8");
          }
        }
      }
    } catch (syncErr) {
      console.warn("[server-db] Warning syncing journey to content file:", syncErr);
    }
  } catch (err) {
    console.warn("[server-db] Disk write fallback:", err);
  }
}

// ---------------------------------------------------------------------------
// Projects API
// ---------------------------------------------------------------------------
export async function getProjects(): Promise<Project[]> {
  await initDb();
  return [...memoryDb.projects].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function addProject(project: Partial<Project>): Promise<Project> {
  await initDb();
  const maxSort = memoryDb.projects.reduce((m, p) => Math.max(m, p.sortOrder), 0);
  const id = project.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const slug =
    project.slug ||
    (project.title ? project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `project-${Date.now()}`);

  const newProject: Project = {
    id,
    slug,
    title: project.title || "Untitled Project",
    tagline: project.tagline || "",
    description: project.description || "",
    fullDescription: project.fullDescription || project.description || "",
    category: project.category || "Creative",
    tech: project.tech || [],
    image: project.image || "/placeholder.svg",
    screenshots: project.screenshots || [],
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    projectUrl: project.projectUrl,
    featured: project.featured ?? false,
    published: project.published ?? true,
    sortOrder: project.sortOrder ?? maxSort + 1,
    createdAt: new Date().toISOString(),
  };

  memoryDb.projects.push(newProject);
  memoryDb.projects.sort((a, b) => a.sortOrder - b.sortOrder);
  await persistDb();
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  await initDb();
  const index = memoryDb.projects.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Project not found");

  const current = memoryDb.projects[index];
  if (!current) throw new Error("Project not found");
  const oldImage = current.image;

  const updated: Project = {
    ...current,
    ...updates,
    id: current.id, // preserve id
    slug: updates.slug ?? current.slug,
    title: updates.title ?? current.title,
    tagline: updates.tagline ?? current.tagline,
    description: updates.description ?? current.description,
    category: updates.category ?? current.category,
    tech: updates.tech ?? current.tech,
    image: updates.image ?? current.image,
    published: updates.published ?? current.published,
    sortOrder: updates.sortOrder ?? current.sortOrder,
  };

  memoryDb.projects[index] = updated;
  memoryDb.projects.sort((a, b) => a.sortOrder - b.sortOrder);
  await persistDb();

  // If cover image was changed and old image is an uploaded file, remove it if orphaned
  if (updates.image && updates.image !== oldImage && oldImage && oldImage.startsWith("/uploads/")) {
    await deleteUploadedFileIfOrphaned(oldImage);
  }

  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  await initDb();
  const target = memoryDb.projects.find((p) => p.id === id);
  if (!target) return false;

  memoryDb.projects = memoryDb.projects.filter((p) => p.id !== id);
  await persistDb();

  // Clean up any uploaded files if orphaned
  if (target.image && target.image.startsWith("/uploads/")) {
    await deleteUploadedFileIfOrphaned(target.image);
  }
  if (Array.isArray(target.screenshots)) {
    for (const shot of target.screenshots) {
      if (shot && shot.startsWith("/uploads/")) {
        await deleteUploadedFileIfOrphaned(shot);
      }
    }
  }

  return true;
}

export async function reorderProjects(reorderedList: Project[]): Promise<Project[]> {
  await initDb();
  const updated = reorderedList.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
  memoryDb.projects = updated;
  await persistDb();
  return updated;
}

// ---------------------------------------------------------------------------
// Journey API
// ---------------------------------------------------------------------------
export async function getJourney(): Promise<JourneyMilestone[]> {
  await initDb();
  return [...memoryDb.journey].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function addMilestone(milestone: Partial<JourneyMilestone>): Promise<JourneyMilestone> {
  await initDb();
  const maxSort = memoryDb.journey.reduce((m, item) => Math.max(m, item.sortOrder), 0);
  const id = milestone.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug =
    milestone.slug ||
    (milestone.title ? milestone.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `milestone-${Date.now()}`);

  const newMilestone: JourneyMilestone = {
    id,
    slug,
    stage: milestone.stage || "building",
    title: milestone.title || "New Milestone",
    subtitle: milestone.subtitle || "",
    description: milestone.description || "",
    year: milestone.year || new Date().getFullYear().toString(),
    dateRange: milestone.dateRange || milestone.year || "",
    category: milestone.category || "Milestone",
    iconName: milestone.iconName || "Sparkles",
    status: milestone.status || "completed",
    highlighted: milestone.highlighted ?? false,
    published: milestone.published ?? true,
    sortOrder: milestone.sortOrder ?? maxSort + 1,
    tags: milestone.tags || [],
    createdAt: new Date().toISOString(),
  };
  if (milestone.imageUrl) {
    newMilestone.imageUrl = milestone.imageUrl;
  }

  memoryDb.journey.push(newMilestone);
  memoryDb.journey.sort((a, b) => a.sortOrder - b.sortOrder);
  await persistDb();
  return newMilestone;
}

export async function updateMilestone(
  id: string,
  updates: Partial<JourneyMilestone>,
): Promise<JourneyMilestone> {
  await initDb();
  const index = memoryDb.journey.findIndex((m) => m.id === id);
  if (index === -1) {
    return await addMilestone({ ...updates, id });
  }

  const current = memoryDb.journey[index];
  if (!current) {
    return await addMilestone({ ...updates, id });
  }
  const oldImage = current.imageUrl;

  const updated: JourneyMilestone = {
    ...current,
    ...updates,
    id: current.id,
    slug: updates.slug ?? current.slug,
    stage: updates.stage ?? current.stage,
    title: updates.title ?? current.title,
    subtitle: updates.subtitle ?? current.subtitle,
    description: updates.description ?? current.description,
    year: updates.year ?? current.year,
    dateRange: updates.dateRange ?? current.dateRange,
    category: updates.category ?? current.category,
    iconName: updates.iconName ?? current.iconName,
    status: updates.status ?? current.status,
    highlighted: updates.highlighted ?? current.highlighted,
    published: updates.published ?? current.published,
    sortOrder: updates.sortOrder ?? current.sortOrder,
  };

  memoryDb.journey[index] = updated;
  memoryDb.journey.sort((a, b) => a.sortOrder - b.sortOrder);
  await persistDb();

  if (updates.imageUrl && updates.imageUrl !== oldImage && oldImage && oldImage.startsWith("/uploads/")) {
    await deleteUploadedFileIfOrphaned(oldImage);
  }

  return updated;
}

export async function deleteMilestone(id: string): Promise<boolean> {
  await initDb();
  const target = memoryDb.journey.find((m) => m.id === id);
  if (!target) return false;

  memoryDb.journey = memoryDb.journey.filter((m) => m.id !== id);
  await persistDb();

  if (target.imageUrl && target.imageUrl.startsWith("/uploads/")) {
    await deleteUploadedFileIfOrphaned(target.imageUrl);
  }

  return true;
}

export async function reorderMilestones(reorderedList: JourneyMilestone[]): Promise<JourneyMilestone[]> {
  await initDb();
  const updated = reorderedList.map((m, idx) => ({ ...m, sortOrder: idx + 1 }));
  memoryDb.journey = updated;
  await persistDb();
  return updated;
}

// ---------------------------------------------------------------------------
// Contact Submissions, Anti-Spam & Direct SMTP Email Notification Engine
// ---------------------------------------------------------------------------
interface RateLimitRecord {
  timestamps: number[];
  lastHash?: string;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimitAndSpam(
  identifier: string,
  messageHash: string,
): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxSubmissions = 5;
  const minIntervalMs = 4000; // 4 seconds between submissions

  const record = rateLimitMap.get(identifier) || { timestamps: [] };
  // Keep timestamps within sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  const lastTime = record.timestamps[record.timestamps.length - 1];
  if (lastTime && now - lastTime < minIntervalMs) {
    return {
      allowed: false,
      reason: "Please wait a moment before sending another message.",
    };
  }

  if (record.timestamps.length >= maxSubmissions) {
    return {
      allowed: false,
      reason: "Transmission limit reached (5 messages / 10 mins). Please try again shortly.",
    };
  }

  // Duplicate detection within 5 minutes
  if (record.lastHash === messageHash && lastTime && now - lastTime < 5 * 60 * 1000) {
    return {
      allowed: false,
      reason: "Duplicate message detected. Your previous message has already been received.",
    };
  }

  record.timestamps.push(now);
  record.lastHash = messageHash;
  rateLimitMap.set(identifier, record);
  return { allowed: true };
}

export async function submitContact(data: {
  name: string;
  email: string;
  subject?: string | undefined;
  message: string;
  honeypot?: string | undefined;
  clientIp?: string | undefined;
}): Promise<ContactSubmission> {
  await initDb();

  // 1. Honeypot bot protection
  if (data.honeypot && data.honeypot.trim().length > 0) {
    throw new Error("Spam detection triggered. Message transmission dropped.");
  }

  const name = data.name.trim();
  const email = data.email.trim();
  const subject = data.subject?.trim() || "Portfolio Inquiry";
  const message = data.message.trim();

  // 2. Data validation
  if (!name || name.length < 2) {
    throw new Error("Please enter your full name (at least 2 characters).");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!message || message.length < 5) {
    throw new Error("Message must be at least 5 characters.");
  }

  // 3. Rate limiting & spam throttling
  const identifier = `${email.toLowerCase()}_${data.clientIp || "client"}`;
  const crypto = await import("node:crypto");
  const messageHash = crypto
    .createHash("md5")
    .update(`${email}_${subject}_${message}`)
    .digest("hex");

  const rateCheck = checkRateLimitAndSpam(identifier, messageHash);
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.reason || "Submission rejected by rate limiter.");
  }

  // 4. Save to persistent database
  const submission: ContactSubmission = {
    id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    email,
    subject,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    deliveryStatus: "PENDING",
  };

  memoryDb.contacts.unshift(submission);
  await persistDb();

  // 5. Send Direct SMTP Email Notification
  try {
    const smtpResult = await sendContactEmailNotification(
      {
        name: submission.name,
        email: submission.email,
        subject: submission.subject,
        message: submission.message,
        createdAt: submission.createdAt,
      },
      memoryDb.settings,
    );

    submission.deliveryStatus = smtpResult.status;
    if (smtpResult.error) {
      submission.deliveryError = smtpResult.error;
    }
  } catch (err: unknown) {
    submission.deliveryStatus = "FAILED";
    submission.deliveryError =
      err instanceof Error ? err.message : "SMTP transmission failed";
  }

  // Optional: Also notify via Google Apps Script Webhook if configured
  const webhookUrl =
    memoryDb.settings?.googleWebhookUrl?.trim() ||
    process.env["GOOGLE_SCRIPT_WEBHOOK_URL"]?.trim() ||
    process.env["VITE_GOOGLE_SCRIPT_WEBHOOK_URL"]?.trim();

  if (webhookUrl && webhookUrl.startsWith("http")) {
    try {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: submission.name,
          email: submission.email,
          subject: submission.subject,
          message: submission.message,
          timestamp: submission.createdAt,
          recipientEmail:
            memoryDb.settings?.notificationEmail ||
            process.env["CONTACT_RECEIVER_EMAIL"] ||
            "akshay123modi@gmail.com",
        }),
      }).catch((err) => {
        console.warn("[email-automation] Backup webhook delivery failed:", err);
      });
    } catch {
      // Non-fatal
    }
  }

  await persistDb();
  return submission;
}

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  await initDb();
  return [...memoryDb.contacts];
}

export async function markContactRead(id: string, read: boolean): Promise<ContactSubmission | null> {
  await initDb();
  const item = memoryDb.contacts.find((c) => c.id === id);
  if (!item) return null;
  item.read = read;
  await persistDb();
  return item;
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
  await initDb();
  const initialLen = memoryDb.contacts.length;
  memoryDb.contacts = memoryDb.contacts.filter((c) => c.id !== id);
  if (memoryDb.contacts.length !== initialLen) {
    await persistDb();
    return true;
  }
  return false;
}

export async function retryContactEmail(
  id: string,
): Promise<{ success: boolean; submission?: ContactSubmission; error?: string }> {
  await initDb();
  const submission = memoryDb.contacts.find((c) => c.id === id);
  if (!submission) {
    return { success: false, error: "Message not found" };
  }

  const smtpResult = await sendContactEmailNotification(
    {
      name: submission.name,
      email: submission.email,
      subject: submission.subject,
      message: submission.message,
      createdAt: submission.createdAt,
    },
    memoryDb.settings,
  );

  submission.deliveryStatus = smtpResult.status;
  if (smtpResult.error) {
    submission.deliveryError = smtpResult.error;
  } else {
    delete submission.deliveryError;
  }
  await persistDb();

  return {
    success: smtpResult.success,
    submission,
    ...(smtpResult.error ? { error: smtpResult.error } : {}),
  };
}

export async function getSmtpStatus(): Promise<SmtpStatusResult> {
  await initDb();
  const resolved = resolveSmtpConfig(memoryDb.settings);
  return resolved.status;
}

export async function testSmtpConnection(
  configOverride?: Partial<SiteSettings> | undefined,
): Promise<{ success: boolean; message: string }> {
  await initDb();
  const settingsToUse = {
    ...memoryDb.settings,
    ...configOverride,
  };
  return await executeSmtpTest(settingsToUse);
}

export async function getSettings(): Promise<SiteSettings> {
  await initDb();
  const receiver =
    memoryDb.settings?.notificationEmail ||
    process.env["CONTACT_RECEIVER_EMAIL"] ||
    "akshay123modi@gmail.com";

  return {
    notificationEmail: receiver,
    googleWebhookUrl:
      memoryDb.settings?.googleWebhookUrl ||
      process.env["GOOGLE_SCRIPT_WEBHOOK_URL"] ||
      "",
    smtpHost: memoryDb.settings?.smtpHost || process.env["SMTP_HOST"] || "",
    smtpPort: memoryDb.settings?.smtpPort || (process.env["SMTP_PORT"] ? parseInt(process.env["SMTP_PORT"], 10) : 465),
    smtpUser: memoryDb.settings?.smtpUser || process.env["SMTP_USER"] || "",
    smtpFrom: memoryDb.settings?.smtpFrom || process.env["SMTP_FROM"] || "",
    // Mask password if exists
    smtpPassword:
      memoryDb.settings?.smtpPassword || process.env["SMTP_PASSWORD"] ? "••••••••" : "",
  };
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  await initDb();
  // If smtpPassword is sent as '••••••••', keep existing password
  const cleanUpdates = { ...updates };
  if (cleanUpdates.smtpPassword === "••••••••" || cleanUpdates.smtpPassword === "") {
    delete cleanUpdates.smtpPassword;
  }

  memoryDb.settings = {
    ...memoryDb.settings,
    ...cleanUpdates,
  };
  await persistDb();
  return await getSettings();
}

export async function testEmailAutomation(webhookUrlOverride?: string | undefined): Promise<{ success: boolean; message: string }> {
  await initDb();
  const webhookUrl =
    webhookUrlOverride?.trim() ||
    memoryDb.settings?.googleWebhookUrl?.trim() ||
    process.env["GOOGLE_SCRIPT_WEBHOOK_URL"]?.trim();

  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "Please configure a valid Google Apps Script Webhook URL first.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Akshay Kumar Modi (Admin Test)",
        email: "akshay123modi@gmail.com",
        subject: "⚡ Test Email Automation from Portfolio",
        message: "Hello Akshay! This is a test message to confirm your Google Apps Script email automation is working properly. Whenever a visitor fills your contact form, you will receive an email just like this one!",
        timestamp: new Date().toISOString(),
        recipientEmail: memoryDb.settings?.notificationEmail || "akshay123modi@gmail.com",
      }),
    });

    if (res.ok) {
      return {
        success: true,
        message: "Test email successfully dispatched to akshay123modi@gmail.com via Google Apps Script!",
      };
    } else {
      return {
        success: false,
        message: `Google Apps Script returned HTTP ${res.status}. Make sure your deployment is set to "Anyone".`,
      };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to connect to Google Apps Script webhook.",
    };
  }
}

// ---------------------------------------------------------------------------
// Admin Authentication (Independent Backend, no Supabase required)
// ---------------------------------------------------------------------------
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "akshay98127";

// Accepted usernames to make admin login completely seamless
const VALID_ADMIN_USERNAMES = [
  "admin",
  "akshay",
  "akshaymodi",
  "akshay123modi@gmail.com",
];

// Accepted passwords (current + legacy fallback)
const VALID_ADMIN_PASSWORDS = [
  "akshay98127",
  "akshay-admin-2026",
];

const ADMIN_SECRET =
  process.env["ADMIN_SECRET"] ||
  process.env["ADMIN_PASSWORD"] ||
  "akshay-portfolio-secret-admin-key-2026-auth";

async function createSignedAdminToken(username: string): Promise<string> {
  const { crypto } = await getNodeModules();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const data = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_SECRET).update(data).digest("base64url");
  return `adm_${data}.${sig}`;
}

async function verifySignedAdminToken(token: string): Promise<{ valid: boolean; username?: string; expiresAt?: number }> {
  if (!token || typeof token !== "string" || !token.startsWith("adm_")) {
    return { valid: false };
  }
  const rest = token.slice(4);
  const dotIndex = rest.indexOf(".");
  if (dotIndex === -1) {
    return { valid: false };
  }
  const data = rest.slice(0, dotIndex);
  const sig = rest.slice(dotIndex + 1);

  try {
    const { crypto } = await getNodeModules();
    const expectedSig = crypto.createHmac("sha256", ADMIN_SECRET).update(data).digest("base64url");
    if (sig.length !== expectedSig.length) return { valid: false };
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (!crypto.timingSafeEqual(a, b)) return { valid: false };

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof payload.exp === "number" && payload.exp > Date.now()) {
      return { valid: true, username: payload.u || "admin", expiresAt: payload.exp };
    }
  } catch {
    return { valid: false };
  }
  return { valid: false };
}

export async function authenticateAdmin(
  username: string,
  pass: string,
): Promise<{ success: boolean; token?: string; user?: AdminUser; error?: string }> {
  await initDb();
  const envUser = process.env["ADMIN_USERNAME"]?.trim().toLowerCase();
  const envPass = process.env["ADMIN_PASSWORD"]?.trim();

  const inputUser = username.trim().toLowerCase();
  const inputPass = pass.trim();

  const isUserValid =
    (envUser ? inputUser === envUser : false) ||
    VALID_ADMIN_USERNAMES.includes(inputUser) ||
    inputUser === DEFAULT_ADMIN_USER;

  const isPassValid =
    (envPass ? inputPass === envPass : false) ||
    VALID_ADMIN_PASSWORDS.includes(inputPass) ||
    inputPass === DEFAULT_ADMIN_PASS;

  if (isUserValid && isPassValid) {
    const token = await createSignedAdminToken(inputUser);
    // Token valid for 7 days
    memoryDb.adminTokens[token] = {
      username: inputUser,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    await persistDb();
    return {
      success: true,
      token,
      user: { id: "admin-1", username: inputUser, role: "admin" },
    };
  }

  return { success: false, error: "Invalid username or password." };
}

export async function verifyAdminToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  await initDb();
  // 1. In-memory fast path
  const entry = memoryDb.adminTokens[token];
  if (entry) {
    if (entry.expiresAt < Date.now()) {
      delete memoryDb.adminTokens[token];
      await persistDb();
      return false;
    }
    return true;
  }

  // 2. Stateless HMAC verification (survives Vercel serverless container restarts and lambda scale-out)
  const verified = await verifySignedAdminToken(token);
  if (verified.valid && verified.expiresAt) {
    memoryDb.adminTokens[token] = {
      username: verified.username || "admin",
      expiresAt: verified.expiresAt,
    };
    return true;
  }

  return false;
}

export async function revokeAdminToken(token: string): Promise<void> {
  await initDb();
  delete memoryDb.adminTokens[token];
  await persistDb();
}

// ---------------------------------------------------------------------------
// Image Upload & Asset Management (Backend-managed local storage)
// ---------------------------------------------------------------------------
export interface UploadedImageResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Validates image buffer magic bytes to ensure file is authentically a JPG, PNG, or WebP.
 * Strictly disallows scripts, HTML, executables, or disguised payloads.
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; ext: string; mimeType: string } {
  // Check PNG (8 bytes: 89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, ext: "png", mimeType: "image/png" };
  }

  // Check JPEG (3 bytes: FF D8 FF)
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, ext: "jpg", mimeType: "image/jpeg" };
  }

  // Check WebP: RIFF [4 bytes size] WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50    // P
  ) {
    return { valid: true, ext: "webp", mimeType: "image/webp" };
  }

  return { valid: false, ext: "", mimeType: "" };
}

/**
 * Saves uploaded image to persistent backend storage (public/uploads and data/uploads).
 * Generates unique filename, enforces 5 MB size limit and image magic bytes.
 */
export async function saveUploadedImage(data: {
  filename: string;
  mimeType?: string;
  base64Data: string;
}): Promise<UploadedImageResult> {
  await initDb();

  if (!data.base64Data) {
    throw new Error("No image data provided.");
  }

  // Strip data URL scheme prefix if present
  const commaIndex = data.base64Data.indexOf(",");
  const base64Clean = commaIndex !== -1 ? data.base64Data.slice(commaIndex + 1) : data.base64Data;
  const buffer = Buffer.from(base64Clean, "base64");

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (buffer.length > MAX_SIZE) {
    throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`);
  }

  if (buffer.length < 12) {
    throw new Error("Invalid or empty image file.");
  }

  // Validate magic bytes for security against executable scripts / malicious files
  const magicValidation = validateImageMagicBytes(buffer);
  if (!magicValidation.valid) {
    throw new Error("Invalid image format. Only JPG, PNG, and WebP images are permitted.");
  }

  const ext = magicValidation.ext;
  const { fs, path, crypto } = await getNodeModules();
  const { dataUploads, publicUploads } = await getDataPaths();

  const randomHash = crypto.randomBytes(4).toString("hex");
  const timestamp = Date.now();
  const safeFilename = `proj-${timestamp}-${randomHash}.${ext}`;

  try {
    if (!fs.existsSync(dataUploads)) {
      fs.mkdirSync(dataUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(dataUploads, safeFilename), buffer);
  } catch (err) {
    console.warn("[server-db] Data uploads write warning:", err);
  }

  try {
    if (!fs.existsSync(publicUploads)) {
      fs.mkdirSync(publicUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(publicUploads, safeFilename), buffer);
  } catch {
    // Expected on read-only publicDir
  }

  // If .output/public exists (Nitro/build output), also write there for immediate serving
  try {
    const outputPublicDir = path.join(process.cwd(), ".output", "public", "uploads");
    if (fs.existsSync(path.dirname(outputPublicDir))) {
      if (!fs.existsSync(outputPublicDir)) {
        fs.mkdirSync(outputPublicDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outputPublicDir, safeFilename), buffer);
    }
  } catch {
    // Non-fatal if output directory is not yet built
  }

  return {
    url: `/uploads/${safeFilename}`,
    filename: safeFilename,
    size: buffer.length,
    mimeType: magicValidation.mimeType,
  };
}

/**
 * Safely removes an uploaded file if it is no longer referenced in any project or milestone.
 */
export async function deleteUploadedFileIfOrphaned(relativeUrl: string): Promise<boolean> {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) return false;
  await initDb();

  // Check if any project is still using this image
  const isUsedInProjects = memoryDb.projects.some(
    (p) => p.image === relativeUrl || (Array.isArray(p.screenshots) && p.screenshots.includes(relativeUrl)),
  );
  const isUsedInJourney = memoryDb.journey.some((m) => m.imageUrl === relativeUrl);

  if (isUsedInProjects || isUsedInJourney) {
    return false; // Still referenced, do not delete
  }

  try {
    const { fs, path } = await getNodeModules();
    const { dataUploads, publicUploads } = await getDataPaths();
    const filename = path.basename(relativeUrl);

    // Sanitize to prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return false;
    }

    const publicPath = path.join(publicUploads, filename);
    const dataPath = path.join(dataUploads, filename);
    const outputPath = path.join(process.cwd(), ".output", "public", "uploads", filename);

    if (fs.existsSync(publicPath)) { try { fs.unlinkSync(publicPath); } catch {} }
    if (fs.existsSync(dataPath)) { try { fs.unlinkSync(dataPath); } catch {} }
    if (fs.existsSync(outputPath)) { try { fs.unlinkSync(outputPath); } catch {} }
    return true;
  } catch (err) {
    console.warn("[server-db] Failed to clean up orphaned upload file:", err);
    return false;
  }
}
