import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Github,
  Sparkles,
  LogOut,
  ArrowLeft,
  Check,
  AlertTriangle,
  FolderGit2,
  Milestone as MilestoneIcon,
  Compass,
  Trophy,
  Rocket,
  TrendingUp,
  Flame,
  Code2,
  Mail,
  Send,
  Copy,
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Inbox,
  MailCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useProjects } from "@/hooks/use-projects";
import { useJourney } from "@/hooks/use-journey";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
import { MilestoneDialog } from "@/components/admin/MilestoneDialog";
import { Button } from "@/components/ui/button";
import { type Project, resolveProjectImage, getDefaultProjectImage } from "@/content/projects";
import type { JourneyMilestone } from "@/content/journey";
import type { ContactSubmission, SiteSettings } from "@/lib/server-db";
import type { SmtpStatusResult } from "@/lib/email-service";
import {
  fetchContactSubmissionsFn,
  deleteContactSubmissionFn,
  markContactReadFn,
  retryContactEmailFn,
  fetchSmtpStatusFn,
  testSmtpConnectionFn,
  fetchSettingsFn,
  updateSettingsFn,
  testEmailAutomationFn,
} from "@/lib/server-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Akshay Kumar Modi" },
      { name: "description", content: "Complete portfolio content management." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading: adminLoading, login, logout } = useAdmin();
  const {
    allProjects,
    isLoading: projectsLoading,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    resetProjectsToDefault,
  } = useProjects();

  const {
    allMilestones,
    isLoading: journeyLoading,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderMilestones,
    resetMilestonesToDefault,
  } = useJourney();

  // Active section tab
  const [activeTab, setActiveTab] = useState<"projects" | "journey" | "messages">("projects");

  // Messages & Direct SMTP Email Automation state
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread" | "sent" | "failed">("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Settings Cache Key
  const SETTINGS_STORAGE_KEY = "akm_portfolio_settings";

  const getCachedSettings = useCallback((): Partial<SiteSettings> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const initialSettings = getCachedSettings();

  // SMTP Settings & Live Engine state
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatusResult | null>(null);
  const [smtpHost, setSmtpHost] = useState(initialSettings.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(
    initialSettings.smtpPort ? String(initialSettings.smtpPort) : "465",
  );
  const [smtpUser, setSmtpUser] = useState(initialSettings.smtpUser || "");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState(initialSettings.smtpFrom || "");
  const [receiverEmail, setReceiverEmail] = useState(
    initialSettings.notificationEmail || "akshay123modi@gmail.com",
  );
  const [isSmtpConfigOpen, setIsSmtpConfigOpen] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Optional legacy backup webhook state
  const [webhookUrl, setWebhookUrl] = useState(initialSettings.googleWebhookUrl || "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const getAdminToken = () => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("akm_admin_token") || undefined;
  };

  const loadContactsAndSettings = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      setContactsLoading(true);
      const [messages, settings, status] = await Promise.all([
        fetchContactSubmissionsFn({ data: { token } }),
        fetchSettingsFn({ data: { token } }),
        fetchSmtpStatusFn({ data: { token } }),
      ]);
      setContacts(messages);
      setSmtpStatus(status);
      if (settings.smtpHost) setSmtpHost(settings.smtpHost);
      if (settings.smtpPort) setSmtpPort(String(settings.smtpPort));
      if (settings.smtpUser) setSmtpUser(settings.smtpUser);
      if (settings.smtpFrom) setSmtpFrom(settings.smtpFrom);
      if (settings.notificationEmail) setReceiverEmail(settings.notificationEmail);
      if (settings.googleWebhookUrl) setWebhookUrl(settings.googleWebhookUrl);

      // Cache to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch {}
      }
    } catch (err) {
      console.warn("Failed to load contacts or settings:", err);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadContactsAndSettings();
    }
  }, [isAdmin, loadContactsAndSettings]);

  // Save SMTP Settings
  const handleSaveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    setSavingSmtp(true);
    setSmtpTestResult(null);

    const portNum = parseInt(smtpPort, 10);

    try {
      await updateSettingsFn({
        data: {
          token,
          settings: {
            smtpHost: smtpHost.trim(),
            smtpPort: isNaN(portNum) ? 465 : portNum,
            smtpUser: smtpUser.trim(),
            ...(smtpPassword.trim() ? { smtpPassword: smtpPassword.trim() } : {}),
            smtpFrom: smtpFrom.trim(),
            notificationEmail: receiverEmail.trim() || "akshay123modi@gmail.com",
          },
        },
      });

      const updatedStatus = await fetchSmtpStatusFn({ data: { token } });
      setSmtpStatus(updatedStatus);
      setSmtpTestResult({
        success: true,
        message: "SMTP notification credentials saved securely to backend storage!",
      });
      setSmtpPassword("");

      if (typeof window !== "undefined") {
        try {
          const current = getCachedSettings();
          localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({
              ...current,
              smtpHost: smtpHost.trim(),
              smtpPort: isNaN(portNum) ? 465 : portNum,
              smtpUser: smtpUser.trim(),
              smtpFrom: smtpFrom.trim(),
              notificationEmail: receiverEmail.trim() || "akshay123modi@gmail.com",
            }),
          );
        } catch {}
      }
    } catch (err: unknown) {
      setSmtpTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to save SMTP settings",
      });
    } finally {
      setSavingSmtp(false);
    }
  };

  // Test SMTP Connection & Send Real Verification Email
  const handleTestSmtp = async () => {
    const token = getAdminToken();
    setTestingSmtp(true);
    setSmtpTestResult(null);

    const portNum = parseInt(smtpPort, 10);
    const configOverride: Partial<SiteSettings> = {
      ...(smtpHost.trim() ? { smtpHost: smtpHost.trim() } : {}),
      ...(isNaN(portNum) ? {} : { smtpPort: portNum }),
      ...(smtpUser.trim() ? { smtpUser: smtpUser.trim() } : {}),
      ...(smtpPassword.trim() && smtpPassword !== "••••••••" ? { smtpPassword: smtpPassword.trim() } : {}),
      ...(smtpFrom.trim() ? { smtpFrom: smtpFrom.trim() } : {}),
      ...(receiverEmail.trim() ? { notificationEmail: receiverEmail.trim() } : {}),
    };

    try {
      const res = await testSmtpConnectionFn({
        data: { token, config: Object.keys(configOverride).length > 0 ? configOverride : undefined },
      });
      setSmtpTestResult(res);
      // Reload status
      const updatedStatus = await fetchSmtpStatusFn({ data: { token } });
      setSmtpStatus(updatedStatus);
    } catch (err: unknown) {
      setSmtpTestResult({
        success: false,
        message: err instanceof Error ? err.message : "SMTP connection test error",
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Mark message as read/unread
  const handleToggleRead = async (id: string, currentRead: boolean) => {
    const token = getAdminToken();
    try {
      const updated = await markContactReadFn({ data: { token, id, read: !currentRead } });
      if (updated) {
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, read: updated.read } : c)));
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, read: updated.read } : null));
        }
      }
    } catch (err) {
      console.warn("Failed to mark message read status:", err);
    }
  };

  // Retry sending email notification for a message
  const handleRetryEmail = async (id: string) => {
    const token = getAdminToken();
    setRetryingId(id);
    try {
      const res = await retryContactEmailFn({ data: { token, id } });
      if (res.submission) {
        setContacts((prev) => prev.map((c) => (c.id === id ? res.submission! : c)));
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(res.submission);
        }
      }
      if (res.success) {
        alert("Notification email dispatched successfully via SMTP!");
      } else {
        alert(`Email dispatch attempt failed: ${res.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  // Open full message details and mark as read
  const handleOpenMessage = async (msg: ContactSubmission) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      handleToggleRead(msg.id, false);
    }
  };

  const handleSaveWebhook = async () => {
    const token = getAdminToken();
    setSavingSettings(true);
    setTestResult(null);
    try {
      await updateSettingsFn({
        data: {
          token,
          settings: { googleWebhookUrl: webhookUrl.trim() },
        },
      });
      setTestResult({ success: true, message: "Google Apps Script Webhook URL saved successfully!" });
      if (typeof window !== "undefined") {
        try {
          const current = getCachedSettings();
          localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({ ...current, googleWebhookUrl: webhookUrl.trim() }),
          );
        } catch {}
      }
    } catch (err: unknown) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : "Failed to save settings." });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestWebhook = async () => {
    const token = getAdminToken();
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await testEmailAutomationFn({
        data: { token, webhookUrl: webhookUrl.trim() || undefined },
      });
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Error testing webhook",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const token = getAdminToken();
    try {
      await deleteContactSubmissionFn({ data: { token, id } });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.warn("Failed to delete submission:", err);
    }
  };

  // Project Dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Milestone Dialog state
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<JourneyMilestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<JourneyMilestone | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Auth form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Handle Login
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const res = await login(username, password);
    if (!res.success) {
      setAuthError(res.error || "Authentication failed. Check your credentials.");
    }
    setAuthLoading(false);
  };

  // Move project up/down
  const handleMoveProject = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= allProjects.length) return;

    const copy = [...allProjects];
    const currentItem = copy[index];
    const targetItem = copy[targetIndex];
    if (!currentItem || !targetItem) return;

    copy[index] = targetItem;
    copy[targetIndex] = currentItem;

    reorderProjects(copy);
  };

  // Move milestone up/down
  const handleMoveMilestone = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= allMilestones.length) return;

    const copy = [...allMilestones];
    const currentItem = copy[index];
    const targetItem = copy[targetIndex];
    if (!currentItem || !targetItem) return;

    copy[index] = targetItem;
    copy[targetIndex] = currentItem;

    reorderMilestones(copy);
  };

  const confirmDeleteProject = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteMilestone = async () => {
    if (!deletingMilestone) return;
    setIsDeleting(true);
    try {
      await deleteMilestone(deletingMilestone.id);
      setDeletingMilestone(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete milestone");
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (adminLoading) {
    return (
      <main className="section-shell min-h-screen flex items-center justify-center py-24 text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-slate-400 font-mono text-sm">Verifying authorization...</p>
        </div>
      </main>
    );
  }

  // Not logged in
  if (!user || !isAdmin) {
    return (
      <main className="section-shell min-h-screen flex items-center justify-center py-20 text-foreground">
        <div
          className="relative w-full max-w-md rounded-[28px] bg-[#0c0919] border border-white/15 p-7 sm:p-9 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)]"
          style={{
            borderLeft: "2.5px solid #a855f7",
            borderRight: "2.5px solid #06b6d4",
          }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary-glow">
                Restricted Access
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                Admin Portal
              </h1>
            </div>
            <Link
              to="/"
              className="glass-pill grid size-9 place-items-center rounded-full text-slate-300 hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          {authError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username or Admin Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400/70 focus:outline-none text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={authLoading}
              className="w-full mt-2"
            >
              {authLoading ? "Authenticating..." : "Sign In to Admin Portal"}
            </Button>

            <div className="text-center text-xs text-slate-400 pt-3 border-t border-white/10">
              <Link to="/" className="text-primary-glow hover:underline">
                ← Back to Portfolio
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // Authenticated Admin Dashboard
  // -------------------------------------------------------------------------
  const publishedProjectsCount = allProjects.filter((p) => p.published).length;
  const featuredProjectsCount = allProjects.filter((p) => p.featured).length;
  const publishedMilestonesCount = allMilestones.filter((m) => m.published).length;
  const highlightedMilestonesCount = allMilestones.filter((m) => m.highlighted).length;

  return (
    <main className="section-shell min-h-screen py-16 sm:py-20 text-foreground">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wider text-purple-300 border border-purple-500/30">
                <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                Admin Authorized
              </span>
              <span className="text-xs text-slate-400 font-mono">{user.username}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
              Portfolio Content Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              View Site
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Section Management Tabs */}
        <div className="mt-6 flex items-center gap-3 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("projects")}
            className={`glass-pill flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === "projects"
                ? "bg-primary/25 border-primary-glow/70 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <FolderGit2 className="size-4 text-purple-400" />
            <span>Projects Management</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">
              {allProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("journey")}
            className={`glass-pill flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === "journey"
                ? "bg-cyan-500/25 border-cyan-400/70 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <MilestoneIcon className="size-4 text-cyan-400" />
            <span>Journey Timeline</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">
              {allMilestones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`glass-pill flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === "messages"
                ? "bg-purple-500/25 border-purple-400/70 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Mail className="size-4 text-purple-400" />
            <span>Messages & Automation</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">
              {contacts.length}
            </span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: PROJECTS MANAGEMENT                                    */}
        {/* ============================================================= */}
        {activeTab === "projects" && (
          <div className="mt-8 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Total Projects</p>
                <p className="mt-1 font-display text-3xl font-bold text-white">{allProjects.length}</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Published</p>
                <p className="mt-1 font-display text-3xl font-bold text-cyan-400">
                  {publishedProjectsCount}
                </p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Featured</p>
                <p className="mt-1 font-display text-3xl font-bold text-purple-400">
                  {featuredProjectsCount}
                </p>
              </div>
            </div>

            {/* Header + Add Project Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Projects Inventory ({allProjects.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Edits are permanently saved locally and on the server.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={async () => {
                    if (window.confirm("Reset all projects to original defaults? This will clear custom project modifications.")) {
                      await resetProjectsToDefault();
                    }
                  }}
                  className="border-white/10 hover:border-white/20 text-slate-300 text-xs gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Defaults
                </Button>

                <Button
                  variant="hero"
                  size="default"
                  onClick={() => {
                    setEditingProject(null);
                    setProjectDialogOpen(true);
                  }}
                  className="gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  <Plus className="size-4" />
                  Add New Project
                </Button>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-3">
              {allProjects.map((p, idx) => (
                <div
                  key={p.id}
                  className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-white/20"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      key={p.image}
                      src={resolveProjectImage(p.image, p.slug || p.title)}
                      alt={p.title}
                      className="size-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getDefaultProjectImage(p.slug || p.title);
                        if (target.src !== fallback && !target.src.endsWith(fallback)) {
                          target.src = fallback;
                        } else {
                          target.src = "/placeholder.svg";
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-lg font-bold text-white truncate">{p.title}</h3>
                        <span className="glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-cyan-300">
                          {p.category}
                        </span>
                        {p.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Star className="size-3 fill-purple-400" />
                            Featured
                          </span>
                        )}
                        {!p.published && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 truncate max-w-xl">{p.tagline || p.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleMoveProject(idx, "up")}
                      disabled={idx === 0}
                      className="glass-pill p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      onClick={() => handleMoveProject(idx, "down")}
                      disabled={idx === allProjects.length - 1}
                      className="glass-pill p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      onClick={() => updateProject(p.id, { featured: !p.featured })}
                      className={`glass-pill p-2 rounded-lg transition-colors ${
                        p.featured ? "text-purple-400 bg-purple-500/20 border-purple-500/40" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Star className="size-4" />
                    </button>
                    <button
                      onClick={() => updateProject(p.id, { published: !p.published })}
                      className={`glass-pill p-2 rounded-lg transition-colors ${
                        p.published ? "text-cyan-400 bg-cyan-500/20 border-cyan-500/40" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      {p.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        setProjectDialogOpen(true);
                      }}
                      className="glass-pill p-2 rounded-lg text-slate-300 hover:text-white hover:border-cyan-400/50"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProject(p)}
                      className="glass-pill p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 hover:border-red-500/50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: JOURNEY TIMELINE MANAGEMENT                            */}
        {/* ============================================================= */}
        {activeTab === "journey" && (
          <div className="mt-8 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Total Milestones</p>
                <p className="mt-1 font-display text-3xl font-bold text-white">{allMilestones.length}</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Published</p>
                <p className="mt-1 font-display text-3xl font-bold text-cyan-400">
                  {publishedMilestonesCount}
                </p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Highlighted</p>
                <p className="mt-1 font-display text-3xl font-bold text-purple-400">
                  {highlightedMilestonesCount}
                </p>
              </div>
            </div>

            {/* Header + Add Milestone Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Journey Timeline Milestones ({allMilestones.length})
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Changes made here update the interactive 3D visual journey path in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={async () => {
                    if (window.confirm("Reset all journey milestones to original defaults? This will clear custom milestone modifications.")) {
                      await resetMilestonesToDefault();
                    }
                  }}
                  className="border-white/10 hover:border-white/20 text-slate-300 text-xs gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Defaults
                </Button>

                <Button
                  variant="hero"
                  size="default"
                  onClick={() => {
                    setEditingMilestone(null);
                    setMilestoneDialogOpen(true);
                  }}
                  className="gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <Plus className="size-4" />
                  Add Milestone
                </Button>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-3">
              {allMilestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-white/20"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-12 rounded-xl bg-[#181133] border border-cyan-400/30 grid place-items-center shrink-0 text-cyan-400">
                      <Sparkles className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-purple-400 font-semibold">
                          {m.year}
                        </span>
                        <h3 className="font-display text-lg font-bold text-white truncate">{m.title}</h3>
                        <span className="glass-pill px-2.5 py-0.5 rounded-full text-xs font-medium text-cyan-300">
                          {m.category}
                        </span>
                        <span className="rounded-full px-2 py-0.5 text-xs font-mono bg-white/10 text-slate-300">
                          Stage: {m.stage.toUpperCase()}
                        </span>
                        {m.highlighted && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Sparkles className="size-3 fill-purple-400" />
                            Highlighted
                          </span>
                        )}
                        {!m.published && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 truncate max-w-xl">{m.subtitle || m.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleMoveMilestone(idx, "up")}
                      disabled={idx === 0}
                      className="glass-pill p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      onClick={() => handleMoveMilestone(idx, "down")}
                      disabled={idx === allMilestones.length - 1}
                      className="glass-pill p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      onClick={() => updateMilestone(m.id, { highlighted: !m.highlighted })}
                      className={`glass-pill p-2 rounded-lg transition-colors ${
                        m.highlighted ? "text-purple-400 bg-purple-500/20 border-purple-500/40" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="size-4" />
                    </button>
                    <button
                      onClick={() => updateMilestone(m.id, { published: !m.published })}
                      className={`glass-pill p-2 rounded-lg transition-colors ${
                        m.published ? "text-cyan-400 bg-cyan-500/20 border-cyan-500/40" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      {m.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingMilestone(m);
                        setMilestoneDialogOpen(true);
                      }}
                      className="glass-pill p-2 rounded-lg text-slate-300 hover:text-white hover:border-cyan-400/50"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeletingMilestone(m)}
                      className="glass-pill p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 hover:border-red-500/50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: CONTACT MESSAGES & DIRECT SMTP EMAIL NOTIFICATION      */}
        {/* ============================================================= */}
        {activeTab === "messages" && (
          <div className="mt-8 space-y-8">
            {/* Direct SMTP Email Engine Card */}
            <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
                      Direct Email Delivery Engine
                    </span>
                    {smtpStatus?.configured ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        <CheckCircle2 className="size-3 text-cyan-400" /> Active ({smtpStatus.source === "env" ? ".env" : "Settings"})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        <AlertTriangle className="size-3 text-amber-400" /> Action Required
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mt-1">
                    Self-Managed SMTP Notification System
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Form submissions trigger real-time SMTP emails directly to your inbox and phone email app.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() => setIsSmtpConfigOpen(!isSmtpConfigOpen)}
                    className="gap-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    <Sliders className="size-3.5" />
                    <span>{isSmtpConfigOpen ? "Hide Settings" : "Configure SMTP"}</span>
                    {isSmtpConfigOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  </Button>

                  <Button
                    type="button"
                    variant="hero"
                    size="sm"
                    disabled={testingSmtp}
                    onClick={handleTestSmtp}
                    className="gap-1.5 text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    <Send className="size-3.5" />
                    <span>{testingSmtp ? "Testing SMTP..." : "Test Email Delivery"}</span>
                  </Button>
                </div>
              </div>

              {/* Status Overview Banner */}
              <div
                className={`rounded-xl border p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  smtpStatus?.configured
                    ? "border-cyan-400/30 bg-cyan-950/20 text-cyan-200"
                    : "border-amber-500/30 bg-amber-950/20 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Server className="size-4 shrink-0 text-cyan-400" />
                  <div>
                    <span className="font-semibold text-white">
                      {smtpStatus?.configured ? "SMTP Server Connected:" : "SMTP Not Fully Configured:"}
                    </span>{" "}
                    {smtpStatus?.configured ? (
                      <span className="font-mono text-cyan-300">
                        {smtpStatus.host}:{smtpStatus.port} &bull; Receiver: {smtpStatus.receiverEmail}
                      </span>
                    ) : (
                      <span>{smtpStatus?.reason || "Enter your SMTP host, user, and password below."}</span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Target Inbox: <span className="text-purple-300 font-bold">{receiverEmail || "akshay123modi@gmail.com"}</span>
                </div>
              </div>

              {smtpTestResult && (
                <div
                  className={`rounded-xl border p-3.5 text-xs flex items-center gap-2.5 ${
                    smtpTestResult.success
                      ? "border-cyan-400/40 bg-cyan-950/40 text-cyan-200"
                      : "border-red-500/40 bg-red-950/40 text-red-200"
                  }`}
                >
                  {smtpTestResult.success ? (
                    <CheckCircle2 className="size-4 shrink-0 text-cyan-400" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-red-400" />
                  )}
                  <span className="font-mono">{smtpTestResult.message}</span>
                </div>
              )}

              {/* Expandable SMTP Configuration Form */}
              {isSmtpConfigOpen && (
                <form onSubmit={handleSaveSmtpSettings} className="space-y-4 pt-2 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-300">
                        SMTP Host *
                      </label>
                      <input
                        type="text"
                        required
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-300">
                        SMTP Port (465 SSL / 587 TLS) *
                      </label>
                      <input
                        type="text"
                        required
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="465"
                        className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-300">
                        Receiver Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={receiverEmail}
                        onChange={(e) => setReceiverEmail(e.target.value)}
                        placeholder="akshay123modi@gmail.com"
                        className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-300">
                        SMTP Username (Email) *
                      </label>
                      <input
                        type="text"
                        required
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="akshay123modi@gmail.com"
                        className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-300">
                        SMTP Password / App Password *
                      </label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder={smtpStatus?.hasPassword ? "•••••••• (Saved)" : "Enter 16-char App Password"}
                        className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-300">
                        From Header (Sender Name)
                      </label>
                      <input
                        type="text"
                        value={smtpFrom}
                        onChange={(e) => setSmtpFrom(e.target.value)}
                        placeholder='"Akshay Portfolio" <akshay123modi@gmail.com>'
                        className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Gmail App Password Step-by-Step Instructions */}
                  <div className="rounded-xl bg-[#100b24] border border-white/10 p-3.5 text-xs text-slate-300 space-y-1.5">
                    <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <ShieldCheck className="size-4" /> Recommended Gmail Setup (Takes 60 seconds):
                    </p>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      1. Open your Google Account &rarr; <strong>Security</strong> &rarr; <strong>2-Step Verification</strong> &rarr; <strong>App Passwords</strong>.<br />
                      2. Create an App password named <strong>"Portfolio"</strong>. Google generates a 16-character code.<br />
                      3. Paste it above as the <strong>SMTP Password</strong> with host <strong>smtp.gmail.com</strong> and port <strong>465</strong>. Click <strong>Save SMTP Settings</strong>!
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSmtpConfigOpen(false)}
                      disabled={savingSmtp}
                      className="text-xs"
                    >
                      Close Panel
                    </Button>
                    <Button
                      type="submit"
                      variant="hero"
                      size="sm"
                      disabled={savingSmtp}
                      className="text-xs gap-1.5 px-5"
                    >
                      <Check className="size-3.5" />
                      {savingSmtp ? "Saving..." : "Save SMTP Settings"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass rounded-2xl p-4 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Total Inquiries</p>
                <p className="mt-1 font-display text-2xl font-bold text-white">{contacts.length}</p>
              </div>

              <div className="glass rounded-2xl p-4 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Unread</p>
                <p className="mt-1 font-display text-2xl font-bold text-cyan-400">
                  {contacts.filter((c) => !c.read).length}
                </p>
              </div>

              <div className="glass rounded-2xl p-4 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Email Delivered</p>
                <p className="mt-1 font-display text-2xl font-bold text-purple-400">
                  {contacts.filter((c) => c.deliveryStatus === "SENT").length}
                </p>
              </div>

              <div className="glass rounded-2xl p-4 border border-white/10">
                <p className="text-xs font-mono uppercase text-slate-400">Needs Attention</p>
                <p className="mt-1 font-display text-2xl font-bold text-amber-400">
                  {contacts.filter((c) => c.deliveryStatus === "FAILED" || c.deliveryStatus === "NOT_CONFIGURED").length}
                </p>
              </div>
            </div>

            {/* Received Contact Messages Console */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <Mail className="size-5 text-cyan-400" />
                    Inbox Submissions ({contacts.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every submission is securely stored in your backend database with delivery tracking
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter Pills */}
                  <div className="glass-pill p-1 rounded-xl flex items-center gap-1 text-xs">
                    {(["all", "unread", "sent", "failed"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setMessageFilter(tab)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-mono ${
                          messageFilter === tab
                            ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={loadContactsAndSettings}
                    disabled={contactsLoading}
                    className="gap-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    <RefreshCw className={`size-3.5 ${contactsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {contacts.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center border border-white/10">
                  <Mail className="size-10 text-slate-500 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-semibold text-white">No messages received yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When someone submits your portfolio Contact form, it will appear here and trigger a direct email push notification to your phone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts
                    .filter((msg) => {
                      if (messageFilter === "unread") return !msg.read;
                      if (messageFilter === "sent") return msg.deliveryStatus === "SENT";
                      if (messageFilter === "failed") return msg.deliveryStatus === "FAILED" || msg.deliveryStatus === "NOT_CONFIGURED";
                      return true;
                    })
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={`glass rounded-2xl p-5 border transition-all duration-200 ${
                          !msg.read
                            ? "border-cyan-400/40 bg-[#0e0924]/90 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                            : "border-white/10 hover:border-white/20 bg-[#0a0718]/80"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Read / Unread Status Dot */}
                            {!msg.read ? (
                              <div className="size-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" title="Unread Message" />
                            ) : (
                              <div className="size-2.5 rounded-full bg-slate-600 shrink-0" title="Read" />
                            )}

                            <div className="grid size-9 place-items-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-sm shrink-0">
                              {msg.name.slice(0, 1).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-white text-sm truncate">{msg.name}</h4>
                                <a
                                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Portfolio Inquiry")}`}
                                  className="text-xs text-cyan-400 hover:underline font-mono truncate"
                                >
                                  &lt;{msg.email}&gt;
                                </a>

                                {/* Delivery Status Badge */}
                                {msg.deliveryStatus === "SENT" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                                    <CheckCircle2 className="size-3 text-cyan-400" /> Email Sent
                                  </span>
                                )}
                                {msg.deliveryStatus === "FAILED" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-400/30" title={msg.deliveryError}>
                                    <XCircle className="size-3 text-red-400" /> Delivery Failed
                                  </span>
                                )}
                                {msg.deliveryStatus === "NOT_CONFIGURED" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                                    <AlertTriangle className="size-3 text-amber-400" /> SMTP Unconfigured
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">
                                {msg.subject || "Portfolio Inquiry"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="text-[11px] font-mono text-slate-400">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>

                            {/* Mark Read/Unread Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleRead(msg.id, msg.read)}
                              className={`glass-pill p-1.5 rounded-lg text-xs transition-colors ${
                                msg.read ? "text-slate-400 hover:text-white" : "text-cyan-300 bg-cyan-500/20 border-cyan-400/40"
                              }`}
                              title={msg.read ? "Mark as unread" : "Mark as read"}
                            >
                              <MailCheck className="size-3.5" />
                            </button>

                            {/* Retry Email Button if not sent */}
                            {msg.deliveryStatus !== "SENT" && (
                              <button
                                type="button"
                                disabled={retryingId === msg.id}
                                onClick={() => handleRetryEmail(msg.id)}
                                className="glass-pill p-1.5 rounded-lg text-xs text-purple-300 hover:text-white hover:border-purple-400"
                                title="Retry sending notification email via SMTP"
                              >
                                <RefreshCw className={`size-3.5 ${retryingId === msg.id ? "animate-spin" : ""}`} />
                              </button>
                            )}

                            {/* View Full Message Modal Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenMessage(msg)}
                              className="glass-pill p-1.5 rounded-lg text-xs text-cyan-300 hover:text-white hover:border-cyan-400"
                              title="View full message details"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            {/* Delete Message Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(msg.id)}
                              className="glass-pill p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40"
                              title="Delete message"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Message Preview snippet */}
                        <div
                          onClick={() => handleOpenMessage(msg)}
                          className="rounded-xl bg-[#140f26]/60 hover:bg-[#140f26] p-3 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-white/5 cursor-pointer line-clamp-2 transition-colors"
                        >
                          {msg.message}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0c0919] border border-cyan-400/30 p-6 sm:p-7 space-y-5 shadow-[0_25px_70px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                  Contact Inquiry Details
                </span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">
                  {selectedMessage.subject || "Portfolio Inquiry"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Sender Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="font-mono uppercase text-slate-400 text-[10px]">Sender</span>
                <p className="font-semibold text-white mt-0.5">{selectedMessage.name}</p>
              </div>
              <div>
                <span className="font-mono uppercase text-slate-400 text-[10px]">Email Address</span>
                <p className="font-semibold text-cyan-300 mt-0.5">
                  <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                    {selectedMessage.email}
                  </a>
                </p>
              </div>
              <div>
                <span className="font-mono uppercase text-slate-400 text-[10px]">Received At</span>
                <p className="text-slate-200 mt-0.5">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-mono uppercase text-slate-400 text-[10px]">Email Delivery Status</span>
                <p className="mt-0.5">
                  {selectedMessage.deliveryStatus === "SENT" && (
                    <span className="text-cyan-400 font-mono font-bold">SENT (Delivered via SMTP)</span>
                  )}
                  {selectedMessage.deliveryStatus === "FAILED" && (
                    <span className="text-red-400 font-mono font-bold">FAILED ({selectedMessage.deliveryError || "SMTP Error"})</span>
                  )}
                  {selectedMessage.deliveryStatus === "NOT_CONFIGURED" && (
                    <span className="text-amber-400 font-mono font-bold">NOT CONFIGURED</span>
                  )}
                </p>
              </div>
            </div>

            {/* Full Message Body */}
            <div className="space-y-2">
              <span className="font-mono uppercase text-slate-400 text-[10px]">Message Body</span>
              <div className="rounded-xl bg-[#130d29] border border-white/10 p-5 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedMessage.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRead(selectedMessage.id, selectedMessage.read)}
                  className="text-xs"
                >
                  {selectedMessage.read ? "Mark as Unread" : "Mark as Read"}
                </Button>
                {selectedMessage.deliveryStatus !== "SENT" && (
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    disabled={retryingId === selectedMessage.id}
                    onClick={() => handleRetryEmail(selectedMessage.id)}
                    className="text-xs text-purple-300 hover:text-white"
                  >
                    <RefreshCw className={`size-3.5 mr-1.5 ${retryingId === selectedMessage.id ? "animate-spin" : ""}`} />
                    Retry Email Dispatch
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || "Portfolio Inquiry")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110"
                >
                  <Send className="size-3.5" />
                  Reply Directly
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Edit/Add Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        project={editingProject}
        onClose={() => {
          setProjectDialogOpen(false);
          setEditingProject(null);
        }}
        onSave={async (data) => {
          if (editingProject) {
            await updateProject(editingProject.id, data);
          } else {
            await addProject(data);
          }
        }}
      />

      {/* Milestone Edit/Add Dialog */}
      <MilestoneDialog
        open={milestoneDialogOpen}
        milestone={editingMilestone}
        onClose={() => {
          setMilestoneDialogOpen(false);
          setEditingMilestone(null);
        }}
        onSave={async (data) => {
          if (editingMilestone) {
            await updateMilestone(editingMilestone.id, data);
          } else {
            await addMilestone(data);
          }
        }}
      />

      {/* Delete Project Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0e0a20] border border-red-500/30 p-6 space-y-4">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-400" />
              Delete Project?
            </h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingProject.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeletingProject(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteProject} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Milestone Confirmation Modal */}
      {deletingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0e0a20] border border-red-500/30 p-6 space-y-4">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-400" />
              Delete Milestone?
            </h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingMilestone.title}"</span> from your visual journey?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeletingMilestone(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteMilestone} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Milestone"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
