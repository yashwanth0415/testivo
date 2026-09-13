import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, FileText, PlusCircle, BarChart2, User, Settings, LogOut, Menu, X, ChevronRight, BookOpen
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Exams", icon: BookOpen, path: "/exams" },
  { label: "Create Exam", icon: PlusCircle, path: "/create-exam" },
  { label: "Results", icon: BarChart2, path: "/results" },
  { label: "Profile", icon: User, path: "/profile" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "p-4" : "p-6"}`}>
      <Link to="/dashboard" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <FileText size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-xl tracking-tight">testivo</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold text-sm">
            {profile?.full_name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-slate-500 truncate">@{profile?.username || "user"}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-navy-950 flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-navy-950">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-navy-950 border-b border-white/10">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-bold text-white text-lg tracking-tight">testivo</span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
