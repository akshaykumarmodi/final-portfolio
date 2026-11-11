import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Save, X } from "lucide-react";
import type { JourneyMilestone, JourneyStage } from "@/content/journey";

interface MilestoneDialogProps {
  open: boolean;
  milestone: JourneyMilestone | null;
  onClose: () => void;
  onSave: (milestoneData: Partial<JourneyMilestone>) => Promise<void>;
}

const STAGES: { label: string; value: JourneyStage }[] = [
  { label: "Start", value: "start" },
  { label: "Learning", value: "learning" },
  { label: "Building", value: "building" },
  { label: "Hackathons", value: "hackathons" },
  { label: "Projects", value: "projects" },
  { label: "Growth", value: "growth" },
  { label: "Future", value: "future" },
];

const ICONS = ["Compass", "Code2", "Sparkles", "Trophy", "Rocket", "TrendingUp", "Flame", "Award", "Cpu", "Globe"];

export function MilestoneDialog({ open, milestone, onClose, onSave }: MilestoneDialogProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [category, setCategory] = useState("Milestone");
  const [stage, setStage] = useState<JourneyStage>("building");
  const [iconName, setIconName] = useState("Sparkles");
  const [status, setStatus] = useState<"completed" | "in-progress" | "upcoming">("completed");
  const [highlighted, setHighlighted] = useState(false);
  const [published, setPublished] = useState(true);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setSubtitle(milestone.subtitle || "");
      setDescription(milestone.description);
      setYear(milestone.year);
      setDateRange(milestone.dateRange || milestone.year);
      setCategory(milestone.category || "Milestone");
      setStage(milestone.stage || "building");
      setIconName(milestone.iconName || "Sparkles");
      setStatus(milestone.status || "completed");
      setHighlighted(milestone.highlighted ?? false);
      setPublished(milestone.published ?? true);
      setTags(milestone.tags?.join(", ") || "");
    } else {
      setTitle("");
      setSubtitle("");
      setDescription("");
      setYear(new Date().getFullYear().toString());
      setDateRange("");
      setCategory("Milestone");
      setStage("building");
      setIconName("Sparkles");
      setStatus("completed");
      setHighlighted(false);
      setPublished(true);
      setTags("");
    }
    setError(null);
  }, [milestone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const payload: Partial<JourneyMilestone> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        year: year.trim() || new Date().getFullYear().toString(),
        dateRange: dateRange.trim() || year.trim(),
        category: category.trim(),
        stage,
        iconName,
        status,
        highlighted,
        published,
        tags: parsedTags,
      };
      if (milestone?.id) {
        payload.id = milestone.id;
      }
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save milestone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-[#0c0919] border border-white/15 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-white">
            <Sparkles className="size-5 text-cyan-400" />
            {milestone ? "Edit Journey Milestone" : "Add Journey Milestone"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="m-title" className="text-xs font-mono uppercase text-slate-300">
                Milestone Title *
              </Label>
              <Input
                id="m-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Competitive Hackathons"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-sub" className="text-xs font-mono uppercase text-slate-300">
                Subtitle / Location
              </Label>
              <Input
                id="m-sub"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Rapid Prototyping & Innovation"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="m-desc" className="text-xs font-mono uppercase text-slate-300">
              Description *
            </Label>
            <Textarea
              id="m-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you achieve, build, or learn in this milestone?"
              rows={3}
              required
              className="bg-white/5 border-white/10 text-white leading-relaxed"
            />
          </div>

          {/* Stage & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase text-slate-300">
                Visual Stage Path
              </Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as JourneyStage)}
                className="w-full h-10 rounded-md bg-[#130f28] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0c0919]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-cat" className="text-xs font-mono uppercase text-slate-300">
                Category
              </Label>
              <Input
                id="m-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Core Skills, Competitions, Products"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Year, Date Range & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="m-year" className="text-xs font-mono uppercase text-slate-300">
                Display Year
              </Label>
              <Input
                id="m-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2025"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-daterange" className="text-xs font-mono uppercase text-slate-300">
                Date Range / Period
              </Label>
              <Input
                id="m-daterange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                placeholder="e.g. Mid 2025"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase text-slate-300">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "completed" | "in-progress" | "upcoming")}
                className="w-full h-10 rounded-md bg-[#130f28] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="completed" className="bg-[#0c0919]">Completed</option>
                <option value="in-progress" className="bg-[#0c0919]">In Progress</option>
                <option value="upcoming" className="bg-[#0c0919]">Upcoming</option>
              </select>
            </div>
          </div>

          {/* Icon selector & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase text-slate-300">Icon</Label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full h-10 rounded-md bg-[#130f28] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                {ICONS.map((ic) => (
                  <option key={ic} value={ic} className="bg-[#0c0919]">
                    {ic}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-tags" className="text-xs font-mono uppercase text-slate-300">
                Tags (comma separated)
              </Label>
              <Input
                id="m-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. React, Three.js, WebGL"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Highlighted & Published Switches */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Switch id="m-highlight" checked={highlighted} onCheckedChange={setHighlighted} />
              <Label htmlFor="m-highlight" className="text-xs sm:text-sm text-slate-200 cursor-pointer">
                Highlight this Milestone (Glowing Pulse)
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="m-publish" checked={published} onCheckedChange={setPublished} />
              <Label htmlFor="m-publish" className="text-xs sm:text-sm text-slate-200 cursor-pointer">
                Published (Visible on site)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/10 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving} className="gap-1.5">
              <X className="size-4" /> Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={saving} className="gap-2">
              <Save className="size-4" />
              {saving ? "Saving..." : "Save Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

