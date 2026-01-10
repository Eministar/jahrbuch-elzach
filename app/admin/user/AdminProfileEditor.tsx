"use client";

import { useEffect, useState } from 'react';
import GlowButton from '@/components/ui/GlowButton';
import ProfileAvatar from '@/components/ProfileAvatar';
import { withBasePath } from '@/lib/url';

type PublicUser = {
  id: number;
  username: string;
  class: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

export default function AdminProfileEditor({ userId, username }: { userId: number; username: string; }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<{ follower_count: number; following_count: number } | null>(null);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removingBanner, setRemovingBanner] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const bannerSrc = bannerUrl ? withBasePath(bannerUrl) : null;
  const avatarSrc = avatarUrl ? withBasePath(avatarUrl) : null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/users/public?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('load failed');
        const data = await r.json();
        if (!active) return;
        const u = data.user as PublicUser;
        setUser(u);
        setStats(data.stats ? { follower_count: Number(data.stats.follower_count || 0), following_count: Number(data.stats.following_count || 0) } : null);
        setBio(u.bio || '');
        setAvatarUrl(u.avatar_url || null);
        setBannerUrl(u.banner_url || null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [userId]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', String(userId));
    try {
      const res = await fetch('/api/admin/user/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload fehlgeschlagen');
      setAvatarUrl(data.url);
      setMessage('Profilbild aktualisiert. Nicht vergessen zu speichern.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
      setMessage(msg);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', String(userId));
    try {
      const res = await fetch('/api/admin/user/banner', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload fehlgeschlagen');
      setBannerUrl(data.url);
      setMessage('Banner aktualisiert. Nicht vergessen zu speichern.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
      setMessage(msg);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bio, avatar_url: avatarUrl, banner_url: bannerUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen');
      setMessage('Profil gespeichert.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!avatarUrl) return;
    setRemoving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bio, avatar_url: null, banner_url: bannerUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Entfernen fehlgeschlagen');
      setAvatarUrl(null);
      setMessage('Profilbild entfernt.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Entfernen fehlgeschlagen';
      setMessage(msg);
    } finally {
      setRemoving(false);
    }
  }

  async function handleRemoveBanner() {
    if (!bannerUrl) return;
    setRemovingBanner(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bio, avatar_url: avatarUrl, banner_url: null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Entfernen fehlgeschlagen');
      setBannerUrl(null);
      setMessage('Banner entfernt.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Entfernen fehlgeschlagen';
      setMessage(msg);
    } finally {
      setRemovingBanner(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-[#b8aea5]">Lädt Profil…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar userId={userId} username={username} size={36} />
          <div>
            <div className="text-sm text-[#f5f1ed] font-medium">{username}</div>
            {user?.class && (
              <div className="text-xs text-[#b8aea5]">Klasse {user.class}</div>
            )}
            {stats && (
              <div className="text-xs text-[#b8aea5]">
                {stats.follower_count} Follower · {stats.following_count} Folgt
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#f5f1ed]">Banner</label>
        <div className="w-full h-24 rounded-xl overflow-hidden bg-[#38302b] border border-[#e89a7a]/20">
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerSrc || undefined} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center text-[#b8aea5] text-sm">Kein Banner</div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input type="file" accept="image/*" onChange={handleBannerUpload} className="block text-sm text-[#b8aea5] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#e89a7a]/20 file:text-[#e89a7a] hover:file:bg-[#e89a7a]/30" />
          {bannerUrl && (
            <GlowButton variant="secondary" onClick={handleRemoveBanner} loading={removingBanner}>
              Banner entfernen
            </GlowButton>
          )}
        </div>
        <p className="text-xs text-[#8faf9d]">Erlaubte Formate: JPG, PNG, WEBP, GIF. Max 10MB.</p>
      </div>

      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#38302b] flex items-center justify-center border border-[#e89a7a]/20">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc || undefined} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#b8aea5] text-sm">Kein Bild</span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f5f1ed] mb-2">Profilbild</label>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="block text-sm text-[#b8aea5] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#e89a7a]/20 file:text-[#e89a7a] hover:file:bg-[#e89a7a]/30" />
          <p className="text-xs text-[#8faf9d] mt-2">Erlaubte Formate: JPG, PNG, WEBP, GIF. Max 5MB.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#f5f1ed] mb-2">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full rounded-lg bg-[#2a2520] border border-[#e89a7a]/20 p-3 text-sm text-[#f5f1ed] placeholder-[#b8aea5] focus:outline-none focus:ring-2 focus:ring-[#e89a7a]/40"
          placeholder="Bio des Nutzers"
        />
        <div className="text-xs text-[#b8aea5] mt-1">{bio.length}/2000</div>
      </div>

      {message && <div className="text-sm text-[#e89a7a]">{message}</div>}

      <div className="flex gap-3">
        <GlowButton onClick={handleSave} loading={saving}>Speichern</GlowButton>
        {avatarUrl && (
          <GlowButton variant="secondary" onClick={handleRemove} loading={removing}>Bild entfernen</GlowButton>
        )}
      </div>
    </div>
  );
}
