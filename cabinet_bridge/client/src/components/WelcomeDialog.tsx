import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Gamepad2, Play, ArrowRight, BookOpen } from "lucide-react";

const STORAGE_KEY = "ha-onboarded";

const STEPS = [
  {
    icon: Upload,
    title: "Upload your ROMs",
    body: "Drag-and-drop or click the upload area on the library page. ZIP files and most common ROM formats are supported.",
  },
  {
    icon: BookOpen,
    title: "Scrape metadata",
    body: "Open any game's detail card and hit Scrape to pull cover art, descriptions, and ratings from ScreenScraper automatically.",
  },
  {
    icon: Play,
    title: "Launch and play",
    body: "Click a game card, then Launch. The emulator runs right here in your browser — no extra software needed.",
  },
];

export function WelcomeDialog({ hasRoms }: { hasRoms: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasRoms && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [hasRoms]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-card-border">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 mb-4">
            <Gamepad2 className="size-7 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl font-bold">
            Welcome to HomeArcade
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Your retro game library, right inside Home Assistant.
          </DialogDescription>
        </div>

        {/* Steps */}
        <div className="px-8 py-6 space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{step.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.body}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex flex-col gap-2">
          <Button className="w-full gap-2" onClick={dismiss}>
            Get started <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Need help?{" "}
            <a
              href="https://github.com/GlerschNersch/token/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Open an issue on GitHub
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
