import { useEffect, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Profile {
  id: string;
  auth_user_id: string;
  full_name?: string;
  username?: string;
  email?: string;
  is_admin?: boolean;
  created_at: string;
  exams_count?: number;
  attempts_count?: number;
}

interface UserExam {
  id: string;
  title: string;
  created_at: string;
  status?: string;
}

interface ModalUser extends Profile {
  exams?: UserExam[];
}

const PAGE_SIZE = 10;

function initials(name?: string, username?: string) {
  const src = name || username || "?";
  return src
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ModalUser | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("id, auth_user_id, full_name, username, email, is_admin, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(
          `full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, count } = await query;
      setTotal(count ?? 0);

      // Fetch exam + attempt counts
      const enriched = await Promise.all(
        (data || []).map(async (p: Profile) => {
          const [{ count: ec }, { count: ac }] = await Promise.all([
            supabase
              .from("exams")
              .select("*", { count: "exact", head: true })
              .eq("owner_id", p.id),
            supabase
              .from("exam_attempts")
              .select("*", { count: "exact", head: true })
              .eq("user_id", p.auth_user_id),
          ]);
          return { ...p, exams_count: ec ?? 0, attempts_count: ac ?? 0 };
        })
      );
      setUsers(enriched);
      setLoading(false);
    }
    load();
  }, [page, search]);

  async function openUser(user: Profile) {
    setModalLoading(true);
    setSelectedUser({ ...user });
    const { data: exams } = await supabase
      .from("exams")
      .select("id, title, created_at, status")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setSelectedUser({ ...user, exams: (exams || []) as UserExam[] });
    setModalLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <span className="text-sm text-white/40">{total} total</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, username, email..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: "#0D1729" }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs border-b border-white/10">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium">Exams</th>
                <th className="px-6 py-3 font-medium">Attempts</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: "#E8941A40" }}>
                        {initials(u.full_name, u.username)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{u.full_name || "—"}</div>
                        {u.email && <div className="text-white/40 text-xs">{u.email}</div>}
                      </div>
                      {u.is_admin && (
                        <span className="text-xs bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">{u.username || "—"}</td>
                  <td className="px-6 py-4 text-white/50 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-white/80">{u.exams_count ?? 0}</td>
                  <td className="px-6 py-4 text-white/80">{u.attempts_count ?? 0}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openUser(u)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/30">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ backgroundColor: "#0D1729" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Profile info */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: "#E8941A50" }}
                >
                  {initials(selectedUser.full_name, selectedUser.username)}
                </div>
                <div>
                  <div className="text-white font-semibold">{selectedUser.full_name || "No name"}</div>
                  <div className="text-white/50 text-sm">@{selectedUser.username || "—"}</div>
                  {selectedUser.email && <div className="text-white/40 text-xs">{selectedUser.email}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Joined</div>
                  <div className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Role</div>
                  <div className="text-white">{selectedUser.is_admin ? "Admin" : "User"}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Exams Created</div>
                  <div className="text-white">{selectedUser.exams_count ?? 0}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Total Attempts</div>
                  <div className="text-white">{selectedUser.attempts_count ?? 0}</div>
                </div>
              </div>

              {/* Exams */}
              <div>
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  Their Exams
                </h3>
                {modalLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : selectedUser.exams && selectedUser.exams.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.exams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white/80 truncate">{exam.title}</span>
                        <span className="text-xs text-white/40 ml-2 shrink-0">
                          {new Date(exam.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30">No exams created.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
