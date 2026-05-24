import React from "react";
import { ChevronDown } from "lucide-react";

export type SortOption = "title" | "lastPlayed" | "rating" | "year" | "playCount";
export type FilterStatus = "all" | "unset" | "playing" | "beaten" | "completed";

interface FilterBarProps {
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  filterStatus: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  totalGames: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "lastPlayed", label: "Last Played" },
  { value: "rating", label: "Rating" },
  { value: "year", label: "Year" },
  { value: "playCount", label: "Play Count" },
];

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unset", label: "Not Played" },
  { value: "playing", label: "Playing" },
  { value: "beaten", label: "Beaten" },
  { value: "completed", label: "Completed" },
];

export function FilterBar({ sortBy, onSortChange, filterStatus, onFilterChange, totalGames }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-1 mb-2">
      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer focus:ring-primary/40 focus:border-primary/40"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
      </div>

      {/* Filter pill buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = opt.value === filterStatus;
          return (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.3)]"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-transparent hover:border-white/10"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <span className="ml-auto text-[11px] text-white/20 font-mono">
        {totalGames} {totalGames === 1 ? "game" : "games"}
      </span>
    </div>
  );
}