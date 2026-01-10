import Link from "next/link";
import { getSession, clearSession } from "@/lib/session";
import { query } from "@/lib/db";
import { ensureUserProfileColumnsOnce } from "@/lib/migrations";
import { redirect } from "next/navigation";
import GlowButton from "@/components/ui/GlowButton";
import { LogOut, Menu, Home, Send, Shield, BookOpen, FileText, Lock, Users, BarChart3, Sparkles, HelpCircle, ShieldAlert, AlertCircle, Heart, Info, DollarSign, User } from "lucide-react";
import { withBasePath } from "@/lib/url";
import AvatarImage from "@/components/AvatarImage";

async function logout() {
  "use server";
  await clearSession();
  redirect("/");
}

import AuthHeartbeat from "@/components/AuthHeartbeat";

export default async function Header() {
  const session = await getSession();
  if (!session) return null;

  await ensureUserProfileColumnsOnce();

  // Get the actual username and avatar
  const users = await query<{ username: string; avatar_url: string | null; role: "user" | "moderator" | "admin" }[]>(
    "SELECT username, avatar_url, role FROM users WHERE id = ? LIMIT 1",
    [session.userId]
  );
  const username = users[0]?.username || "User";
  const avatarUrl = users[0]?.avatar_url || null;
  const role = users[0]?.role || session.role;
  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || isAdmin;

  return (
    <header className="fixed top-6 left-6 right-6 md:left-auto md:right-6 z-50">
      <AuthHeartbeat />
      {/* Desktop header */}
      <div className="hidden md:flex justify-end">
        <div className="flex items-center gap-4 backdrop-blur-xl bg-[#2a2520]/95 rounded-2xl pl-6 pr-3 py-3 shadow-lg border border-[#e89a7a]/10">
          <span className="inline-flex items-center gap-3 text-sm text-[#b8aea5]">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#d97757] to-[#c96846] text-white shadow-md">
              <AvatarImage
                src={withBasePath(avatarUrl)}
                alt="Avatar"
                className="w-full h-full"
                fallbackIcon={<BookOpen className="h-4 w-4" />}
              />
            </div>
            <span>
              Willkommen,{" "}
              <span className="font-semibold text-[#f5f1ed]">{username}</span>
            </span>
          </span>

          {/* Desktop Navigation Dropdown */}
          <details className="relative group">
            <summary className="list-none cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#b8aea5] hover:text-[#f5f1ed] hover:bg-[#38302b] transition-all">
              <Menu className="h-4 w-4" />
              <span>Navigation</span>
            </summary>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-open:opacity-100 group-open:visible transition-all duration-200">
              <div className="min-w-64 backdrop-blur-xl bg-[#2a2520]/98 rounded-2xl shadow-2xl border border-[#e89a7a]/15 overflow-hidden">
                <div className="py-2">
                  {/* Allgemein Section */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-[#e89a7a] uppercase tracking-wider">Allgemein</p>
                  </div>
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Startseite
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    FAQ
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Mein Account
                  </Link>
                  <Link
                    href="/datenschutz"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Datenschutz
                  </Link>
                  <Link
                    href="/browse"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Beiträge durchsuchen
                  </Link>
                  <Link
                    href="/sponsoren"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    Sponsoren
                  </Link>
                  <Link
                    href="/sponsoring"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    Sponsoring
                  </Link>
                  <Link
                    href="/sponsoring/info"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <Info className="h-4 w-4" />
                    Sponsoring Info
                  </Link>

                  {/* Phasen Section */}
                  <div className="border-t border-[#e89a7a]/10 mt-2 pt-2">
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-[#e89a7a] uppercase tracking-wider">Phasen</p>
                    </div>
                    <Link
                      href="/phase-1"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Phase 1: Einsendungen
                    </Link>
                    <Link
                      href="/phase-2"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Phase 2: Abstimmungen
                    </Link>
                    <Link
                      href="/phase-3"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Phase 3: Finalisierung
                    </Link>
                  </div>

                  {/* Admin Section (für Moderatoren & Admins) */}
                  {isModerator && (
                    <div className="border-t border-[#e89a7a]/10 mt-2 pt-2">
                      <div className="px-3 py-2">
                        <p className="text-xs font-semibold text-[#e89a7a] uppercase tracking-wider">Administration</p>
                      </div>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        Admin-Dashboard
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin/user"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                          >
                            <Users className="h-4 w-4" />
                            Benutzerverwaltung
                          </Link>
                          <Link
                            href="/zugriff-verweigert"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                          >
                            <Lock className="h-4 w-4" />
                            Zugriff verweigert
                          </Link>
                          <Link
                            href="/404"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                          >
                            <AlertCircle className="h-4 w-4" />
                            404 Seite
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>

          <form action={logout}>
            <GlowButton
              variant="ghost"
              className="text-sm px-4 py-2 hover:bg-[#38302b] rounded-xl transition-all"
              iconLeft={<LogOut className="h-4 w-4" />}
            >
              Abmelden
            </GlowButton>
          </form>
        </div>
      </div>

      {/* Mobile header with hamburger menu */}
      <div className="md:hidden">
        <div className="flex items-center justify-between backdrop-blur-xl bg-[#2a2520]/95 rounded-2xl px-5 py-3 shadow-lg border border-[#e89a7a]/10">
          <span className="inline-flex items-center gap-2.5 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#d97757] to-[#c96846] text-white shadow-md">
              <AvatarImage
                src={withBasePath(avatarUrl)}
                alt="Avatar"
                className="w-full h-full"
                fallbackIcon={<BookOpen className="h-4 w-4" />}
              />
            </div>
            <span className="font-medium text-[#f5f1ed]">{username}</span>
          </span>

          <details className="relative">
            <summary className="list-none cursor-pointer p-2 rounded-lg hover:bg-[#38302b] transition-colors">
              <Menu className="h-5 w-5 text-[#b8aea5]" />
            </summary>

            <div className="absolute right-0 top-12 min-w-64 max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-[#2a2520]/98 rounded-2xl shadow-xl border border-[#e89a7a]/10">
              <div className="py-2">
                {/* Allgemein Section */}
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-[#e89a7a] uppercase tracking-wider">Allgemein</p>
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Startseite
                </Link>
                <Link
                  href="/faq"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mein Account
                </Link>
                <Link
                  href="/datenschutz"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Datenschutz
                </Link>
                <Link
                  href="/browse"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Beiträge durchsuchen
                </Link>
                <Link
                  href="/sponsoren"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Sponsoren
                </Link>
                <Link
                  href="/sponsoring"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Sponsoring
                </Link>
                <Link
                  href="/sponsoring/info"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                >
                  <Info className="h-4 w-4" />
                  Sponsoring Info
                </Link>

                {/* Phasen Section */}
                <div className="border-t border-[#e89a7a]/10 mt-2 pt-2">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-[#e89a7a] uppercase tracking-wider">Phasen</p>
                  </div>
                  <Link
                    href="/phase-1"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Phase 1: Einsendungen
                  </Link>
                  <Link
                    href="/phase-2"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Phase 2: Abstimmungen
                  </Link>
                  <Link
                    href="/phase-3"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Phase 3: Finalisierung
                  </Link>
                </div>

                {/* Admin Section (für Moderatoren & Admins) */}
                {isModerator && (
                  <div className="border-t border-[#e89a7a]/10 mt-2 pt-2">
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-[#e89a7a] uppercase tracking-wider">Administration</p>
                    </div>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      Admin-Dashboard
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin/user"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          Benutzerverwaltung
                        </Link>
                        <Link
                          href="/zugriff-verweigert"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                        >
                          <Lock className="h-4 w-4" />
                          Zugriff verweigert
                        </Link>
                        <Link
                          href="/404"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors"
                        >
                          <AlertCircle className="h-4 w-4" />
                          404 Seite
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Abmelden */}
                <div className="border-t border-[#e89a7a]/10 mt-2 pt-2">
                  <form action={logout} className="w-full">
                    <button
                      type="submit"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[#b8aea5] hover:bg-[#38302b] hover:text-[#e89a7a] transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Abmelden
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
