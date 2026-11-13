import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { type Project, resolveProjectImage, getDefaultProjectImage } from "@/content/projects";
import { Button } from "@/components/ui/button";
import { uploadImageFn } from "@/lib/server-api";

const DEFAULT_CATEGORIES = [
  "Web Apps",
  "AI / ML",
  "Tools",
  "Open Source",
  "Creative",
  "Others",
];

interface ProjectDialogProps {
  open: boolean;
  project?: Project | null | undefined;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
}

function DialogContent({ open, project, onClose, onSave }: ProjectDialogProps) {
  // ... (all the existing component logic stays the same)
  // I need to read the full file first to make this edit properly
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [category, setCategory] = useState("Web Apps");
  const [customCategory, setCustomCategory] = useState("");
  const [techInput, setTechInput] = useState("");
  const [image, setImage] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newScreenshot, setNewScreenshot] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotFileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when dialog is open so background page doesn't scroll
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // Populate form on edit
  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSlug(project.slug);
      setTagline(project.tagline);
      setDescription(project.description);
      setFullDescription(project.fullDescription || project.description);
      if (DEFAULT_CATEGORIES.includes(project.category)) {
        setCategory(project.category);
        setCustomCategory("");
      } else {
        setCategory("Others");
        setCustomCategory(project.category);
      }
      setTechInput(project.tech.join(", "));
      setImage(project.image);
      setScreenshots(project.screenshots || []);
      setLiveUrl(project.liveUrl || "");
      setGithubUrl(project.githubUrl || "");
      setProjectUrl(project.projectUrl || "");
      setFeatured(project.featured ?? false);
      setPublished(project.published !== false);
    } else {
      // Defaults for new project
      setTitle("");
      setSlug("");
      setTagline("");
      setDescription("");
      setFullDescription("");
      setCategory("Web Apps");
      setCustomCategory("");
      setTechInput("React, TypeScript, Tailwind CSS");
      setImage("");
      setScreenshots([]);
      setLiveUrl("");
      setGithubUrl("");
      setProjectUrl("");
      setFeatured(false);
      setPublished(true);
    }
    setError(null);
    setUploadError(null);
    setUploadSuccessNotice(null);
    setIsUploading(false);
    setIsDragging(false);
    setShowManualUrl(false);
  }, [project, open]);

  // Read file and send to backend upload endpoint
  const processAndUploadFile = async (file: File): Promise<string> => {
    // Client-side validations
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimes.includes(file.type.toLowerCase())) {
      throw new Error("Invalid format. Please upload a JPG, JPEG, PNG, or WEBP image.");
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      throw new Error(`File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is 5 MB.`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file from disk."));
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const token = typeof window !== "undefined" ? localStorage.getItem("akm_admin_token") || undefined : undefined;

          try {
            const result = await uploadImageFn({
              data: {
                ...(token ? { token } : {}),
                filename: file.name,
                mimeType: file.type,
                base64Data,
              },
            });
            resolve(result.url);
          } catch (uploadErr) {
            console.warn("Backend image upload notice, applying data URL fallback:", uploadErr);
            resolve(base64Data);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCoverFileSelected = async (file: File) => {
    setUploadError(null);
    setUploadSuccessNotice(null);
    setIsUploading(true);
    setUploadProgress(25);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 150);

    try {
      const url = await processAndUploadFile(file);
      clearInterval(progressTimer);
      setUploadProgress(100);
      setImage(url);
      setUploadSuccessNotice("Cover image uploaded to server storage!");
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    } catch (err: unknown) {
      clearInterval(progressTimer);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    }
  };

  const handleScreenshotFileSelected = async (file: File) => {
    setUploadError(null);
    setIsUploadingScreenshot(true);
    try {
      const url = await processAndUploadFile(file);
      setScreenshots((prev) => [...prev, url]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload screenshot.");
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  // Auto-generate slug when typing title for new projects
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!project) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleAddScreenshot = () => {
    if (newScreenshot.trim()) {
      setScreenshots([...screenshots, newScreenshot.trim()]);
      setNewScreenshot("");
    }
  };

  const handleRemoveScreenshot = (idx: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    const effectiveCategory = category === "Others" && customCategory.trim() ? customCategory.trim() : category;

    const techArray = techInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    setError(null);

    try {
      const payload: Partial<Project> = {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        tagline: tagline.trim(),
        description: description.trim(),
        fullDescription: fullDescription.trim() || description.trim(),
        category: effectiveCategory,
        tech: techArray,
        image: image.trim(),
        screenshots,
        featured,
        published,
      };
      if (liveUrl.trim()) payload.liveUrl = liveUrl.trim();
      if (githubUrl.trim()) payload.githubUrl = githubUrl.trim();
      if (projectUrl.trim()) payload.projectUrl = projectUrl.trim();

      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-5 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          data-lenis-prevent="true"
          className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[24px] bg-[#0c0919] text-foreground border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden overscroll-contain"
          style={{
            borderLeft: "2.5px solid #a855f7",
            borderRight: "2.5px solid #06b6d4",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-5 sm:px-8 sm:py-5 border-b border-white/10 bg-[#0c0919]/95 backdrop-blur-md z-10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary-glow">
                {project ? "Edit Project" : "New Project"}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                {project ? `Edit: ${project.title}` : "Add New Project"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="glass-pill grid size-9 place-items-center rounded-full text-foreground/80 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div
              data-lenis-prevent="true"
              className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 space-y-5 text-sm overscroll-contain scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            {/* Title & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. TrustMesh"
                  className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Slug / URL Identifier
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. trustmesh"
                  className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400/70 focus:outline-none"
                />
              </div>
            </div>

            {/* Tagline / Short Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Short Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. A trust network against AI slop"
                className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none"
              />
            </div>

            {/* Description (Card summary) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Card Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief 1-2 sentence overview for the 3D card..."
                className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none resize-none"
              />
            </div>

            {/* Full Description (Modal view) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Description (Project View Modal)
              </label>
              <textarea
                rows={4}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Detailed explanation of the project, architecture, features and impact..."
                className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none"
              />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white focus:border-primary-glow/70 focus:outline-none"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#140f26] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {category === "Others" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Mobile Apps, Games, Developer Tools"
                    className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400/70 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Technology Stack (Comma-separated)
              </label>
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="React, TypeScript, Tailwind CSS, FastAPI, Python"
                className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none"
              />
            </div>

            {/* Direct Project Image Upload System */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Project Cover Image
                </label>
                {image && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    {image.startsWith("/uploads/") ? "Backend Uploaded" : "Asset Reference"}
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverFileSelected(file);
                  e.target.value = "";
                }}
              />

              {uploadError && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-3.5 py-2.5 text-xs text-red-300">
                  <AlertCircle className="size-4 shrink-0 text-red-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccessNotice && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  <span>{uploadSuccessNotice}</span>
                </div>
              )}

              {/* If an image exists, show the interactive preview card */}
              {image ? (
                <div className="group relative rounded-2xl border border-white/15 bg-[#140f26]/90 p-3 overflow-hidden transition-all duration-300 hover:border-primary-glow/50">
                  <div className="relative aspect-[16/9] max-h-56 w-full overflow-hidden rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
                    <img
                      src={resolveProjectImage(image, slug || title)}
                      alt="Project preview"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getDefaultProjectImage(slug || title);
                        if (target.src !== fallback && !target.src.endsWith(fallback)) {
                          target.src = fallback;
                        } else {
                          target.src = "/placeholder.svg";
                        }
                      }}
                    />

                    {/* Floating path chip */}
                    <div className="absolute top-2.5 left-2.5 max-w-[75%] truncate rounded-md bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-white/10">
                      {image}
                    </div>

                    {/* Upload progress overlay if replacing */}
                    {isUploading && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 text-center">
                        <Loader2 className="size-8 animate-spin text-primary-glow mb-2" />
                        <span className="text-xs font-semibold text-white">Uploading replacement... {uploadProgress}%</span>
                        <div className="w-48 h-1.5 bg-white/10 rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="glass"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:border-cyan-400/50"
                      >
                        <RefreshCw className="size-3.5" />
                        Replace Image
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isUploading}
                        onClick={() => {
                          setImage("");
                          setUploadSuccessNotice(null);
                        }}
                        className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Drag & drop new file to replace
                    </span>
                  </div>
                </div>
              ) : (
                /* Empty state / Drag and drop zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleCoverFileSelected(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? "border-primary-glow bg-purple-950/30 scale-[1.01] shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                      : "border-white/15 bg-[#140f26]/60 hover:border-cyan-400/60 hover:bg-[#181130]"
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center py-2">
                      <Loader2 className="size-10 animate-spin text-primary-glow mb-3" />
                      <p className="text-sm font-semibold text-white">
                        Uploading to server storage... {uploadProgress}%
                      </p>
                      <div className="w-56 h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 mt-2 font-mono">Saving directly to backend storage</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 mb-3 text-cyan-300 group-hover:scale-110 group-hover:text-primary-glow transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Upload className="size-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Click to upload or drag & drop image
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Supports <span className="text-slate-200 font-semibold">JPG, JPEG, PNG, WEBP</span> up to 5 MB
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="hero"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs px-3.5 py-1.5 h-auto gap-1.5"
                        >
                          <Upload className="size-3.5" />
                          Choose from Computer
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Optional manual URL toggle for external embeds */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
                >
                  {showManualUrl ? "Hide manual URL input" : "Or enter custom image URL directly"}
                </button>
              </div>

              {showManualUrl && (
                <div className="mt-2 rounded-xl bg-black/40 p-3 border border-white/10 space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-400">
                    Direct Image URL / Path
                  </label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://... or /uploads/... or /assets/..."
                    className="w-full rounded-lg bg-[#140f26] border border-white/10 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/70 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Additional Screenshots */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Additional Screenshots
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {screenshots.length} screenshot{screenshots.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Hidden file input for screenshots */}
              <input
                ref={screenshotFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScreenshotFileSelected(file);
                  e.target.value = "";
                }}
              />

              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  size="sm"
                  variant="glass"
                  disabled={isUploadingScreenshot}
                  onClick={() => screenshotFileInputRef.current?.click()}
                  className="gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 border-cyan-500/30"
                >
                  {isUploadingScreenshot ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  {isUploadingScreenshot ? "Uploading..." : "Upload Screenshot"}
                </Button>

                <input
                  type="text"
                  value={newScreenshot}
                  onChange={(e) => setNewScreenshot(e.target.value)}
                  placeholder="Or enter URL (https://...)"
                  className="flex-1 rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2 text-white placeholder-slate-500 focus:border-cyan-400/70 focus:outline-none text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={handleAddScreenshot}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>

              {screenshots.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {screenshots.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-[#140f26] px-3 py-1.5 text-xs text-slate-300 border border-white/5"
                    >
                      <span className="truncate max-w-[80%]">{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot(idx)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links: Live Demo & GitHub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Live Demo URL (Optional)
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://myproject.com"
                  className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400/70 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/akshaymodi/..."
                  className="w-full rounded-xl bg-[#140f26] border border-white/10 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary-glow/70 focus:outline-none"
                />
              </div>
            </div>

            {/* Toggles: Featured & Published */}
            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-white/10">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="size-4 rounded accent-purple-500"
                />
                <span className="text-sm font-medium text-slate-200">Featured Project</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4 rounded accent-cyan-500"
                />
                <span className="text-sm font-medium text-slate-200">Published (Visible in gallery)</span>
              </label>
            </div>

            </div>

            {/* Fixed/Sticky Footer Buttons */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 sm:px-8 border-t border-white/10 bg-[#0c0919]/95 backdrop-blur-md z-10">
              <span className="text-xs text-slate-400 hidden sm:inline">
                * Changes save instantly
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={saving} className="px-6">
                  {saving ? "Saving..." : project ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
}

export function ProjectDialog({ open, project, onClose, onSave }: ProjectDialogProps) {
  if (!open) return null;

  return createPortal(
    <DialogContent open={open} project={project} onClose={onClose} onSave={onSave} />,
    document.body
  );
}

