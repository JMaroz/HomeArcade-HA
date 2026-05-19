import React, { Suspense, lazy } from "react";
import HomeArcadeTheme from "@/components/dashboard-themes/HomeArcadeTheme";
import { useIntegration } from "@/lib/integration";

const PxlTheme = lazy(() => import("@/components/dashboard-themes/PxlTheme"));

function ThemeFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  const { config } = useIntegration();
  const theme = config.dashboardTheme || "HomeArcade";

  return (
    <Suspense fallback={<ThemeFallback />}>
      {theme === "PXL" ? <PxlTheme /> : <HomeArcadeTheme />}
    </Suspense>
  );
}
