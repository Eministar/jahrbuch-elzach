"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import GlowButton from "@/components/ui/GlowButton";
import LoginLinkClient from "./LoginLinkClient";
import ResetPollClient from "./ResetPollClient";
import { deleteUserAction, updateUserPasswordAction, updateUserRoleAction } from "../actions";
import { Trash2, QrCode, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import AdminProfileEditor from "./AdminProfileEditor";

type UserRow = {
  id: number;
  username: string;
  role: "user" | "moderator" | "admin";
  class: string | null;
  has_voted: number;
};

export default function UserListClient({ users, compact = false }: { users: UserRow[]; compact?: boolean }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams?.toString();
  const returnTo = qs ? `${pathname}?${qs}` : pathname;

  return (
    <div className="space-y-2">
      {users.length === 0 ? (
        <div className="text-center py-12 text-[#b8aea5]">
          Keine Benutzer gefunden. Passe deine Filter an.
        </div>
      ) : compact ? (
        // Compact view for sidebar - just show usernames
        users.map((u) => (
          <div
            key={u.id}
            className="px-3 py-2 rounded-lg bg-[#2a2520]/60 hover:bg-[#38302b]/60 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm min-w-0">
              <ProfileAvatar userId={u.id} username={u.username} size={20} />
              <span className="text-[#f5f1ed] truncate flex-1 min-w-0">{u.username}</span>
              <span className="text-xs text-[#b8aea5] shrink-0">#{u.id}</span>
            </div>
          </div>
        ))
      ) : (
        // Full view - show all users, each Eintrag einklappbar
        users.map((u) => {
          const isExpanded = expandedId === u.id;
          return (
            <div
              key={u.id}
              className="rounded-xl border border-[#e89a7a]/15 bg-[#2a2520]/60 hover:border-[#e89a7a]/25 transition-all overflow-hidden"
            >
              {/* Compact header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : u.id)}
                className="w-full px-2 sm:px-3 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-2 text-left hover:bg-[#38302b]/30 transition-colors"
              >
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                  <ProfileAvatar userId={u.id} username={u.username} size={24} />
                  <span className="font-semibold text-[#f5f1ed] truncate text-xs sm:text-sm min-w-0">
                    {u.username}
                  </span>
                  <span className="hidden xs:inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-[#e89a7a]/10 text-[#e89a7a] border border-[#e89a7a]/20 text-[10px] sm:text-xs font-medium shrink-0 whitespace-nowrap">
                    {u.role}
                  </span>
                  {u.class && (
                    <span className="hidden lg:inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-[#8faf9d]/10 text-[#8faf9d] border border-[#8faf9d]/20 text-[10px] sm:text-xs font-medium shrink-0 whitespace-nowrap">
                      {u.class}
                    </span>
                  )}
                  <span
                    className={`hidden xl:inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium shrink-0 whitespace-nowrap ${
                      u.has_voted
                        ? "bg-[#8faf9d]/10 text-[#8faf9d]"
                        : "bg-[#d97757]/10 text-[#d97757]"
                    }`}
                  >
                    {u.has_voted ? "✓ abgestimmt" : "○ nicht"}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <span className="hidden md:inline text-xs text-[#b8aea5]">#{u.id}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#e89a7a]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#b8aea5]" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-3 pb-4 space-y-4 border-top border-[#e89a7a]/10">
                  {/* Mobile chips */}
                  <div className="flex flex-wrap gap-2 pt-3 lg:hidden">
                    {u.class && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#8faf9d]/10 text-[#8faf9d] border border-[#8faf9d]/20 text-xs font-medium">
                        {u.class}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.has_voted
                          ? "bg-[#8faf9d]/10 text-[#8faf9d]"
                          : "bg-[#d97757]/10 text-[#d97757]"
                      }`}
                    >
                      {u.has_voted ? "✓ Abgestimmt" : "○ Nicht abgestimmt"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#b8aea5]/10 text-[#b8aea5] text-xs font-medium">
                      ID: {u.id}
                    </span>
                  </div>

                  {/* Role & Password */}
                  <div className="pt-3 space-y-3">
                    <div className="flex flex-col gap-2">
                      <form
                        action={updateUserRoleAction}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0"
                      >
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="input-base text-sm flex-1 min-w-0"
                        >
                          <option value="user">user</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>
                        <GlowButton
                          variant="primary"
                          className="px-3 py-2 text-sm whitespace-nowrap"
                        >
                          Rolle ändern
                        </GlowButton>
                      </form>
                      <form action={deleteUserAction} className="w-full">
                        <input type="hidden" name="id" value={u.id} />
                        <GlowButton
                          variant="secondary"
                          className="px-3 py-2 text-sm w-full sm:w-auto"
                          iconLeft={<Trash2 className="h-4 w-4" />}
                        >
                          Löschen
                        </GlowButton>
                      </form>
                    </div>

                    <form
                      action={updateUserPasswordAction}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        name="password"
                        type="password"
                        placeholder="Neues Passwort"
                        className="input-base text-sm flex-1 min-w-0"
                      />
                      <GlowButton
                        variant="secondary"
                        className="px-3 py-2 text-sm whitespace-nowrap"
                      >
                        Passwort ändern
                      </GlowButton>
                    </form>
                  </div>

                  {/* Profil */}
                  <div className="pt-3 border-t border-[#e89a7a]/10">
                    <div className="inline-flex items-center gap-2 text-xs text-[#b8aea5] mb-2">
                      <span>Profil:</span>
                    </div>
                    <AdminProfileEditor userId={u.id} username={u.username} />
                  </div>

                  {/* Login Link */}
                  <div className="pt-3 border-t border-[#e89a7a]/10">
                    <div className="inline-flex items-center gap-2 text-xs text-[#b8aea5] mb-2">
                      <QrCode className="h-3.5 w-3.5 text-[#e89a7a]" />
                      <span>Login-Link erstellen:</span>
                    </div>
                    <LoginLinkClient userId={u.id} username={u.username} />
                  </div>

                  {/* Poll status */}
                  <div className="pt-3 border-t border-[#e89a7a]/10">
                    <div className="inline-flex items-center gap-2 text-xs text-[#b8aea5] mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#8faf9d]" />
                      <span>Umfrage-Status:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          u.has_voted
                            ? "bg-[#8faf9d]/10 text-[#8faf9d]"
                            : "bg-[#d97757]/10 text-[#d97757]"
                        }`}
                      >
                        {u.has_voted ? "Hat abgestimmt" : "Nicht abgestimmt"}
                      </span>
                      <ResetPollClient userId={u.id} username={u.username} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
