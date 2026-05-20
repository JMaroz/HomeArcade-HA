/**
 * Shared UI primitives used across all Settings sub-components.
 */
import React from "react";
import { Label } from "@/components/ui/label";

export function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4 max-w-prose">{description}</p>
      <div className="space-y-3">{children}</div>
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
