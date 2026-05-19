import React from "react";

/** Skeleton placeholder for game cards during loading */
export function GameCardSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-2.5 sm:gap-4 md:gap-5 grid-cols-[repeat(auto-fill,minmax(85px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 animate-pulse"
          style={{
            animationDelay: `${(i % 6) * 80}ms`,
          }}
        >
          {/* Shimmer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}