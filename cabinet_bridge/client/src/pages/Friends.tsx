/**
 * Friends / Social Hub page.
 * Implements the Neon Synth design from friends_social_hub_pure reference.
 */
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Group,
  History,
  Settings,
  HelpCircle,
  MessageSquare,
  UserPlus,
  Mail,
  Search,
  UserSearch,
  Menu,
  Gamepad2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Mock data ────────────────────────────────────────────────────────────────
interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen?: string;
  playingGame?: string;
  sharedGames?: number;
}

const MOCK_ONLINE: Friend[] = [
  {
    id: "p2",
    name: "Player Two",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBI2AiS8DxgKrma46YX5og_-IrUWFj7vtXB9kVWXk3Y4t5__wTQJJb_EOoiKzRyxTOybJep-8XPuqqRWKExO6z2p1S6dZ5gZfTwnCCZssSi_wAR0j7hkpQ7Bg1zpReb1EmmTMySnRzcK-Htp6CDnyCcMNBGqC5UdWEgK-1yRI1Ps2QqqNsV4khECDSbyAhn_mVUlbDRrTcbg6pAndjVMwDyu79Wwunh69zRRGF_WJUJtSMjT4313k7gO8RL2FnQuvH_JKNBH_gzCw",
    isOnline: true,
    playingGame: "Picross",
  },
  {
    id: "nv",
    name: "NeonViper",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuApVi2YYWO2dr-AM19x21g2_Sm1TcNc1PiXb10bAj44O1F5z9Nxw_JQD7S4KClelghV1J6Pkp-kgPGZsoY8ggHOFe_cu0PvWek-kKcGg3pdyRZ81-b_E0u2iA6dSQPTye9g3hB24CbbLNIDHCzzrdYSU5RR8uvt4lC4rRSdlY_teKvNfKDDFJ1UgUSer4WUe1SXKok_w1xErbx_VKIA56UlwdiieNoNqJzfoHKdHc0PGX_C2Xo9YTPISxayfLnP8YL1nOFQtbILCQ",
    isOnline: true,
    playingGame: "Galaga '88",
  },
  {
    id: "ct",
    name: "CryptoTrader",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqElZiNwRPHWT4IT5NeDGzPhXcvv_enEOEcIQberJgYp6JcxcLxdcl8bvTlhdLELeuWmxV_EniZSc60SG0znjPoElCySXJ_47R_ZPxDXFUOQqE84AXsopcS3OM_WAN499O8g5DuTp27lb39j_k5_NqA2t4hMvdJsiFN7oSZ6rAuYlEkCgI1dC7y3wvCaF5f4Pt-tLS3kP3UmDY-CcG3J6Wak6QCygsH9V2B1gEe4dqiEEfa8TMXk9fak0o9hqe9lFyfB7suDG0uA",
    isOnline: true,
    playingGame: "DOOM",
  },
];

const MOCK_OFFLINE: Friend[] = [
  {
    id: "gp",
    name: "GhostPixel",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAYMUqF7cAkAj-0v6HYdjDSuZKgfbT8l-X0Z6Nz23aFcciOwmxVE5VRb9zIqjbaWPavR3fLjLXDZjvoMiudJbCpC-Y5068U1gmI_MnqG5FzzhBU2cH7uQ-oY3E_gjsPrOvIcZ9L3i5ZkMXXjGEUkF0b3cKdmsZHrl4aRo5kcyu0a1wi1V18ArqR7ND4TvnqapVQ8GKPzrh1m4FzbFeYMWyDONla2ely7kTTWcW7cK8-qIY4bWm5NfDv2zWIR24zPe39gF7HLEcSw",
    isOnline: false,
    lastSeen: "2h ago",
  },
  {
    id: "ak",
    name: "ArcadeKing",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3qxv7CVMpQ21Rv2KjMkrd3CTofcoCTTKlZWrD6XXbw3NPWQ_T4eifLsUt5W2kLmCbEvuHxF9gQjzIM94JfUGr0Mwy5ogZs4unVg-uwRPkeUML8aCbu10JW581bPcYvSmQYJVDv_OqcTxfEGrrtKPhAJS50fnm5HoVDaCdZVPXR_CE7PZS_tdmg3eVMndbWGDiCA3XBIWTbS3VS8ySnWaZ_YTphe1M0VtxiCjVq4nd9TJuNszTsUdp836PGES4ubKWjFd2To72aA",
    isOnline: false,
    lastSeen: "5h ago",
  },
];

const MOCK_SUGGESTED: Friend[] = [
  {
    id: "js",
    name: "JoyStick",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOtZHR72aGRxjcIC65854NdqmWhykMTTKkLIXKnG7YU4v0j2CxLKB6yj1XOhJzG0wlNUZy_jeAnZfPejmX0x5Se20fgE1cEajHVp-yuUVslw19FPcmuYDp9BLuVsHudxRrCdMjaUX1YmnysbWVOBzCKtNzAiWMju1d0NP4LqIa-xwqF0bw2tyu_fIDsqHw_l4C115u_iieZ6EHPmZsHMHC7uXUOA8RwTyk6R1ocLB8Jo2rMt-2QH1YLbbam4zaq_zYL9rILQagFg",
    isOnline: false,
    sharedGames: 5,
  },
  {
    id: "crt",
    name: "CRT_Lover",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBpR2WpH4xFWVe70HWGwXcC0VPugZP5EvLZRbouPKsqCTRRguPQkf9kQOBTI9-_LUXmC9AgZHYrlBUoK9Vy_BLbAtVT29pqbezMkwKCIdhm3snHKB-12vTAsuq8TaQUTM3BHF1sVF72mwT_X6M860V0B7vuZgB46EOlR2MeTbXmRooxfU4t0cChHLILtd5CQK5A0v_laJLsCeToddlM9x6o14qQuYt7x3NGaCAzD70ROIo3ckZgkIanFLjvdW80k_cKYZPBrIH7-A",
    isOnline: false,
    sharedGames: 2,
  },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function OnlineIndicator() {
  return (
    <span
      className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#00eefc] inline-block"
      aria-label="Online"
    />
  );
}

function FriendCardOnline({ friend }: { friend: Friend }) {
  return (
    <div className="glass-card neon-border-cyan rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
            <img
              src={friend.avatarUrl}
              alt={friend.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-secondary border-2 border-surface" />
        </div>
        <div>
          <p className="text-[18px] text-on-surface">{friend.name}</p>
          <p className="text-label-sm text-secondary/80">
            Playing: {friend.playingGame}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary-container/10 text-secondary border border-secondary/20 hover:bg-secondary-container/20 transition-colors"
          aria-label={`Chat with ${friend.name}`}
        >
          <MessageSquare className="size-[20px]" />
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:opacity-90 transition-opacity"
          aria-label={`Add ${friend.name} as friend`}
        >
          <UserPlus className="size-[20px]" />
        </button>
      </div>
    </div>
  );
}

function FriendCardOffline({ friend }: { friend: Friend }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/5 grayscale">
          <img
            src={friend.avatarUrl}
            alt={friend.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-[18px] text-on-surface-variant">{friend.name}</p>
          <p className="text-label-sm text-on-surface-variant/60">
            Last seen: {friend.lastSeen}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 text-on-surface-variant"
        aria-label={`Message ${friend.name}`}
      >
        <Mail className="size-[20px]" />
      </button>
    </div>
  );
}

function SuggestedCard({ friend, neon = false }: { friend: Friend; neon?: boolean }) {
  return (
    <div
      className={`glass-card rounded-2xl p-4 flex flex-col items-center text-center col-span-1 ${neon ? "neon-border-magenta" : ""}`}
    >
      <img
        src={friend.avatarUrl}
        alt={friend.name}
        className={`w-16 h-16 rounded-full border-2 mb-3 ${neon ? "border-primary" : "border-white/10"}`}
      />
      <p className="text-sm text-on-surface font-semibold">{friend.name}</p>
      <p className="text-[10px] text-on-surface-variant mb-4">
        Shared: {friend.sharedGames} Games
      </p>
      <button
        type="button"
        className={`w-full py-2 rounded-lg font-label-sm uppercase transition-all ${
          neon
            ? "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
            : "bg-white/5 border border-white/10 text-on-surface-variant hover:bg-white/10"
        }`}
      >
        Add
      </button>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

function SidebarNavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
        active
          ? "bg-secondary-container text-on-secondary-container font-bold"
          : "text-on-surface-variant hover:bg-white/5"
      }`}
    >
      <Icon className="size-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Friends() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-full">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col h-full py-6 bg-surface-container-low w-80 fixed left-0 top-0 z-50 border-r border-white/5">
        {/* Logo / Brand */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Gamepad2 className="text-on-primary size-5" />
          </div>
          <span className="text-headline-lg font-bold text-primary">HomeArcade</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2">
          <SidebarNavItem href="/" icon={Gamepad2} label="Library" />
          <SidebarNavItem href="/friends" icon={Group} label="Social Hub" active />
          <SidebarNavItem href="/history" icon={History} label="History" />
          <SidebarNavItem href="/settings" icon={Settings} label="Settings" />
          <SidebarNavItem href="/support" icon={HelpCircle} label="Support" />
        </nav>

        {/* User Profile */}
        <div className="px-4 mt-auto">
          <div className="flex items-center gap-4 p-4 rounded-xl glass-panel">
            <img
              alt="Player One"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCue6gFnB7IuTceqPiDkVuuG0ANQZZegrjbFAvdMaMnvv0hTRBymAeL1uZpjhUH0-hhuX04sy1hCgdy_ZowkWA3Ck8ZxZ-kNTAwePpXE1uTyhMFed0swSMuhze-WL6Kf9EyIfSc86uWGvfpbXdNvaxFwpRrgO8vW0eUaSMHFxEZygKTYhbjF6y5uDHYx1uARCEgJg1Oc6o-Wcbt87tkrIxo16XRK9s3Ew2ATpcZiEJR_P2c0m94vsVPescajvnHd-GcUuW949QYuQ"
              className="w-12 h-12 rounded-full border-2 border-primary/50 object-cover"
            />
            <div>
              <p className="font-bold text-on-surface">Player One</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-[12px] text-on-surface-variant">Online</p>
              </div>
              <p className="text-[10px] text-secondary font-label-sm">Level 42</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <nav
        className={`md:hidden fixed inset-y-0 left-0 z-[60] w-72 p-6 bg-surface-container-high/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl transition-transform ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center">
            <img
              alt="user_avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCue6gFnB7IuTceqPiDkVuuG0ANQZZegrjbFAvdMaMnvv0hTRBymAeL1uZpjhUH0-hhuX04sy1hCgdy_ZowkWA3Ck8ZxZ-kNTAwePpXE1uTyhMFed0swSMuhze-WL6Kf9EyIfSc86uWGvfpbXdNvaxFwpRrgO8vW0eUaSMHFxEZygKTYhbjF6y5uDHYx1uARCEgJg1Oc6o-Wcbt87tkrIxo16XRK9s3Ew2ATpcZiEJR_P2c0m94vsVPescajvnHd-GcUuW949QYuQ"
              className="w-full h-full rounded-lg object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-on-surface">Player One</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <p className="text-[12px] text-on-surface-variant">Online</p>
            </div>
            <p className="text-[10px] text-secondary font-label-sm">Level 42</p>
          </div>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-full flex items-center gap-4 p-3 text-on-surface hover:bg-white/5 transition-colors rounded-lg"
          >
            <Gamepad2 className="size-5" /> Home
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-4 p-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold"
          >
            <Group className="size-5" /> Social Hub
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-full flex items-center gap-4 p-3 text-on-surface hover:bg-white/5 transition-colors rounded-lg"
          >
            <History className="size-5" /> History
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-full flex items-center gap-4 p-3 text-on-surface hover:bg-white/5 transition-colors rounded-lg"
          >
            <Settings className="size-5" /> Settings
          </button>
          <div className="pt-8 mt-8 border-t border-white/10">
            <button
              type="button"
              className="w-full flex items-center gap-4 p-3 text-on-surface hover:bg-white/5 transition-colors rounded-lg"
            >
              <HelpCircle className="size-5" /> Support
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center gap-4 p-3 text-on-surface hover:bg-white/5 transition-colors rounded-lg"
            >
              <span className="size-5">→</span> Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-80 pt-16 md:pt-0 px-margin-mobile md:px-margin-desktop pb-12">
        {/* Top App Bar */}
        <header className="fixed top-0 left-0 md:left-80 right-0 z-50 flex justify-between items-center px-margin-mobile h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-primary/30"
              aria-label="Open menu"
            >
              <Menu className="size-4 text-primary" />
            </button>
            <h1 className="font-bold tracking-tighter text-primary text-lg md:text-xl">
              HomeArcade
            </h1>
          </div>
          <button
            className="text-primary hover:opacity-80 transition-opacity"
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="pt-24 md:pt-8 max-w-container-max mx-auto">
          {/* Search & Hub Header */}
          <section className="mb-8">
            <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
              Social Hub
            </h2>
            <div className="relative group">
              <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 size-5" />
              <input
                type="text"
                placeholder="FIND RETRO GAMERS..."
                className="w-full h-12 bg-surface-container/50 border-b border-white/10 focus:border-secondary-container outline-none px-12 font-label-caps text-label-caps tracking-widest uppercase"
              />
            </div>
          </section>

          {/* Online Friends */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
                Online — {MOCK_ONLINE.length}
              </h3>
              <OnlineIndicator />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {MOCK_ONLINE.map((friend) => (
                <FriendCardOnline key={friend.id} friend={friend} />
              ))}
            </div>
          </section>

          {/* Offline Friends */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant/40 tracking-widest uppercase">
                Offline — {MOCK_OFFLINE.length}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 opacity-60">
              {MOCK_OFFLINE.map((friend) => (
                <FriendCardOffline key={friend.id} friend={friend} />
              ))}
            </div>
          </section>

          {/* Suggested Friends — Bento Grid */}
          <section className="mt-12">
            <h3 className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-6">
              You may know
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {MOCK_SUGGESTED.map((friend, i) => (
                <SuggestedCard
                  key={friend.id}
                  friend={friend}
                  neon={i === 0}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-3 bg-surface-container/80 backdrop-blur-xl border-t border-white/10">
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors"
        >
          <Gamepad2 className="size-5" />
          <span className="text-label-sm">Library</span>
        </Link>
        <Link
          href="/friends"
          className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-xl p-2 scale-110"
        >
          <Group className="size-5" />
          <span className="text-label-sm">Friends</span>
        </Link>
        <Link
          href="/history"
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors"
        >
          <History className="size-5" />
          <span className="text-label-sm">History</span>
        </Link>
        <Link
          href="/settings"
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors"
        >
          <Settings className="size-5" />
          <span className="text-label-sm">Settings</span>
        </Link>
      </nav>
    </div>
  );
}