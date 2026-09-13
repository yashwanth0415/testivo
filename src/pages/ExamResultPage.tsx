import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  FileText, Clock, CheckCircle, XCircle, MinusCircle,
  BarChart2, RotateCcw, ChevronLeft, Eye,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "../lib/supabase";
import type { ExamResult, SectionResult, Exam } from "../lib/types";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// ── Circular gauge ─────────────────────────────────────────────────────────────
function CircularGauge({ pct }: { pct: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const clamp = Math.max(0, Math.min(100, pct));
  const offset = circ * (1 - clamp / 100);
  const color = clamp >= 60 ? "#22c55e" : clamp >= 40 ? "#E8941A" : "#ef4444";

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{round1(clamp)}%</span>
        <span className="text-white/40 text-xs mt-0.5">Score</span>
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />;
}

// ── Custom tooltip for recharts ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1729] border border-white/15 rounded-xl px-4 py-3 text-sm">
      {label && <p className="text-white/50 text-xs mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {round1(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const attemptId = searchParams.get("attempt") ?? "";

  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !attemptId) return;
    (async () => {
      const [{ data: examData }, { data: resultData }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", id).single(),
        supabase.from("results").select("*").eq("attempt_id", attemptId).single(),
      ]);
      if (examData) setExam(examData as Exam);
      if (resultData) {
        setResult(resultData as ExamResult);
        const { data: secRes } = await supabase
          .from("section_results")
          .select("*")
          .eq("result_id", resultData.id);
        setSectionResults((secRes as SectionResult[]) ?? []);
      }
      setLoading(false);
    })();
  }, [id, attemptId]);

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D1A] py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-64" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!result || !exam) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center text-white/60">
        <p>Result not found.</p>
      </div>
    );
  }

  const pieData = [
    { name: "Correct", value: result.correct_count, color: "#22c55e" },
    { name: "Incorrect", value: result.incorrect_count, color: "#ef4444" },
    { name: "Unanswered", value: result.unanswered_count, color: "#6b7280" },
  ].filter((d) => d.value > 0);

  const barData = sectionResults.map((s) => ({
    name: s.section_name,
    Score: s.score,
    Correct: s.correct,
    Incorrect: s.incorrect,
  }));

  const attempted = result.correct_count + result.incorrect_count;
  const marksPerAttempted = attempted > 0 ? round1(result.total_score / attempted) : 0;
  const timePerQ = attempted > 0 ? Math.round(result.time_taken_seconds / attempted) : 0;

  return (
    <div className="min-h-screen bg-[#070D1A]">
      {/* Minimal header */}
      <header className="bg-[#0D1729] border-b border-white/10 px-6 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 bg-[#E8941A] rounded-md flex items-center justify-center">
          <FileText size={13} className="text-white" />
        </div>
        <span className="text-white font-bold text-sm tracking-tight">testivo</span>
        <div className="h-5 w-px bg-white/10 mx-1" />
        <span className="text-white/50 text-sm">{exam.title}</span>
        <Link to="/exams" className="ml-auto flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ChevronLeft size={13} />
          My Exams
        </Link>
      </header>

      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* ── Score card ─────────────────────────────────────────────────────── */}
          <div className="bg-[#0D1729] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-8 py-8 flex flex-col sm:flex-row items-center gap-8">
              <CircularGauge pct={result.percentage} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-white/40 text-sm mb-2">Your Score</p>
                <p className="text-white font-bold text-5xl mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                  {round1(result.total_score)}
                  <span className="text-white/30 text-2xl font-normal"> / {result.max_score}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start text-sm">
                  <span className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle size={14} />
                    Correct: {result.correct_count}
                  </span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <XCircle size={14} />
                    Incorrect: {result.incorrect_count}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <MinusCircle size={14} />
                    Unanswered: {result.unanswered_count}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-white/40 text-sm justify-center sm:justify-start">
                  <Clock size={13} />
                  Time taken: {formatTime(result.time_taken_seconds)}
                </div>
              </div>
            </div>
          </div>

          {/* ── Performance summary ───────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Accuracy", val: `${round1(result.accuracy)}%`, icon: BarChart2, color: "text-amber-400" },
              { label: "Marks / Attempted", val: marksPerAttempted, icon: CheckCircle, color: "text-green-400" },
              { label: "Sec / Question", val: timePerQ + "s", icon: Clock, color: "text-blue-400" },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="bg-[#0D1729] border border-white/10 rounded-xl p-5 text-center">
                <Icon size={20} className={`${color} mx-auto mb-2`} />
                <p className="text-white font-bold text-2xl">{val}</p>
                <p className="text-white/40 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Charts ────────────────────────────────────────────────────────── */}
          <div className={`grid gap-6 ${sectionResults.length > 0 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {/* Pie chart */}
            <div className="bg-[#0D1729] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold text-sm mb-4">Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-3">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/60">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart (sections) */}
            {sectionResults.length > 1 && (
              <div className="bg-[#0D1729] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold text-sm mb-4">Section Scores</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="Score" fill="#E8941A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Section-wise table ────────────────────────────────────────────── */}
          {sectionResults.length > 0 && (
            <div className="bg-[#0D1729] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Section-wise Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/10">
                      <th className="px-6 py-3 text-left">Section</th>
                      <th className="px-4 py-3 text-center">Attempted</th>
                      <th className="px-4 py-3 text-center">Correct</th>
                      <th className="px-4 py-3 text-center">Incorrect</th>
                      <th className="px-4 py-3 text-center">Unanswered</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sectionResults.map((s) => (
                      <tr key={s.id} className="text-white/70 hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-3 font-medium text-white">{s.section_name}</td>
                        <td className="px-4 py-3 text-center">{s.attempted}</td>
                        <td className="px-4 py-3 text-center text-green-400">{s.correct}</td>
                        <td className="px-4 py-3 text-center text-red-400">{s.incorrect}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{s.unanswered}</td>
                        <td className="px-4 py-3 text-center text-amber-400 font-semibold">{round1(s.score)}</td>
                        <td className="px-4 py-3 text-center">{round1(s.accuracy)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Action buttons ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-10">
            <Link
              to={`/exam/${id}/review?attempt=${attemptId}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E8941A] hover:bg-amber-400 text-white font-semibold text-sm transition-colors"
            >
              <Eye size={15} />
              Review Answers
            </Link>
            <Link
              to={`/exam/${id}/instructions`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
            >
              <RotateCcw size={15} />
              Take Again
            </Link>
            <Link
              to="/exams"
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 hover:border-white/30 text-white/60 hover:text-white font-medium text-sm transition-colors"
            >
              <ChevronLeft size={15} />
              My Exams
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
