import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  Github,
  Linkedin,
  Check,
  Copy,
  Sparkles,
  MessageSquare,
  User,
  AtSign,
  FileText,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.webp";
import { HeroFog } from "./HeroFog";
import { Floating3DBackdrop } from "./Floating3DBackdrop";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { prefersReducedMotion } from "@/lib/scroll";
import { sendContactMessageFn } from "@/lib/server-api";

export function Contact() {
  const { play } = useSound();
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Copy email status
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    play("click");
    navigator.clipboard.writeText("akshay123modi@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmitted) return;

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage("Please write a message with at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    play("click");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || "Portfolio Inquiry",
        message: message.trim(),
        ...(honeypot ? { honeypot } : {}),
      };

      // 1. Primary: Secure Vercel Serverless API route (/api/contact)
      let sent = false;
      let errorText = "";

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const resData = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (response.ok && resData?.success !== false) {
          sent = true;
        } else {
          errorText = resData?.error || resData?.message || `Server returned ${response.status}`;
        }
      } catch {
        // Fallback to internal server function if running locally without standalone /api
        try {
          await sendContactMessageFn({ data: payload });
          sent = true;
        } catch (fnErr) {
          errorText = fnErr instanceof Error ? fnErr.message : "Failed to deliver message";
        }
      }

      if (!sent) {
        throw new Error(errorText || "Failed to send message. Please try emailing directly.");
      }

      setIsSubmitted(true);
      play("click");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setHoneypot("");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send message. Please try emailing directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative isolate min-h-[100svh] w-full overflow-hidden flex flex-col justify-center py-20 sm:py-24 text-foreground bg-[#0b0816] scroll-mt-0"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Background world: continuous with Hero, About, Projects & Journey */}
      {/* ----------------------------------------------------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-cover bg-[position:60%_100%] opacity-85"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-[image:var(--gradient-aurora)] opacity-60"
      />

      {/* Seamless atmospheric blend transition from Journey */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0b0816] via-[#0b0816]/60 to-transparent -z-20"
      />

      {/* Synchronized Hero rising smoke fog layer */}
      <HeroFog />

      {/* Floating 3D Glass Objects and Orbital Curves */}
      <Floating3DBackdrop variant="cyan-right" />

      <div className="section-shell relative z-20 mx-auto w-full max-w-5xl">
        {/* ============================================================= */}
        {/* SECTION HEADER                                                */}
        {/* ============================================================= */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px 0px 50px 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto pb-10 sm:pb-12"
        >
          {/* Badge */}
          <div className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-300 border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            05 / GET IN TOUCH
          </div>

          {/* Heading */}
          <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white">
            Let's Build Something <span className="text-gradient-shimmer">Exceptional.</span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 font-sans text-xs sm:text-sm tracking-[0.32em] text-slate-300 uppercase font-medium">
            Collaborations • Systems • Applied AI • Inquiries
          </p>
        </motion.div>

        {/* ============================================================= */}
        {/* INTERACTIVE DUAL-COLUMN CONTACT CONSOLE                       */}
        {/* ============================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Connect & Info Card */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "100px 0px 50px 0px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 space-y-4"
          >
            {/* Status Card */}
            <div
              className="relative overflow-hidden rounded-[24px] bg-[#0c081c]/94 border border-white/15 p-6 backdrop-blur-none sm:backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
              style={{
                borderLeft: "2.5px solid #06b6d4",
                borderRight: "2.5px solid #a855f7",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                </span>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  Open for All Collaborations
                </span>
              </div>

              <h3 className="mt-4 font-display text-2xl font-bold text-white">
                Direct Communication
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Whether you have an ambitious product idea, an open-source vision, or want to discuss applied artificial intelligence, I'm always open to connecting.
              </p>

              {/* Quick Copy Email Pill */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="size-4 text-cyan-400 shrink-0" />
                    <span className="font-mono text-xs sm:text-sm text-slate-200 truncate">
                      akshay123modi@gmail.com
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="glass-pill px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Profile Links: GitHub & LinkedIn */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <a
                  href="https://github.com/akshaykumarmodi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Github className="size-4 text-cyan-400" />
                  <span>GitHub</span>
                  <ArrowUpRight className="size-3.5 opacity-60" />
                </a>

                <a
                  href="https://www.linkedin.com/in/akshay-kumar-modi-27306637b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Linkedin className="size-4 text-blue-400" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="size-3.5 opacity-60" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Functional Interactive Contact Console */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "100px 0px 50px 0px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            <div
              className="relative overflow-hidden rounded-[26px] bg-[#0c081c]/94 border border-white/15 p-6 sm:p-8 backdrop-blur-none sm:backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)]"
              style={{
                borderLeft: "2.5px solid #a855f7",
                borderRight: "2.5px solid #06b6d4",
              }}
            >
              {/* Traveling light beam along border */}
              {!reducedMotion && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-[1.5px] rounded-[27px] overflow-hidden opacity-60"
                  style={{ contain: "paint" }}
                >
                  <div
                    className="absolute -inset-[100%] animate-[border-beam-spin_10s_linear_infinite]"
                    style={{
                      background:
                        "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 75deg, rgba(168, 85, 247, 0.85) 95deg, rgba(6, 182, 212, 0.95) 120deg, transparent 145deg, transparent 360deg)",
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-cyan-400" />
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
                    Send a Message
                  </span>
                </div>
                <span className="text-[0.70rem] font-mono text-slate-400">
                  Response within 24h
                </span>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="size-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 grid place-items-center mx-auto text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                    <Check className="size-7 text-cyan-300" />
                  </div>
                  <h4 className="font-display text-2xl font-bold text-white">
                    Message Delivered
                  </h4>
                  <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Thank you! Your message has been received and routed directly to my personal inbox. I will review it and get back to you shortly.
                  </p>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field (hidden from human visitors) */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="website_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                      {errorMessage}
                    </div>
                  )}

                  {/* Name & Email Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-300">
                        <User className="size-3.5 text-purple-400" />
                        <span>Your Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ada Lovelace"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.07] focus:outline-none text-sm transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-300">
                        <AtSign className="size-3.5 text-cyan-400" />
                        <span>Your Email *</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ada@example.com"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-400 focus:bg-white/[0.07] focus:outline-none text-sm transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-300">
                      <FileText className="size-3.5 text-purple-400" />
                      <span>Subject</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Collaboration / Project Inquiry"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/[0.07] focus:outline-none text-sm transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-300">
                      <MessageSquare className="size-3.5 text-cyan-400" />
                      <span>Message *</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell me about your project, ideas, or timeline..."
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-4 text-white placeholder-slate-500 focus:border-purple-400 focus:bg-white/[0.07] focus:outline-none text-sm transition-all leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full gap-2.5 mt-2 shadow-[0_0_30px_rgba(168,85,247,0.45)]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Transmit Message</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Seamless atmospheric blend transition into footer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#0b0816]/60 to-[#0b0816] -z-20"
      />
    </section>
  );
}

