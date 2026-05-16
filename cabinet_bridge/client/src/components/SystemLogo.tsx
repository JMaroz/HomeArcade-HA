import { useState } from "react";
import { ConsoleSilhouette } from "@/components/ConsoleSilhouette";
import { apiUrl } from "@/lib/queryClient";

/**
 * Official system logo fetched through the same-origin /api/system-logos proxy
 * so HA Ingress CORS restrictions never block the request.
 *
 * Falls back instantly to ConsoleSilhouette on any load error (404, timeout,
 * network failure). No spinner — the silhouette is the graceful degradation.
 */
export function SystemLogo({ systemId }: { systemId: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <ConsoleSilhouette systemId={systemId} />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <img
        src={apiUrl(`/api/system-logos/${systemId}`)}
        alt=""
        className="w-full h-full object-contain"
        style={{
          filter: "brightness(0) invert(1)",
          opacity: 0.85,
          WebkitFilter: "brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
        }}
        loading="eager"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
