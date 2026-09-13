import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, BarChart2, ExternalLink } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type DateFilter = "This Week" | "This Month" | "All Time";

interface ResultRow {
  result_id: string;
  attempt_id: string;
  exam_id: string;
  exam_title: string;
  date_taken: string;
  total_score: number;
  max_score: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function PercentageBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 70
      ? "text-green-700 bg-green-50"
      : pct >= 50
      ? "text-orange-600 bg-orange-50"
      : "text-red-600 bg-red-50";
  return (
    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${cls}`}>{Math.round(pct)}%</span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function ResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All Time");

  useEffect(() => {
    if (!user) return;
    fetchResults();
  }, [user]);

  async function fetchResults() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("exam_results")
        .select(
          `
          id,
          attempt_id,
          total_score,
          max_score,
          percentage,
          correct_count,
          incorrect_count,
          unanswered_count,
          time_taken_seconds,
          created_at,
          exam_attempts!inner(
            user_id,
            exam_id,
            exams(title)
          )
        `
        )
        .eq("exam_attempts.user_id", user.id)
        .order("created_at", { ascending: false });

      if (err) throw err;

      const rows: ResultRow[] = (data ?? []).map((r: any) => ({
        result_id: r.id,
        attempt_id: r.attempt_id,
        exam_id: r.exam_attempts?.exam_id ?? "",
        exam_title: r.exam_attempts?.exams?.title ?? "Unknown Exam",
        date_taken: r.created_at,
        total_score: r.total_score,
        max_score: r.max_score,
        percentage: r.percentage,
        correct_count: r.correct_count,
        incorrect_count: r.incorrect_count,
        unanswered_count: r.unanswered_count,
        time_taken_seconds: r.time_taken_seconds,
      }));
      setResults(rows);
    } catch {
      setError("Failed to load results. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const now = new Date();
    return results.filter((r) => {
      const matchesSearch = r.exam_title.toLowerCase().includes(search.toLowerCase());
      let matchesDate = true;
      if (dateFilter === "This Week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = new Date(r.date_taken) >= weekAgo;
      } else if (dateFilter === "This Month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchesDate = new Date(r.date_taken) >= monthAgo;
      }
      return matchesSearch && matchesDate;
    });
  }, [results, search, dateFilter]);

  const DATE_FILTERS: DateFilter[] = ["This Week", "This Month", "All Time"];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-navy-950" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          My Results
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by exam name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2">
            {DATE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  dateFilter === f
                    ? "bg-navy-950 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Exam Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date Taken
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Correct / Wrong / Skip
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Time Taken
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-20 text-center">
                      <BarChart2 size={40} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">
                        {results.length === 0
                          ? "No results yet. Start an exam to see your performance here."
                          : "No results match your filters."}
                      </p>
                      {results.length === 0 && (
                        <Link
                          to="/exams"
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
                        >
                          Browse Exams
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.result_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-navy-950 max-w-[200px] truncate">
                        {r.exam_title}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(r.date_taken)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                        {r.total_score} / {r.max_score}
                      </td>
                      <td className="px-4 py-4">
                        <PercentageBadge pct={r.percentage} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 font-semibold">{r.correct_count}✓</span>
                          <span className="text-red-500 font-semibold">{r.incorrect_count}✗</span>
                          <span className="text-gray-400">{r.unanswered_count}–</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatTime(r.time_taken_seconds)}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/exam/${r.exam_id}/result?attempt=${r.attempt_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <ExternalLink size={12} />
                          View Result
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
