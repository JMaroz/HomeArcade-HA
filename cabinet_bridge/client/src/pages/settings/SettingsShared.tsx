/**
 * Shared UI primitives used across all Settings sub-components.
 */
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";

export function Section({ 
  title, 
  description, 
  children,
  defaultOpen = false 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="group">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group-hover:bg-accent/5 p-1 rounded-lg transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">{description}</p>
        </div>
        <div className="shrink-0 size-8 rounded-full border border-border flex items-center justify-center bg-card shadow-sm group-hover:border-primary/40 group-hover:text-primary transition-all">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-6 space-y-3 pl-1 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 size-6 rounded-full bg-arcade-gradient text-white font-mono text-[12px] font-bold flex items-center justify-center">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-sm">{title}</div>
        <div className="text-sm text-muted-foreground mt-1 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-foreground/80">
          {children}
        </div>
      </div>
    </li>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 rounded-md border border-border bg-background/60 p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/90 max-w-full">
      <code>{children}</code>
    </pre>
  );
}
