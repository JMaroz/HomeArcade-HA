import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Gamepad2, Play, ArrowRight, Image, Trophy, Wifi, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "ha-onboarded-v2";

const STEPS = [
  {
    icon: Gamepad2,
    title: "Welcome to HomeArcade",
    subtitle: "Your retro game library, right inside Home Assistant.",
    body: "HomeArcade turns your HA sidebar into a full retro gaming hub. Upload ROMs, browse with rich artwork, and launch games in your browser — no extra software needed.",
    cta: "Let's get started",
  },
  {
    icon: Upload,
    title: "Step 1 — Upload your ROMs",
    subtitle: "Get your games into the library.",
    body: "Go to Settings → Library and use the upload area to add your ROM files. ZIP files and most common formats are supported. Large files (PS2 ISOs, etc.) are streamed directly to disk.",
    cta: "Next",
  },
  {
    icon: Image,
    title: "Step 2 — Set up box art scraping",
    subtitle: "Make your library look great.",
    body: "HomeArcade can automatically fetch cover art, descriptions, and ratings. Go to Settings → Services and add your free ScreenScraper credentials. Without this, games will show placeholder art.",
    cta: "Next",
    action: { label: "Go to Settings →", href: "/settings" },
  },
  {
    icon: Play,
    title: "Step 3 — Play your games",
    subtitle: "You're ready to go.",
    body: "Tap any game card to open its details, then hit Play Now. The emulator runs right here in your browser. Use Warp Link (QR button) to seamlessly hand off a game from your PC to your phone.",
    cta: "Start playing",
  },
  {
    icon: Trophy,
    title: "Optional — RetroAchievements",
    subtitle: "Track your progress across games.",
    body: "Connect your free RetroAchievements account in Settings → Services to unlock achievement tracking, leaderboards, and progress stats across your entire library.",
    cta: "Done",
    skip: "Skip for now",
  },
];

export function WelcomeDialog({ hasRoms }: { hasRoms: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hasRoms && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [hasRoms]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-card-border">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === step
                  ? "w-5 h-1.5 bg-primary"
                  : i < step
                  ? "w-1.5 h-1.5 bg-primary/40"
                  : "w-1.5 h-1.5 bg-border"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pt-4 pb-2 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 mb-4">
            <Icon className="size-7 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl font-bold leading-tight">
            {current.title}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground font-medium">
            {current.subtitle}
          </DialogDescription>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-left">
            {current.body}
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex flex-col gap-2">
          {current.action ? (
            <Link href={current.action.href}>
              <Button variant="outline" className="w-full gap-2" onClick={dismiss}>
                {current.action.label}
              </Button>
            </Link>
          ) : null}

          <Button className="w-full gap-2" onClick={next}>
            {current.cta}
            {!isLast && <ArrowRight className="size-4" />}
          </Button>

          {current.skip && (
            <button
              type="button"
              onClick={dismiss}
              className="text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {current.skip}
            </button>
          )}

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-3" /> Back
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
