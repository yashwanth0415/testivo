import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, HelpCircle, Cpu, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../lib/supabase";

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface ProcessingJob {
  id: string;
  status: string;
  created_at: string;
  profiles?: { full_name?: string; username?: string };
  source_file_path?: string;
}

interface AIConfig {
  id: string;
  is_active: boolean;
  last_tested_at?: string;
  ai_providers?: { name: string };
  ai_models?: { display_name: string; model_id: string };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([]);
  const [examActivity, setExamActivity] = useState<{ date: string; count: number }[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [recentJobs, setRecentJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        { count: userCount },
        { count: examCount },
        { count: attemptCount },
        { count: questionCount },
        { count: jobCount },
        { count: failedCount },
        { data: profiles },
        { data: exams },
        { data: activeAI },
        { data: jobs },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("exams").select("*", { count: "exact", head: true }),
        supabase.from("exam_attempts").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("processing_jobs").select("*", { count: "exact", head: true }),
        supabase
          .from("processing_jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "failed"),
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase
          .from("exams")
          .select("created_at")
          .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString()),
        supabase
          .from("ai_configurations")
          .select("id, is_active, last_tested_at, ai_providers(name), ai_models(display_name, model_id)")
          .eq("is_active", true)
          .single(),
        supabase
          .from("processing_jobs")
          .select("id, status, created_at, source_file_path, profiles(full_name, username)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setStats([
        { label: "Total Users", value: userCount ?? 0, icon: <Users size={20} />, color: "#6366F1" },
        { label: "Total Exams", value: examCount ?? 0, icon: <BookOpen size={20} />, color: "#E8941A" },
        { label: "Total Attempts", value: attemptCount ?? 0, icon: <ClipboardList size={20} />, color: "#10B981" },
        { label: "Total Questions", value: questionCount ?? 0, icon: <HelpCircle size={20} />, color: "#3B82F6" },
        { label: "Processing Jobs", value: jobCount ?? 0, icon: <Cpu size={20} />, color: "#8B5CF6" },
        { label: "Failed Jobs", value: failedCount ?? 0, icon: <AlertTriangle size={20} />, color: "#EF4444" },
      ]);

      // User growth by day
      const growthMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        growthMap[d.toISOString().slice(0, 10)] = 0;
      }
      (profiles || []).forEach((p: { created_at: string }) => {
        const day = p.created_at.slice(0, 10);
        if (growthMap[day] !== undefined) growthMap[day]++;
      });
      setUserGrowth(
        Object.entries(growthMap).map(([date, count]) => ({ date: date.slice(5), count }))
      );

      // Exam activity by day
      const examMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        examMap[d.toISOString().slice(0, 10)] = 0;
      }
      (exams || []).forEach((e: { created_at: string }) => {
        const day = e.created_at.slice(0, 10);
        if (examMap[day] !== undefined) examMap[day]++;
      });
      setExamActivity(
        Object.entries(examMap).map(([date, count]) => ({ date: date.slice(5), count }))
      );

      setAIConfig(activeAI as AIConfig | null);
      setRecentJobs((jobs || []) as ProcessingJob[]);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <span className="text-sm text-white/40">Last updated: {lastUpdated}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 border border-white/10"
            style={{ backgroundColor: "#0D1729" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-medium">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "#0D1729" }}>
          <h2 className="text-sm font-semibold text-white/70 mb-4">User Growth (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#070D1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                itemStyle={{ color: "#E8941A" }}
              />
              <Line type="monotone" dataKey="count" stroke="#E8941A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: "#0D1729" }}>
          <h2 className="text-sm font-semibold text-white/70 mb-4">Exam Activity (14 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={examActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#070D1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                itemStyle={{ color: "#6366F1" }}
              />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Config + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Config */}
        <div className="rounded-xl border border-white/10 p-6 space-y-4" style={{ backgroundColor: "#0D1729" }}>
          <h2 className="text-sm font-semibold text-white/70">Active AI Configuration</h2>
          {aiConfig ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Provider</span>
                <span className="text-sm text-white font-medium">{aiConfig.ai_providers?.name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Model</span>
                <span className="text-sm text-white font-medium">{aiConfig.ai_models?.display_name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Status</span>
                <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              {aiConfig.last_tested_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Last Tested</span>
                  <span className="text-xs text-white/60">
                    {new Date(aiConfig.last_tested_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/30">No active AI configuration.</p>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 p-6" style={{ backgroundColor: "#0D1729" }}>
          <h2 className="text-sm font-semibold text-white/70 mb-4">Recent Processing Jobs</h2>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-white/30">No jobs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/40 text-xs border-b border-white/10">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">File</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="py-2 text-white/80">
                        {job.profiles?.full_name || job.profiles?.username || "—"}
                      </td>
                      <td className="py-2 text-white/60 max-w-[120px] truncate">{job.source_file_path?.split("/").pop() || "—"}</td>
                      <td className="py-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            job.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : job.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2 text-white/40 text-xs">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
