import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PlusCircle, ArrowRight, Trophy, BookOpen, TrendingUp, BarChart2 } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Exam, ExamResult, ExamAttempt } from "../lib/types";

interface DashboardStats {
  totalExams: number;
  examsAttempted: number;
  bestScore: number | null;
  averageScore: number | null;
}

interface RecentResult {
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  total_score: number;
  max_score: number;
  percentage: number;
  created_at: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: Exam["status"] }) {
  const map: Record<Exam["status"], { label: string; cls: string }> = {
    ready: { label: "Ready", cls: "bg-green-100 text-green-700" },
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
    processing: { label: "Processing", cls: "bg-blue-100 text-blue-700" },
    disabled: { label: "Disabled", cls: "bg-red-100 text-red-600" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border-l-4 border-gray-200 animate-pulse">
      <div className="h-9 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-100 rounded" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="flex-1 h-4 bg-gray-200 rounded" />
      <div className="h-4 w-16 bg-gray-100 rounded" />
      <div className="h-4 w-12 bg-gray-100 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  useEffect(() => {
    if (!user || !profile) return;
    fetchDashboardData();
  }, [user, profile]);

  async function fetchDashboardData() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [examsRes, attemptsRes, resultsRes, recentExamsRes] = await Promise.all([
        supabase.from("exams").select("*", { count: "exact", head: true }).eq("owner_id", profile?.id),
        supabase.from("exam_attempts").select("*", { count: "exact", head: true }).eq("user_id", profile?.id),
        supabase
          .from("results")
          .select("percentage, total_score, max_score, created_at, attempt_id, exam_attempts!inner(user_id, exam_id, exams(title))")
          .eq("exam_attempts.user_id", profile?.id),
        supabase
          .from("exams")
          .select("*")
          .eq("owner_id", profile?.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const totalExams = examsRes.count ?? 0;
      const examsAttempted = attemptsRes.count ?? 0;

      const results = (resultsRes.data ?? []) as any[];
      const percentages = results.map((r) => r.percentage ?? 0);
      const bestScore = percentages.length ? Math.max(...percentages) : null;
      const averageScore = percentages.length
        ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : null;

      setStats({ totalExams, examsAttempted, bestScore, averageScore });
      setRecentExams((recentExamsRes.data ?? []) as Exam[]);

      const recent: RecentResult[] = results.slice(0, 5).map((r) => ({
        attempt_id: r.attempt_id,
        exam_id: r.exam_attempts?.exam_id ?? "",
        exam_title: r.exam_attempts?.exams?.title ?? "Unknown Exam",
        total_score: r.total_score,
        max_score: r.max_score,
        percentage: r.percentage,
        created_at: r.created_at,
      }));
      setRecentResults(recent);
    } catch (err) {
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: "Total Exams Created",
      value: stats?.totalExams ?? 0,
      icon: BookOpen,
      color: "border-amber-500",
    },
    {
      label: "Exams Attempted",
      value: stats?.examsAttempted ?? 0,
      icon: TrendingUp,
      color: "border-blue-500",
    },
    {
      label: "Best Score",
      value: stats?.bestScore != null ? `${stats.bestScore}%` : "—",
      icon: Trophy,
      color: "border-green-500",
    },
    {
      label: "Average Score",
      value: stats?.averageScore != null ? `${stats.averageScore}%` : "—",
      icon: BarChart2,
      color: "border-purple-500",
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-navy-950" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1">{"Here's your progress"}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className={`bg-white rounded-2xl p-6 border-l-4 ${color} shadow-sm`}
                >
                  <div
                    className="text-4xl font-bold text-navy-950 mb-1"
                    style={{ fontFamily: "Fraunces, Georgia, serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Icon size={14} />
                    {label}
                  </div>
                </div>
              ))}
        </div>

        {/* Two column section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Exams */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-navy-950">Recent Exams</h2>
              <Link to="/exams" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="px-6 py-2 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
                </div>
              ) : recentExams.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">
                    No exams yet. Upload your first question paper.
                  </p>
                  <Link
                    to="/create-exam"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    <PlusCircle size={16} />
                    Create Exam
                  </Link>
                </div>
              ) : (
                recentExams.map((exam) => (
                  <div key={exam.id} className="px-6 py-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/exams/${exam.id}`}
                        className="text-sm font-medium text-navy-950 hover:text-amber-600 truncate block"
                      >
                        {exam.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={exam.status} />
                        <span className="text-xs text-slate-400">{exam.total_questions} questions</span>
                        <span className="text-xs text-slate-400">{formatDate(exam.created_at)}</span>
                      </div>
                    </div>
                    {exam.status === "ready" && (
                      <Link
                        to={`/exam/${exam.id}/instructions`}
                        className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Start
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-navy-950">Recent Results</h2>
              <Link to="/results" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="px-6 py-2 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
                </div>
              ) : recentResults.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <BarChart2 size={36} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No results yet. Start an exam to see your performance.</p>
                </div>
              ) : (
                recentResults.map((result) => {
                  const pct = Math.round(result.percentage);
                  const pctColor =
                    pct >= 70 ? "text-green-600" : pct >= 50 ? "text-orange-500" : "text-red-500";
                  return (
                    <div key={result.attempt_id} className="px-6 py-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-950 truncate">{result.exam_title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(result.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-bold ${pctColor}`} style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                          {pct}%
                        </p>
                        <p className="text-xs text-slate-400">
                          {result.total_score}/{result.max_score}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/create-exam"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
          >
            <PlusCircle size={18} />
            Create New Exam
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
