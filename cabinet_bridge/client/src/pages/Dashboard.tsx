import React, { Suspense } from "react";
import PlayHubTheme from "@/components/dashboard-themes/PlayHubTheme";

function ThemeFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<ThemeFallback />}>
      <PlayHubTheme />
    </Suspense>
  );
}
