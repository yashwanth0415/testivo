import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  FileText, ChevronLeft, ChevronRight, Flag, Trash2, Send,
  Maximize2, AlertTriangle, X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Exam, ExamSection, Question, QuestionOption } from "../lib/types";

// ── Colour helpers ─────────────────────────────────────────────────────────────
type QStatus = "not-visited" | "visited" | "answered" | "marked" | "answered-marked";

function qStatusColor(status: QStatus): string {
  switch (status) {
    case "answered": return "bg-green-600 text-white";
    case "marked": return "bg-purple-600 text-white";
    case "answered-marked": return "bg-purple-600 text-white ring-2 ring-green-400";
    case "visited": return "bg-yellow-500 text-white";
    default: return "bg-white/10 text-white/60";
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

// ── Submit Modal ───────────────────────────────────────────────────────────────
interface SubmitModalProps {
  total: number;
  answeredCount: number;
  markedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

function SubmitModal({ total, answeredCount, markedCount, onConfirm, onCancel, submitting }: SubmitModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0D1729] border border-white/15 rounded-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
            <Send size={18} className="text-[#E8941A]" />
          </div>
          <h3 className="text-white font-bold text-lg">Submit Exam?</h3>
        </div>
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between text-white/60">
            <span>Total questions</span><span className="text-white font-medium">{total}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Answered</span><span className="text-green-400 font-medium">{answeredCount}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Unanswered</span><span className="text-yellow-400 font-medium">{total - answeredCount}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Marked for review</span><span className="text-purple-400 font-medium">{markedCount}</span>
          </div>
        </div>
        <p className="text-white/50 text-xs mb-6">Once submitted, you cannot change your answers.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-[#E8941A] hover:bg-amber-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ExamTakingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // URL: /exam/:id/start?attempt=:attemptId
  const searchParams = new URLSearchParams(window.location.search);
  const attemptId = searchParams.get("attempt") ?? "";

  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [loading, setLoading] = useState(true);

  // Answer state
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // UI state
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);

  // Debounce save ref
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: examData }, { data: secsData }, { data: qData }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", id).single(),
        supabase.from("exam_sections").select("*").eq("exam_id", id).order("section_order"),
        supabase.from("questions").select("*, options:question_options(*)").eq("exam_id", id).order("question_number"),
      ]);
      if (examData) {
        setExam(examData as Exam);
        setTimeRemaining(examData.duration_seconds);
      }
      setSections((secsData as ExamSection[]) ?? []);
      setQuestions((qData as QuestionWithOptions[]) ?? []);
      if (secsData && secsData.length > 0) setActiveSection(secsData[0].id);

      // Load existing answers for this attempt
      const { data: existingAnswers } = await supabase
        .from("attempt_answers")
        .select("*")
        .eq("attempt_id", attemptId);
      if (existingAnswers) {
        const map = new Map<string, string[]>();
        const marked = new Set<string>();
        const visited = new Set<string>();
        for (const a of existingAnswers) {
          if (a.selected_answer?.length) map.set(a.question_id, a.selected_answer);
          if (a.is_marked_review) marked.add(a.question_id);
          visited.add(a.question_id);
        }
        setAnswers(map);
        setMarkedForReview(marked);
        setVisitedQuestions(visited);
      }

      setLoading(false);
    })();
  }, [id, attemptId]);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || timeRemaining <= 0) return;
    const t = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Fullscreen ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreenWarning(true);
      else setFullscreenWarning(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Auto-save ────────────────────────────────────────────────────────────────
  const scheduleSave = useCallback(
    (qId: string, selected: string[], marked: boolean) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await supabase.from("attempt_answers").upsert(
          {
            attempt_id: attemptId,
            question_id: qId,
            selected_answer: selected,
            is_marked_review: marked,
            saved_at: new Date().toISOString(),
          },
          { onConflict: "attempt_id,question_id" }
        );
      }, 3000);
    },
    [attemptId]
  );

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const currentQ = questions[currentIdx];

  const getStatus = useCallback(
    (qId: string): QStatus => {
      const hasAnswer = (answers.get(qId)?.length ?? 0) > 0;
      const isMarked = markedForReview.has(qId);
      const isVisited = visitedQuestions.has(qId);
      if (hasAnswer && isMarked) return "answered-marked";
      if (hasAnswer) return "answered";
      if (isMarked) return "marked";
      if (isVisited) return "visited";
      return "not-visited";
    },
    [answers, markedForReview, visitedQuestions]
  );

  // ── Question interactions ────────────────────────────────────────────────────
  const selectOption = (optKey: string) => {
    if (!currentQ) return;
    const qId = currentQ.id;
    const existing = answers.get(qId) ?? [];
    let updated: string[];

    if (currentQ.question_type === "single_choice") {
      updated = existing.includes(optKey) ? [] : [optKey];
    } else {
      updated = existing.includes(optKey)
        ? existing.filter((k) => k !== optKey)
        : [...existing, optKey];
    }

    const newAnswers = new Map(answers);
    if (updated.length === 0) newAnswers.delete(qId);
    else newAnswers.set(qId, updated);
    setAnswers(newAnswers);

    const newVisited = new Set(visitedQuestions).add(qId);
    setVisitedQuestions(newVisited);
    scheduleSave(qId, updated, markedForReview.has(qId));
  };

  const clearResponse = () => {
    if (!currentQ) return;
    const newAnswers = new Map(answers);
    newAnswers.delete(currentQ.id);
    setAnswers(newAnswers);
    scheduleSave(currentQ.id, [], markedForReview.has(currentQ.id));
  };

  const toggleMark = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    const newMarked = new Set(markedForReview);
    if (newMarked.has(qId)) newMarked.delete(qId);
    else newMarked.add(qId);
    setMarkedForReview(newMarked);
    scheduleSave(qId, answers.get(qId) ?? [], newMarked.has(qId));
  };

  const goTo = (idx: number) => {
    if (!currentQ) return;
    // Mark current as visited
    const newVisited = new Set(visitedQuestions).add(currentQ.id);
    setVisitedQuestions(newVisited);
    setCurrentIdx(Math.max(0, Math.min(idx, questions.length - 1)));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (auto = false) => {
    if (!auto) setShowSubmit(true);
    else await doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);

    // Flush all answers
    const upserts = [];
    for (const [qId, sel] of answers.entries()) {
      upserts.push({
        attempt_id: attemptId,
        question_id: qId,
        selected_answer: sel,
        is_marked_review: markedForReview.has(qId),
        saved_at: new Date().toISOString(),
      });
    }
    if (upserts.length) {
      await supabase.from("attempt_answers").upsert(upserts, { onConflict: "attempt_id,question_id" });
    }

    // Client-side scoring
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    let score = 0;
    const maxScore = exam ? exam.total_marks : questions.length;

    for (const q of questions) {
      const sel = answers.get(q.id) ?? [];
      if (sel.length === 0) {
        unanswered++;
      } else {
        const correctSet = new Set(q.correct_answer);
        const selSet = new Set(sel);
        const isCorrect =
          correctSet.size === selSet.size && [...correctSet].every((k) => selSet.has(k));
        if (isCorrect) {
          correct++;
          score += q.marks;
        } else {
          incorrect++;
          score -= q.negative_marks;
        }
      }
    }
    score = Math.max(0, score);

    const timeTaken = exam ? exam.duration_seconds - timeRemaining : 0;

    await supabase.from("exam_attempts").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).eq("id", attemptId);

    const { data: result } = await supabase.from("exam_results").insert({
      attempt_id: attemptId,
      total_score: score,
      max_score: maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
      correct_count: correct,
      incorrect_count: incorrect,
      unanswered_count: unanswered,
      accuracy: (correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0,
      time_taken_seconds: timeTaken,
    }).select().single();

    if (document.fullscreenElement) document.exitFullscreen?.();
    navigate(`/exam/${id}/result?attempt=${attemptId}`);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#070D1A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#E8941A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam || !currentQ) {
    return (
      <div className="fixed inset-0 bg-[#070D1A] flex items-center justify-center text-white">
        <p>No questions found for this exam.</p>
      </div>
    );
  }

  const answeredCount = answers.size;
  const markedCount = markedForReview.size;

  // Find current section name
  const currentSection =
    sections.find((s) => s.start_question <= currentQ.question_number && currentQ.question_number <= s.end_question) ??
    null;

  const timerRed = timeRemaining < 300;

  // Palette questions for active section
  const paletteQuestions =
    activeSection
      ? questions.filter((q) => {
          const sec = sections.find((s) => s.id === activeSection);
          return sec ? q.question_number >= sec.start_question && q.question_number <= sec.end_question : true;
        })
      : questions;

  const selectedOpts = answers.get(currentQ.id) ?? [];

  return (
    <div className="fixed inset-0 bg-[#070D1A] flex flex-col overflow-hidden">
      {/* ── TOP BAR ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0D1729] border-b border-white/10 px-4 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-[#E8941A] rounded-md flex items-center justify-center flex-shrink-0">
            <FileText size={13} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight hidden sm:block">testivo</span>
        </div>
        <div className="h-5 w-px bg-white/10 hidden sm:block" />
        <p className="text-white/80 text-sm font-medium truncate flex-1 min-w-0">{exam.title}</p>
        {currentSection && (
          <>
            <div className="h-5 w-px bg-white/10 hidden md:block" />
            <p className="text-white/50 text-xs hidden md:block">{currentSection.name}</p>
          </>
        )}
        <div className="ml-auto flex-shrink-0">
          <div
            className={`px-4 py-1.5 rounded-lg font-mono text-base font-bold transition-colors ${
              timerRed ? "bg-red-600/20 text-red-400 animate-pulse" : "bg-white/10 text-white"
            }`}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN WARNING ────────────────────────────────────────────────── */}
      {fullscreenWarning && (
        <div className="flex-shrink-0 bg-red-700/90 px-4 py-2 flex items-center gap-2 text-white text-sm">
          <AlertTriangle size={15} />
          <span>You have exited fullscreen. Please return to fullscreen mode.</span>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="ml-auto px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Maximize2 size={12} />
            Re-enter Fullscreen
          </button>
        </div>
      )}

      {/* ── MAIN AREA ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Question header */}
          <div className="flex-shrink-0 px-6 py-3 border-b border-white/10 bg-[#0D1729]/50 flex items-center gap-3 text-xs text-white/50">
            <span className="text-amber-400 font-semibold">Q.{currentQ.question_number}</span>
            {currentSection && <span>| {currentSection.name}</span>}
            <span>| +{currentQ.marks} mark</span>
            {currentQ.negative_marks > 0 && <span>| −{currentQ.negative_marks}</span>}
            <span className="ml-auto">{currentIdx + 1} / {questions.length}</span>
          </div>

          {/* Question + options (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Question text */}
            <p className="text-white text-lg leading-relaxed mb-5">{currentQ.question_text}</p>

            {/* Question image */}
            {currentQ.question_image_url && (
              <img
                src={currentQ.question_image_url}
                alt={currentQ.question_image_alt ?? "Question image"}
                className="max-w-full max-h-64 object-contain rounded-xl border border-white/10 mb-6"
              />
            )}

            {/* Options */}
            <div className="space-y-3">
              {(currentQ.options ?? [])
                .slice()
                .sort((a, b) => a.option_order - b.option_order)
                .map((opt) => {
                  const isSelected = selectedOpts.includes(opt.option_key);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectOption(opt.option_key)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#E8941A] bg-[#E8941A]/10"
                          : "border-white/10 hover:border-white/25 bg-white/5"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                          isSelected ? "bg-[#E8941A] text-white" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {opt.option_key}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        {opt.option_text && (
                          <span className={`text-sm leading-relaxed ${isSelected ? "text-white" : "text-white/70"}`}>
                            {opt.option_text}
                          </span>
                        )}
                        {opt.option_image_url && (
                          <img
                            src={opt.option_image_url}
                            alt={`Option ${opt.option_key}`}
                            className="mt-2 max-h-32 object-contain rounded-lg"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="flex-shrink-0 border-t border-white/10 px-6 py-3 flex items-center gap-2 bg-[#0D1729]/50">
            <button
              onClick={clearResponse}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
            >
              <Trash2 size={13} />
              Clear
            </button>
            <button
              onClick={toggleMark}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                markedForReview.has(currentQ.id)
                  ? "bg-purple-600/20 text-purple-400"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Flag size={13} />
              {markedForReview.has(currentQ.id) ? "Marked" : "Mark for Review"}
            </button>

            <div className="flex-1" />

            <button
              onClick={() => goTo(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <button
              onClick={() => {
                if (currentIdx < questions.length - 1) goTo(currentIdx + 1);
              }}
              disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Save &amp; Next
              <ChevronRight size={13} />
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E8941A] hover:bg-amber-400 text-white text-xs font-semibold transition-colors"
            >
              <Send size={13} />
              Submit
            </button>
          </div>
        </div>

        {/* Right: Question palette */}
        <div className="w-64 flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden bg-[#0D1729]/30">
          {/* Section tabs */}
          {sections.length > 1 && (
            <div className="flex-shrink-0 border-b border-white/10 overflow-x-auto">
              <div className="flex min-w-max">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSection === s.id
                        ? "text-[#E8941A] border-b-2 border-[#E8941A]"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-shrink-0 px-4 pt-4 pb-2">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Question Palette</p>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-5 gap-1.5">
              {paletteQuestions.map((q, i) => {
                const globalIdx = questions.findIndex((x) => x.id === q.id);
                const status = getStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(globalIdx)}
                    title={`Q.${q.question_number}`}
                    className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${qStatusColor(status)} ${
                      globalIdx === currentIdx ? "ring-2 ring-white/50 scale-105" : ""
                    }`}
                  >
                    {q.question_number}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 space-y-1.5 text-xs text-white/50">
              {[
                { cls: "bg-white/10", label: "Not visited" },
                { cls: "bg-yellow-500", label: "Visited" },
                { cls: "bg-green-600", label: "Answered" },
                { cls: "bg-purple-600", label: "Marked for review" },
                { cls: "bg-purple-600 ring-2 ring-green-400", label: "Answered + marked" },
              ].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${cls}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBMIT MODAL ──────────────────────────────────────────────────────── */}
      {showSubmit && (
        <SubmitModal
          total={questions.length}
          answeredCount={answeredCount}
          markedCount={markedCount}
          onConfirm={doSubmit}
          onCancel={() => setShowSubmit(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
