import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  FileText, Clock, BookOpen, Layers, AlertCircle, ChevronLeft, Play,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Exam, ExamSection } from "../lib/types";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} minutes`;
}

export default function ExamInstructionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: examData } = await supabase.from("exams").select("*").eq("id", id).single();
      if (examData) {
        setExam(examData as Exam);
        const { data: secs } = await supabase
          .from("exam_sections")
          .select("*")
          .eq("exam_id", id)
          .order("section_order");
        setSections((secs as ExamSection[]) ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleStart = async () => {
    if (!user || !exam) return;
    setStarting(true);
    setError("");
    try {
      const { data: attempt, error: attErr } = await supabase
        .from("exam_attempts")
        .insert({
          exam_id: exam.id,
          user_id: user.id,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (attErr) throw attErr;
      navigate(`/exam/${exam.id}/start?attempt=${attempt.id}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to start exam.");
      setStarting(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8941A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">Exam not found.</p>
          <Link to="/exams" className="mt-4 inline-block text-[#E8941A] hover:underline text-sm">
            Back to My Exams
          </Link>
        </div>
      </div>
    );
  }

  const negativeStr =
    exam.negative_marking > 0 ? `-${exam.negative_marking} mark per wrong answer` : "No negative marking";

  const instructions = [
    "Read each question carefully before selecting your answer.",
    "For single-choice questions, select exactly one option.",
    "For multiple-choice questions, select all correct options.",
    "You can mark questions for review and revisit them later.",
    "The timer will start once you click \"Start Exam\".",
    "Your answers are saved automatically.",
    "Do not close the browser window during the exam.",
    sections.some((s) => s.duration_seconds)
      ? "Sectional timing is enabled — sections lock automatically when time expires."
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <header className="bg-[#070D1A] px-6 py-3.5 flex items-center gap-3">
        <div className="w-7 h-7 bg-[#E8941A] rounded-md flex items-center justify-center">
          <FileText size={14} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">testivo</span>
      </header>

      <main className="py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Title band */}
          <div className="bg-[#070D1A] px-8 py-8">
            <p className="text-[#E8941A] text-xs font-semibold uppercase tracking-widest mb-2">Exam Instructions</p>
            <h1 className="text-white font-bold text-3xl leading-snug" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              {exam.title}
            </h1>
          </div>

          <div className="px-8 py-8 space-y-8">
            {/* Summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, label: "Total Questions", val: exam.total_questions },
                { icon: FileText, label: "Total Marks", val: exam.total_marks },
                { icon: Clock, label: "Duration", val: formatDuration(exam.duration_seconds) },
                { icon: Layers, label: "Sections", val: sections.length || 1 },
                {
                  icon: AlertCircle,
                  label: "Negative Marking",
                  val: exam.negative_marking > 0 ? `−${exam.negative_marking}` : "None",
                },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Icon size={16} className="text-[#E8941A] mb-2" />
                  <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                  <p className="text-gray-800 font-bold text-base">{val}</p>
                </div>
              ))}
            </div>

            {/* Sections table */}
            {sections.length > 1 && (
              <div>
                <h2 className="text-gray-800 font-semibold text-base mb-3">Sections</h2>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Section Name</th>
                        <th className="px-4 py-3 text-center">Questions</th>
                        <th className="px-4 py-3 text-center">Time Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sections.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-3 text-gray-700 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {s.end_question - s.start_question + 1}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {s.duration_seconds ? formatDuration(s.duration_seconds) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instructions list */}
            <div>
              <h2 className="text-gray-800 font-semibold text-base mb-3">Instructions</h2>
              <ul className="space-y-2.5">
                {instructions.map((instr, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#E8941A]/10 text-[#E8941A] text-xs font-bold flex-shrink-0 flex items-center justify-center">
                      {i + 1}
                    </span>
                    {instr}
                  </li>
                ))}
              </ul>
            </div>

            {/* Marking scheme note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
              <strong>Marking Scheme:</strong> +{exam.total_marks / Math.max(exam.total_questions, 1)} per correct answer.{" "}
              {negativeStr}.
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full py-4 rounded-xl bg-[#E8941A] hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                {starting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting…</>
                ) : (
                  <><Play size={18} /> Start Exam</>
                )}
              </button>
              <Link
                to="/exams"
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={15} />
                Back to My Exams
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
