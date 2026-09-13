import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { CheckCircle, XCircle, MinusCircle, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Question {
  id: string;
  question_text: string;
  image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks?: number;
  negative_marks?: number;
  order_index: number;
}

interface AttemptAnswer {
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  marks_earned?: number;
}

interface Exam {
  id: string;
  title: string;
}

interface Attempt {
  id: string;
  score: number;
  total_marks: number;
  exam_id: string;
}

const OPTION_KEYS = ["a", "b", "c", "d"] as const;
type OptionKey = (typeof OPTION_KEYS)[number];
const OPTION_LABEL: Record<OptionKey, string> = { a: "A", b: "B", c: "C", d: "D" };

function getOptionText(q: Question, opt: OptionKey) {
  return q[`option_${opt}` as keyof Question] as string;
}

export default function ExamReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<string, AttemptAnswer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) throw new Error("Not authenticated");

        // Fetch exam
        const { data: examData, error: examErr } = await supabase
          .from("exams")
          .select("id, title")
          .eq("id", id)
          .single();
        if (examErr) throw examErr;
        setExam(examData as Exam);

        // Fetch latest attempt for this exam by user
        const { data: attemptData, error: attemptErr } = await supabase
          .from("exam_attempts")
          .select("id, score, total_marks, exam_id")
          .eq("exam_id", id)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (attemptErr) throw attemptErr;
        setAttempt(attemptData as Attempt);

        // Fetch questions
        const { data: qs, error: qErr } = await supabase
          .from("questions")
          .select("id, question_text, image_url, option_a, option_b, option_c, option_d, correct_option, marks, negative_marks, order_index")
          .eq("exam_id", id)
          .order("order_index", { ascending: true });
        if (qErr) throw qErr;
        setQuestions((qs || []) as Question[]);

        // Fetch answers
        const { data: ans, error: ansErr } = await supabase
          .from("attempt_answers")
          .select("question_id, selected_option, is_correct, marks_earned")
          .eq("attempt_id", attemptData.id);
        if (ansErr) throw ansErr;
        const ansMap = new Map<string, AttemptAnswer>();
        (ans || []).forEach((a: AttemptAnswer) => ansMap.set(a.question_id, a));
        setAnswers(ansMap);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load review");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#070D1A" }}>
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#070D1A" }}>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#070D1A" }}>
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-20 border-b border-white/10 px-6 py-4"
        style={{ backgroundColor: "#070D1A" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/exam/${id}/result`}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Results
            </Link>
            <div>
              <h1 className="text-base font-semibold text-white">{exam?.title}</h1>
              <p className="text-xs text-white/40">Answer Review</p>
            </div>
          </div>
          {attempt && (
            <div className="text-right">
              <div className="text-lg font-bold text-amber-400">
                {attempt.score} / {attempt.total_marks}
              </div>
              <div className="text-xs text-white/40">Total Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {questions.map((q, idx) => {
          const answer = answers.get(q.id);
          const selected = answer?.selected_option?.toLowerCase() as OptionKey | undefined;
          const correct = q.correct_option?.toLowerCase() as OptionKey;
          const marksEarned = answer?.marks_earned ?? 0;
          const isCorrect = answer?.is_correct;
          const isUnanswered = !selected;

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{ backgroundColor: "#0D1729" }}
            >
              {/* Question header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-start gap-3 flex-1">
                  <span className="shrink-0 text-xs font-bold text-white/40 bg-white/10 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-white text-sm leading-relaxed">{q.question_text}</p>
                </div>
                <div className="ml-4 shrink-0 flex items-center gap-2">
                  {isUnanswered ? (
                    <span className="flex items-center gap-1 text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                      <MinusCircle size={12} />
                      Unanswered
                    </span>
                  ) : isCorrect ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                      <CheckCircle size={12} />
                      Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
                      <XCircle size={12} />
                      Incorrect
                    </span>
                  )}
                  <span className="text-xs text-white/50 font-medium">
                    {marksEarned >= 0 ? "+" : ""}{marksEarned} pts
                  </span>
                </div>
              </div>

              {/* Question image */}
              {q.image_url && (
                <div className="px-6 pt-4">
                  <img
                    src={q.image_url}
                    alt="Question"
                    className="rounded-lg max-h-48 object-contain"
                  />
                </div>
              )}

              {/* Options */}
              <div className="px-6 py-4 space-y-2.5">
                {OPTION_KEYS.map((opt) => {
                  const isCorrectOpt = opt === correct;
                  const isSelectedOpt = opt === selected;
                  const isWrongSelected = isSelectedOpt && !isCorrectOpt;

                  let bg = "bg-white/5 border-white/10";
                  let textColor = "text-white/70";
                  let labelBg = "bg-white/10 text-white/50";

                  if (isCorrectOpt) {
                    bg = "bg-green-500/15 border-green-500/40";
                    textColor = "text-green-100";
                    labelBg = "bg-green-500/40 text-green-100";
                  }
                  if (isWrongSelected) {
                    bg = "bg-red-500/15 border-red-500/40";
                    textColor = "text-red-100";
                    labelBg = "bg-red-500/40 text-red-100";
                  }

                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} transition-colors`}
                    >
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${labelBg}`}
                      >
                        {OPTION_LABEL[opt]}
                      </span>
                      <span className={`text-sm ${textColor} flex-1`}>{getOptionText(q, opt)}</span>
                      {isCorrectOpt && (
                        <CheckCircle size={15} className="text-green-400 shrink-0" />
                      )}
                      {isWrongSelected && (
                        <XCircle size={15} className="text-red-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {questions.length === 0 && (
          <div className="text-center text-white/30 py-16">No questions found.</div>
        )}
      </div>
    </div>
  );
}
