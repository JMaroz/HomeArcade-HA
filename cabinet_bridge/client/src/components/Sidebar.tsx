import { Link, useLocation } from "wouter";
import { SYSTEMS, type SystemId, GAMES } from "@/data/library";
import type { GameCollectionWithItems, UploadedRom } from "@shared/schema";
import { Wordmark } from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { filterToPath } from "@/lib/filter";
import {
  LayoutDashboard,
  Heart,
  Clock,
  LayoutGrid,
  BookMarked,
  Gamepad2,
  CheckCircle2,
  Settings as SettingsIcon,
  Trophy,
  Folder,
  History,
} from "lucide-react";

export type Filter = SystemId | `collection:${number}`;

interface SidebarProps {
  active: Filter;
  alwaysVisible?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ active, alwaysVisible = false, onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const onSettingsRoute = location.startsWith("/settings");
  const { data: kiosk } = useQuery<{ enabled: boolean }>({ queryKey: ["/api/kiosk"] });
  const kioskMode = !!kiosk?.enabled;
  const { data: uploadedRoms = [] } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
  const { data: collections = [] } = useQuery<GameCollectionWithItems[]>({ queryKey: ["/api/collections"] });

  const favCount      = GAMES.filter((g) => g.favorite).length + uploadedRoms.filter((r) => r.favorite).length;
  const recentCount   = GAMES.filter((g) => g.lastPlayed && g.lastPlayed > 0).length + uploadedRoms.filter((r) => r.lastPlayed && r.lastPlayed > 0).length;
  const allCount      = GAMES.length + uploadedRoms.length;
  const backlogCount  = uploadedRoms.filter((r) => r.playStatus === "backlog").length;
  const playingCount  = uploadedRoms.filter((r) => r.playStatus === "playing").length;
  const completedCount= uploadedRoms.filter((r) => r.playStatus === "completed").length;
  const systemCounts  = Object.fromEntries(
    SYSTEMS.map((system) => [
      system.id,
      GAMES.filter((g) => g.system === system.id).length + uploadedRoms.filter((r) => r.system === system.id).length,
    ]),
  ) as Record<string, number>;

  return (
    <aside
      className={`${alwaysVisible ? "flex" : "hidden lg:flex"} flex-col w-full lg:w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full`}
      data-testid="nav-sidebar"
    >
      {/* ── Drawer header ── */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          data-testid="link-home"
        >
          <Wordmark />
        </Link>
      </div>

      {/* ── Navigation items ── */}
      <nav className="flex-1 overflow-y-auto nav-scroll px-3 py-4 space-y-5">
        {/* Dashboard */}
        <NavSection label="">
          <NavItem
            icon={<LayoutDashboard className="size-[18px]" />}
            label="Dashboard"
            href="/"
            selected={location === "/" && !onSettingsRoute}
            onNavigate={onNavigate}
            testId="nav-dashboard"
          />
        </NavSection>

        {/* Library */}
        <NavSection label="Library">
          <NavItem icon={<Heart className="size-[18px]" />} label="Favorites" count={favCount}
            href={filterToPath("favorites")} selected={!onSettingsRoute && active === "favorites"}
            onNavigate={onNavigate} testId="nav-favorites" />
          <NavItem icon={<Clock className="size-[18px]" />} label="Recently Played" count={recentCount}
            href={filterToPath("recent")} selected={!onSettingsRoute && active === "recent"}
            onNavigate={onNavigate} testId="nav-recent" />
          <NavItem icon={<LayoutGrid className="size-[18px]" />} label="All Games" count={allCount}
            href={filterToPath("all")} selected={!onSettingsRoute && active === "all"}
            onNavigate={onNavigate} testId="nav-all" />
          {(backlogCount > 0 || playingCount > 0 || completedCount > 0) && (
            <>
              <NavItem icon={<BookMarked className="size-[18px]" />} label="Backlog" count={backlogCount}
                href={filterToPath("backlog" as any)} selected={!onSettingsRoute && (active as string) === "backlog"}
                onNavigate={onNavigate} testId="nav-backlog" />
              {playingCount > 0 && (
                <NavItem icon={<Gamepad2 className="size-[18px]" />} label="Now Playing" count={playingCount}
                  href={filterToPath("playing" as any)} selected={!onSettingsRoute && (active as string) === "playing"}
                  onNavigate={onNavigate} testId="nav-playing" />
              )}
              {completedCount > 0 && (
                <NavItem icon={<CheckCircle2 className="size-[18px]" />} label="Completed" count={completedCount}
                  href={filterToPath("completed" as any)} selected={!onSettingsRoute && (active as string) === "completed"}
                  onNavigate={onNavigate} testId="nav-completed" />
              )}
            </>
          )}
        </NavSection>

        {/* Systems */}
        <NavSection label="Systems">
          {SYSTEMS.map((s) => (
            <NavItem
              key={s.id}
              icon={
                <span
                  className="inline-block size-3.5 rounded-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, hsl(${s.art[0]}), hsl(${s.art[1]}))` }}
                />
              }
              label={s.shortName}
              count={systemCounts[s.id] ?? 0}
              href={filterToPath(s.id)}
              selected={!onSettingsRoute && active === s.id}
              onNavigate={onNavigate}
              testId={`nav-system-${s.id}`}
            />
          ))}
        </NavSection>

        {/* Collections */}
        {collections.length > 0 && (
          <NavSection label="Collections">
            {collections.map((collection) => (
              <NavItem
                key={collection.id}
                icon={<Folder className="size-[18px]" />}
                label={collection.name}
                count={collection.romIds.length}
                href={filterToPath(`collection:${collection.id}` as Filter)}
                selected={!onSettingsRoute && active === `collection:${collection.id}`}
                onNavigate={onNavigate}
                testId={`nav-collection-${collection.id}`}
              />
            ))}
          </NavSection>
        )}
      </nav>

      {/* ── Drawer footer ── */}
      <div className={`px-3 pb-4 border-t border-sidebar-border pt-3 space-y-0.5 ${kioskMode ? "hidden" : ""}`}>
        <NavItem
          icon={<History className="size-[18px]" />}
          label="History"
          href="/history"
          selected={location.startsWith("/history")}
          onNavigate={onNavigate}
          testId="link-history"
        />
        <NavItem
          icon={<Trophy className="size-[18px]" />}
          label="Achievements"
          href="/achievements"
          selected={location.startsWith("/achievements")}
          onNavigate={onNavigate}
          testId="link-achievements"
        />
        <NavItem
          icon={<SettingsIcon className="size-[18px]" />}
          label="Settings"
          href="/settings"
          selected={onSettingsRoute}
          onNavigate={onNavigate}
          testId="link-settings"
        />
      </div>
    </aside>
  );
}

/* ── MD3 Navigation Section (group label) ── */
function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <p className="px-4 mb-1 md-label-small text-muted-foreground/70 uppercase tracking-[0.1em]">
          {label}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/* ── MD3 Navigation Drawer Item ──
   Active state: indicator pill (primary-container bg, on-primary-container text, icon tinted primary)
   Inactive state: transparent bg, muted foreground, md3-state layer on hover/press
*/
function NavItem({
  icon,
  label,
  count,
  href,
  selected,
  onNavigate,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  href: string;
  selected: boolean;
  onNavigate?: () => void;
  testId: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-testid={testId}
      data-state={selected ? "active" : "inactive"}
      className={[
        /* MD3 nav-item base */
        "w-full flex items-center gap-3 px-4 h-[3.5rem] rounded-2xl",
        "md-label-large transition-colors duration-150",
        "md3-state",
        selected
          ? /* active — indicator filled */
            "bg-primary-container text-[hsl(var(--on-primary-container))] md3-state-primary"
          : /* inactive — transparent, state layer on hover */
            "text-sidebar-foreground/80 hover:bg-white/[0.05] md3-state-on-surface",
      ].join(" ")}
    >
      {/* Icon — tinted primary when active */}
      <span className={`shrink-0 ${selected ? "text-primary" : "text-sidebar-foreground/60"}`}>
        {icon}
      </span>
      <span className="truncate flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[11px] text-muted-foreground/60 tabular-nums shrink-0">
          {count.toLocaleString()}
        </span>
      )}
    </Link>
  );
}
