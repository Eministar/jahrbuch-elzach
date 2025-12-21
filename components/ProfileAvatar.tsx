"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Shield } from "lucide-react";
import { withBasePath } from "@/lib/url";
import AvatarImage from "@/components/AvatarImage";
import BannerImage from "@/components/BannerImage";

export type PublicUser = {
  id: number;
  username: string;
  class: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  role: 'user' | 'moderator' | 'admin';
};

type Props = {
  userId: number;
  username?: string;
  avatarUrl?: string | null;
  size?: number; // px
  className?: string;
};

export default function ProfileAvatar({ userId, username, avatarUrl, size = 28, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(
    username || avatarUrl ? { id: userId, username: username || "", class: null, bio: null, avatar_url: avatarUrl ?? null, banner_url: null, role: 'user' } : null
  );
  const [stats, setStats] = useState<{ follower_count: number; following_count: number; is_following: boolean; is_me?: boolean } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current && btnRef.current.contains(t)) return;
      if (popRef.current && popRef.current.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Eagerly load avatar/public info so the profile image is visible without clicking
  useEffect(() => {
    // If avatar is already known via props or state, skip fetching
    if (user?.avatar_url || avatarUrl) return;
    let active = true;
    fetch(`/api/users/public?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("load failed");
        const data = await r.json();
        if (!active) return;
        setUser(data.user as PublicUser);
        setStats(data.stats as { follower_count: number; following_count: number; is_following: boolean; is_me?: boolean });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [userId, avatarUrl, user?.avatar_url]);

  useEffect(() => {
    if (!open) return;
    if (user && user.bio !== null) return; // already fetched full
    setLoading(true);
    fetch(`/api/users/public?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("load failed");
        const data = await r.json();
        setUser(data.user as PublicUser);
        setStats(data.stats as { follower_count: number; following_count: number; is_following: boolean; is_me?: boolean });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, userId, user]);

  // Compute and update popover viewport position when opened and on scroll/resize
  useEffect(() => {
    if (!open) return;
    function compute() {
      const btn = btnRef.current;
      const pop = popRef.current;
      if (!btn || !pop) return;
      const rect = btn.getBoundingClientRect();
      const spacing = 8;
      const popRect = pop.getBoundingClientRect();
      let top = rect.bottom + spacing;
      let placement: 'top' | 'bottom' = 'bottom';
      if (top + popRect.height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - spacing - popRect.height);
        placement = 'top';
      }
      let left = rect.left;
      if (left + popRect.width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - 8 - popRect.width);
      }
      if (left < 8) left = 8;
      setPos({ top, left, placement });
    }
    compute();
    const handler = () => compute();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  const avatar = user?.avatar_url ?? avatarUrl ?? null;
  const avatarSrc = withBasePath(avatar);
  const bannerSrc = withBasePath(user?.banner_url ?? null);
  const label = user?.username || username || "User";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        ref={btnRef}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        className="rounded-full border border-[#e89a7a]/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#e89a7a]/40"
        style={{ width: size, height: size }}
        title={label}
      >
        <AvatarImage
          src={avatarSrc}
          alt={label}
          className="w-full h-full"
          fallbackIcon={<BookOpen className="w-3.5 h-3.5" />}
        />
      </div>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label={`Profil von ${label}`}
          className="fixed z-[1000] min-w-[260px] max-w-[360px] p-4 rounded-2xl border border-[#e89a7a]/20 bg-[#2a2520]/98 backdrop-blur-xl shadow-2xl"
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
        >
          {user?.banner_url && (
            <div className="-mt-1 -mx-1 mb-3 relative">
              <BannerImage
                src={bannerSrc}
                alt="Profilbanner"
                className="w-full h-20 object-cover rounded-xl border border-[#e89a7a]/20"
                onLoad={() => {
                  const btn = btnRef.current;
                  const pop = popRef.current;
                  if (!btn || !pop) return;
                  const rect = btn.getBoundingClientRect();
                  const spacing = 8;
                  const popRect = pop.getBoundingClientRect();
                  let top = rect.bottom + spacing;
                  let placement: 'top' | 'bottom' = 'bottom';
                  if (top + popRect.height > window.innerHeight - 8) {
                    top = Math.max(8, rect.top - spacing - popRect.height);
                    placement = 'top';
                  }
                  let left = rect.left;
                  if (left + popRect.width > window.innerWidth - 8) {
                    left = Math.max(8, window.innerWidth - 8 - popRect.width);
                  }
                  if (left < 8) left = 8;
                  setPos({ top, left, placement });
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e89a7a]/20">
              <AvatarImage
                src={avatarSrc}
                alt={label}
                className="w-full h-full"
                fallbackIcon={<BookOpen className="w-5 h-5" />}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#f5f1ed] flex items-center gap-2">
                <span className="truncate">{label}</span>{user?.role === 'admin' && (
                  <span title="Administrator" aria-label="Administrator" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                    <Shield className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              {user?.class && (
                <div className="text-xs text-[#b8aea5]">Klasse {user.class}</div>
              )}
            </div>
            <div>
              <button
                type="button"
                disabled={followBusy || !stats || stats.is_me}
                onClick={async () => {
                  if (!stats) return;
                  const next = !stats.is_following;
                  setFollowBusy(true);
                  // optimistic update
                  setStats({ ...stats, is_following: next, follower_count: stats.follower_count + (next ? 1 : -1) });
                  try {
                    const r = await fetch('/api/follow/toggle', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId }),
                    });
                    if (!r.ok) throw new Error('toggle failed');
                  } catch {
                    // revert on error
                    setStats((s) => s ? { ...s, is_following: !next, follower_count: s.follower_count + (!next ? 1 : -1) } : s);
                  } finally {
                    setFollowBusy(false);
                  }
                }}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${stats?.is_following ? 'bg-[#3a322b] border-[#e89a7a]/30 text-[#f5f1ed]' : 'bg-[#e89a7a]/15 border-[#e89a7a]/30 text-[#f5f1ed] hover:bg-[#e89a7a]/25'} ${followBusy || stats?.is_me ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-label={stats?.is_following ? 'Entfolgen' : 'Folgen'}
                title={stats?.is_me ? 'Das ist dein Profil' : (stats?.is_following ? 'Entfolgen' : 'Folgen')}
              >
                {stats?.is_me ? 'Du' : stats?.is_following ? 'Entfolgen' : 'Folgen'}
              </button>
            </div>
          </div>

          {stats && (
            <div className="flex items-center gap-3 text-[11px] text-[#b8aea5] mb-2">
              <div className="inline-flex items-center gap-1"><span className="text-[#f5f1ed] font-semibold">{stats.follower_count}</span> Follower</div>
              <div className="inline-flex items-center gap-1"><span className="text-[#f5f1ed] font-semibold">{stats.following_count}</span> Folgt</div>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="mb-2 inline-flex items-center gap-2 px-2 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20 text-xs" title="Administrator">
              <Shield className="w-3 h-3" aria-label="Administrator" />
              <span>Administrator – Mitglied des Admin-Teams</span>
            </div>
          )}
          <div className="text-sm text-[#b8aea5] whitespace-pre-wrap">
            {loading && <span className="opacity-70">Lädt…</span>}
            {!loading && (user?.bio ? user.bio : <span className="opacity-70">Keine Bio vorhanden.</span>)}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
