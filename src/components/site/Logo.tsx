import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-display text-[1.9rem] leading-none tracking-tight text-foreground", className)}>
      AKM
      <svg viewBox="0 0 24 24" className="size-5 text-primary-glow drop-shadow-[0_0_10px_var(--primary)]" aria-hidden>
        <path
          fill="currentColor"
          d="M12 0c.6 6.4 2.2 9.6 5.1 10.9 1.4.6 3.6 1 6.9 1.1-3.3.1-5.5.5-6.9 1.1C14.2 14.4 12.6 17.6 12 24c-.6-6.4-2.2-9.6-5.1-10.9C5.5 12.5 3.3 12.1 0 12c3.3-.1 5.5-.5 6.9-1.1C9.8 9.6 11.4 6.4 12 0Z"
        />
      </svg>
    </span>
  );
}
