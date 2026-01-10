import { redirect } from "next/navigation";
import { getSessionWithDbRole } from "@/lib/auth";
import { query } from "@/lib/db";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";
import UserListClient from "./UserListClient";
import ClassPdfGenerator from "./ClassPdfGenerator";
import NewUserForm from "./NewUserForm";
import { banUserAction, unbanUserAction, banIpAction, unbanIpAction } from "../actions";
import { Users, Shield, KeyRound, UserPlus, Ban, ArrowLeft, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ensureUserClassColumn, ensurePollSubmissionsTable } from "@/lib/migrations";
import { CLASSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type UserRow = { id: number; username: string; role: "user" | "moderator" | "admin"; class: string | null; has_voted: number };

export default async function AdminUserPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getSessionWithDbRole();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/zugriff-verweigert");

  await ensureUserClassColumn();
  await ensurePollSubmissionsTable();

  const sp = await searchParams;
  const q = typeof sp?.q === "string" ? sp.q.trim() : "";
  const classFilter = typeof sp?.class === "string" ? sp.class.trim() : "";
  const page = typeof sp?.page === "string" ? Math.max(1, parseInt(sp.page) || 1) : 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q) { where.push("u.username LIKE ?"); params.push(`%${q}%`); }
  if (classFilter === "none") { where.push("u.class IS NULL"); }
  else if (classFilter) { where.push("u.class = ?"); params.push(classFilter); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Total count for pagination
  const countResult = await query<{total: number}[]>(
    `SELECT COUNT(*) as total FROM users u ${whereSql}`,
    params
  );
  const totalUsersInFilter = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalUsersInFilter / limit);

  // Stats - query separately to be accurate for ALL users, not just filtered/paginated
  const statsRows = await query<{role: string, count: number}[]>(
    `SELECT role, COUNT(*) as count FROM users GROUP BY role`
  );
  const stats = {
    total: statsRows.reduce((acc, row) => acc + row.count, 0),
    admins: statsRows.find(r => r.role === 'admin')?.count || 0,
    moderators: statsRows.find(r => r.role === 'moderator')?.count || 0,
    users: statsRows.find(r => r.role === 'user')?.count || 0,
  };

  // Grouped counts for sidebar (always for all users)
  const groupRows = await query<{class: string | null, count: number}[]>(
    `SELECT class, COUNT(*) as count FROM users GROUP BY class`
  );
  const groups = [
    { label: 'Ohne Klasse', count: groupRows.find(r => r.class === null)?.count || 0, value: 'none' },
    ...CLASSES.map((c) => ({ label: c, count: groupRows.find(r => r.class === c)?.count || 0, value: c })),
  ];

  const users = await query<UserRow[]>(
    `SELECT u.id, u.username, u.role, u.class, 
     COALESCE((SELECT 1 FROM poll_submissions ps WHERE ps.user_id = u.id LIMIT 1), 0) as has_voted
     FROM users u ${whereSql} ORDER BY u.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#1a1714] via-[#221e1a] to-[#1a1714]">
      <div className="hidden md:block pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#e89a7a]/6 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-[#8faf9d]/6 blur-3xl" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12 space-y-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#e89a7a]/10 border border-[#e89a7a]/20">
            <Shield className="h-4 w-4 text-[#e89a7a]" />
            <span className="text-xs font-medium tracking-wide uppercase text-[#e89a7a]">
              Nur für Admins
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#f5f1ed] mb-4">
            Benutzerverwaltung
          </h1>
          <p className="text-lg text-[#b8aea5] max-w-2xl mx-auto">
            Alle Account-Werkzeuge an einem Ort – schön, klar, schnell.
          </p>
        </div>

        {/* PDF Generator */}
        <GlassCard
          header={
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8faf9d]/10 text-[#8faf9d]">
                <FileDown className="h-5 w-5"/>
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[#f5f1ed]">Login-Daten als PDF</h3>
                <p className="text-sm text-[#b8aea5]">Erstelle eine übersichtliche PDF-Liste für eine Klasse zum Verteilen.</p>
              </div>
            </div>
          }
        >
          <ClassPdfGenerator />
        </GlassCard>

        {/* Quick stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {label:'Gesamt',value:stats.total,icon:<Users className='h-5 w-5'/>, color: "from-[#d97757] to-[#c96846]"},
            {label:'Admins',value:stats.admins,icon:<Shield className='h-5 w-5'/>, color: "from-[#c96846] to-[#b85836]"},
            {label:'Moderatoren',value:stats.moderators,icon:<KeyRound className='h-5 w-5'/>, color: "from-[#7a9b88] to-[#6a8b78]"},
            {label:'Users',value:stats.users,icon:<Users className='h-5 w-5'/>, color: "from-[#b8957a] to-[#a88568]"}
          ].map((s,i)=> (
            <GlassCard key={s.label} delay={i*0.05}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm text-[#b8aea5]">{s.label}</div>
                  <div className="text-2xl font-bold text-[#f5f1ed]">{s.value}</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left: Users list */}
          <div className="flex-[2_1_0%] min-w-0 space-y-6 lg:space-y-8">
            <GlassCard
              header={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#e89a7a]/10 text-[#e89a7a]">
                      <Users className="h-5 w-5"/>
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-[#f5f1ed]">Benutzer</h3>
                      <p className="text-sm text-[#b8aea5]">Rollen, Passwörter und Login-Links verwalten.</p>
                    </div>
                  </div>
                  <a href="/admin" className="text-sm text-[#e89a7a] hover:underline inline-flex items-center gap-1 whitespace-nowrap">
                    <ArrowLeft className="h-3 w-3" />
                    Zurück
                  </a>
                </div>
              }
            >
              <form
                method="GET"
                className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3"
              >
                <input type="text" name="q" defaultValue={q} placeholder="Suche Username" className="input-base flex-1 min-w-[180px]" />
                <select name="class" defaultValue={classFilter} className="input-base sm:min-w-[140px]">
                  <option value="">Alle Klassen</option>
                  <option value="none">Ohne Klasse</option>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <GlowButton variant="primary" className="px-5 whitespace-nowrap">Filtern</GlowButton>
                <a href="/admin/user" className="text-sm text-[#e89a7a] hover:underline whitespace-nowrap">Zurücksetzen</a>
              </form>

              {/* User list with own scroll if very many entries */}
              <div className="max-h-[calc(100vh-360px)] lg:max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                <UserListClient users={users} />
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t border-[#e89a7a]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-[#b8aea5]">
                    Seite <span className="text-[#f5f1ed] font-medium">{page}</span> von <span className="text-[#f5f1ed] font-medium">{totalPages}</span>
                    <span className="ml-2 text-xs">({totalUsersInFilter} Benutzer gesamt)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlowButton
                      as="a"
                      variant="secondary"
                      disabled={page <= 1}
                      href={page <= 1 ? undefined : `/admin/user?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${classFilter ? `&class=${encodeURIComponent(classFilter)}` : ""}`}
                      className="px-3 py-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </GlowButton>
                    <div className="flex items-center gap-1">
                      {/* Optional: Page numbers could go here if needed */}
                    </div>
                    <GlowButton
                      as="a"
                      variant="secondary"
                      disabled={page >= totalPages}
                      href={page >= totalPages ? undefined : `/admin/user?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${classFilter ? `&class=${encodeURIComponent(classFilter)}` : ""}`}
                      className="px-3 py-1.5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </GlowButton>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right: Create + Ban */}
          <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink space-y-6 min-w-0">
            <GlassCard
              header={
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8faf9d]/10 text-[#8faf9d]">
                    <Users className="h-5 w-5"/>
                  </span>
                  <h3 className="text-lg font-semibold text-[#f5f1ed]">Nach Klassen</h3>
                </div>
              }
            >
              <div className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-hidden">
                {groups.map((g) => (
                  <a
                    key={g.label}
                    href={`/admin/user?class=${g.value}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      classFilter === g.value
                        ? "bg-[#e89a7a]/20 border-[#e89a7a]/40 text-[#f5f1ed]"
                        : "bg-[#2a2520]/40 border-[#e89a7a]/10 text-[#b8aea5] hover:border-[#e89a7a]/20 hover:text-[#f5f1ed]"
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{g.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 shrink-0">
                      {g.count}
                    </span>
                  </a>
                ))}
              </div>
            </GlassCard>

            <GlassCard
              header={
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#e89a7a]/10 text-[#e89a7a]">
                    <UserPlus className="h-5 w-5"/>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#f5f1ed]">Benutzer anlegen</h3>
                    <p className="text-sm text-[#b8aea5]">Schnell einen Zugang erstellen.</p>
                  </div>
                </div>
              }
            >
              <NewUserForm />
            </GlassCard>

            <GlassCard
              header={
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#d97757]/10 text-[#d97757]">
                    <Ban className="h-5 w-5"/>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#f5f1ed]">Sperren</h3>
                    <p className="text-sm text-[#b8aea5]">User- und IP-Sperren verwalten.</p>
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-semibold mb-3 text-[#f5f1ed]">Benutzer sperren</div>
                  <form action={banUserAction} className="space-y-3">
                    <input name="user_id" placeholder="User ID" className="input-base w-full" />
                    <input name="reason" placeholder="Grund (optional)" className="input-base w-full" />
                    <input name="expires_at" type="datetime-local" className="input-base w-full" />
                    <GlowButton variant="primary" className="w-full">Sperren</GlowButton>
                  </form>
                  <form action={unbanUserAction} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                    <input name="user_id" placeholder="User ID" className="input-base flex-1" />
                    <GlowButton variant="secondary" className="px-4 whitespace-nowrap">Entsperren</GlowButton>
                  </form>
                </div>
                <div className="pt-3 border-t border-[#e89a7a]/10">
                  <div className="text-sm font-semibold mb-3 text-[#f5f1ed]">IP sperren</div>
                  <form action={banIpAction} className="space-y-3">
                    <input name="ip" placeholder="IP-Adresse" className="input-base w-full" />
                    <input name="reason" placeholder="Grund (optional)" className="input-base w-full" />
                    <input name="expires_at" type="datetime-local" className="input-base w-full" />
                    <GlowButton variant="primary" className="w-full">Sperren</GlowButton>
                  </form>
                  <form action={unbanIpAction} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                    <input name="ip" placeholder="IP-Adresse" className="input-base flex-1" />
                    <GlowButton variant="secondary" className="px-4 whitespace-nowrap">Entsperren</GlowButton>
                  </form>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
