import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AuditLog {
  id: string;
  action: string;
  admin_user_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name?: string; username?: string };
}

const PAGE_SIZE = 20;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActions() {
      const { data } = await supabase.from("audit_logs").select("action");
      const unique = Array.from(new Set((data || []).map((d: { action: string }) => d.action)));
      setActionTypes(unique);
    }
    loadActions();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [actionFilter]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select("id, action, admin_user_id, metadata, created_at, profiles(full_name, username)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (actionFilter) {
        query = query.eq("action", actionFilter);
      }

      const { data, count } = await query;
      setLogs((data || []) as AuditLog[]);
      setTotal(count ?? 0);
      setLoading(false);
    }
    load();
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function metadataSummary(meta?: Record<string, unknown>) {
    if (!meta) return "—";
    const keys = Object.keys(meta);
    if (keys.length === 0) return "—";
    return keys
      .slice(0, 3)
      .map((k) => `${k}: ${String(meta[k]).slice(0, 30)}`)
      .join(", ");
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <span className="text-sm text-white/40">{total} entries</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-white/40" />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Actions</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: "#0D1729" }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <ClipboardListEmpty />
            <p className="mt-3 text-sm">No audit logs found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs border-b border-white/10">
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Admin User</th>
                <th className="px-6 py-3 font-medium">Metadata</th>
                <th className="px-6 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3">
                    <span className="text-xs font-mono bg-white/10 text-white/80 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-white/70">
                    {log.profiles?.full_name || log.profiles?.username || log.admin_user_id?.slice(0, 8) || "—"}
                  </td>
                  <td className="px-6 py-3 text-white/40 text-xs max-w-xs truncate">
                    {metadataSummary(log.metadata)}
                  </td>
                  <td className="px-6 py-3 text-white/50 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
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
    </div>
  );
}

function ClipboardListEmpty() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
