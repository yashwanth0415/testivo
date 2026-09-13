import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Cpu,
  Sparkles,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Exams", path: "/admin/exams", icon: BookOpen },
  { label: "Processing", path: "/admin/processing", icon: Cpu },
  { label: "AI Config", path: "/admin/ai", icon: Sparkles },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: ClipboardList },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminName, setAdminName] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, full_name, username")
        .eq("auth_user_id", userId)
        .single();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }
      setAdminName(profile.full_name || profile.username || "Admin");
      setChecking(false);
    }
    checkAdmin();
  }, [navigate]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#070D1A" }}>
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#070D1A" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col border-r border-white/10 shrink-0"
        style={{ backgroundColor: "#0D1729" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#E8941A" }}
          >
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">testivo</span>
          <span className="ml-1 text-xs font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + "/");
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
                style={active ? { backgroundColor: "#E8941A20", color: "#E8941A" } : {}}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          <div className="text-xs text-white/40 truncate">{adminName}</div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
