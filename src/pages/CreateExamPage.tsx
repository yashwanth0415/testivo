import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Upload, FileText, X, CheckCircle, AlertCircle, RefreshCw,
  Clock, BookOpen, Layers, Image as ImageIcon, ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, callEdgeFunction } from "../lib/supabase";
import { AppLayout } from "../components/layout/AppLayout";
import type { ProcessingJob, ExamSection } from "../lib/types";

// ── helpers ────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = ["Upload PDF", "Processing", "Configure Exam"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < current
                  ? "bg-amber-500 text-white"
                  : i === current
                  ? "bg-amber-500 text-white ring-4 ring-amber-500/30"
                  : "bg-navy-900 border border-white/10 text-white/40"
              }`}
            >
              {i < current ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === current ? "text-amber-400" : i < current ? "text-white/70" : "text-white/30"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-16 mx-2 mb-5 transition-colors ${
                i < current ? "bg-amber-500" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Upload ──────────────────────────────────────────────────────────────
interface Step1Props {
  onUploaded: (jobId: string, filePath: string, fileName: string) => void;
}

function Step1Upload({ onUploaded }: Step1Props) {
  const { user, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError("");
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    setFile(f);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !user || !profile) return;
    setUploading(true);
    setError("");

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("exam-pdfs")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: job, error: jobError } = await supabase
        .from("processing_jobs")
        .insert({
          user_id: profile?.id,
          source_file_path: filePath,
          status: "processing",
          progress: 0,
          questions_found: 0,
          answers_found: 0,
          sections_found: 0,
          images_found: 0,
        })
        .select()
        .single();
      if (jobError) throw jobError;

      const { data: sessionData } = await supabase.auth.getSession();
      await callEdgeFunction("/process-pdf", { jobId: job.id, filePath }, sessionData.session?.access_token);

      onUploaded(job.id, filePath, file.name);
    } catch (e: any) {
      setError(e.message ?? "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Drop zone */}
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer
          ${dragging ? "border-amber-500 bg-amber-500/5" : "border-white/20 hover:border-white/40"}
          ${file ? "cursor-default" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onInputChange}
        />

        {file ? (
          <>
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <FileText size={32} className="text-amber-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{file.name}</p>
              <p className="text-white/50 text-sm mt-1">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white/70" />
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center border border-white/10">
              <Upload size={28} className="text-amber-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Drop your PDF here or click to browse</p>
              <p className="text-white/40 text-sm mt-1">Supports PDF files up to 50 MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-6 w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            Upload &amp; Process
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}

// ── Step 2: Processing ──────────────────────────────────────────────────────────
const STATUS_MESSAGES = [
  "Uploading PDF",
  "Preparing document",
  "Reading pages",
  "Analysing questions",
  "Detecting sections",
  "Extracting options",
  "Detecting answer key",
  "Validating questions",
  "Saving exam",
];

interface Step2Props {
  jobId: string;
  fileName: string;
  onCompleted: (job: ProcessingJob) => void;
}

function Step2Processing({ jobId, fileName, onCompleted }: Step2Props) {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    const { data } = await supabase
      .from("processing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (!data) return;
    setJob(data as ProcessingJob);
    if (data.status === "completed") {
      if (pollRef.current) clearInterval(pollRef.current);
      onCompleted(data as ProcessingJob);
    } else if (data.status === "failed") {
      if (pollRef.current) clearInterval(pollRef.current);
      setFailed(true);
    }
  }, [jobId, onCompleted]);

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  // Cycle status messages every ~2.5 s
  useEffect(() => {
    const t = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const progress = job?.progress ?? 0;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress / 100);

  if (failed) {
    return (
      <div className="max-w-sm mx-auto text-center py-10">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <h3 className="text-white text-xl font-semibold mb-2">Processing Failed</h3>
        <p className="text-white/50 text-sm mb-1">{job?.error_message ?? "An unexpected error occurred."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-center py-6">
      {/* Progress ring */}
      <div className="relative w-40 h-40 mx-auto mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke="#E8941A"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{progress}%</span>
        </div>
      </div>

      <p className="text-amber-400 font-medium text-lg mb-1">{STATUS_MESSAGES[statusIdx]}</p>
      <p className="text-white/40 text-sm mb-8">Processing: {fileName}</p>

      <div className="bg-navy-900 rounded-xl border border-white/10 p-5 grid grid-cols-3 gap-4 text-center">
        {[
          { icon: BookOpen, label: "Questions", val: job?.questions_found ?? 0 },
          { icon: CheckCircle, label: "Answers", val: job?.answers_found ?? 0 },
          { icon: Layers, label: "Sections", val: job?.sections_found ?? 0 },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label}>
            <Icon size={18} className="text-amber-500 mx-auto mb-1" />
            <p className="text-white text-xl font-bold">{val}</p>
            <p className="text-white/40 text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Configure ──────────────────────────────────────────────────────────
interface Step3Props {
  job: ProcessingJob;
  fileName: string;
}

function Step3Configure({ job, fileName }: Step3Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState(fileName.replace(/\.pdf$/i, ""));
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [marksPerQ, setMarksPerQ] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [allowNav, setAllowNav] = useState(true);
  const [sections, setSections] = useState<Partial<ExamSection>[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load sections if any were detected
  useEffect(() => {
    if (job.sections_found > 0 && job.exam_id) {
      supabase
        .from("exam_sections")
        .select("*")
        .eq("exam_id", job.exam_id)
        .order("section_order")
        .then(({ data }) => {
          if (data) setSections(data);
        });
    }
  }, [job]);

  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      let examId = job.exam_id;
      if (!examId) {
        const { data: exam, error: examErr } = await supabase
          .from("exams")
          .insert({
            owner_id: profile?.id,
            title,
            description,
            source_file_path: job.source_file_path,
            total_questions: job.questions_found,
            total_marks: job.questions_found * marksPerQ,
            duration_seconds: duration * 60,
            negative_marking: negativeMarks,
            allow_navigation: allowNav,
            status: "ready",
          })
          .select()
          .single();
        if (examErr) throw examErr;
        examId = exam.id;
        await supabase.from("processing_jobs").update({ exam_id: exam.id }).eq("id", job.id);
      } else {
        const { error: examErr } = await supabase.from("exams").update({
          owner_id: profile?.id,
          title,
          description,
          source_file_path: job.source_file_path,
          total_questions: job.questions_found,
          total_marks: job.questions_found * marksPerQ,
          duration_seconds: duration * 60,
          negative_marking: negativeMarks,
          allow_navigation: allowNav,
          status: "ready",
          updated_at: new Date().toISOString(),
        }).eq("id", examId).eq("owner_id", profile?.id);
        if (examErr) throw examErr;
        if (sections.length) {
          for (const section of sections) {
            await supabase.from("exam_sections").update({ duration_seconds: section.duration_seconds || null }).eq("id", section.id).eq("exam_id", examId);
          }
        }
      }
      navigate(`/exams/${examId}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to create exam.");
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500 transition-colors text-sm";

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
      {/* Form */}
      <div className="col-span-2 space-y-5">
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">Exam Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Exam title" />
        </div>
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls + " resize-none"}
            placeholder="Optional exam description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputCls + " cursor-pointer"}
            >
              {[30, 45, 60, 90, 120, 150, 180].map((m) => (
                <option key={m} value={m} className="bg-navy-900">
                  {m} minutes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">Marks per question</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={marksPerQ}
              onChange={(e) => setMarksPerQ(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5 block">Negative marking</label>
            <input
              type="number"
              min={0}
              step={0.25}
              value={negativeMarks}
              onChange={(e) => setNegativeMarks(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setAllowNav((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${allowNav ? "bg-amber-500" : "bg-white/10"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allowNav ? "left-6" : "left-1"}`}
                />
              </div>
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">Allow navigation</span>
            </label>
            <p className="text-white/30 text-xs mt-1 ml-14">Users can jump between questions</p>
          </div>
        </div>

        {/* Sections table */}
        {sections.length > 0 && (
          <div>
            <label className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3 block">
              Detected Sections
            </label>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white/40 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Section</th>
                    <th className="px-4 py-3 text-center">Questions</th>
                    <th className="px-4 py-3 text-center">Time (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sections.map((s, i) => (
                    <tr key={i} className="text-white/70">
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-center">
                        {s.start_question}–{s.end_question}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={s.duration_seconds ? s.duration_seconds / 60 : ""}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((sec, j) =>
                                j === i ? { ...sec, duration_seconds: Number(e.target.value) * 60 } : sec
                              )
                            )
                          }
                          placeholder="—"
                          className="w-20 bg-navy-950 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!title || saving}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <><RefreshCw size={16} className="animate-spin" /> Creating…</> : "Create Exam"}
        </button>
      </div>

      {/* Summary card */}
      <div className="col-span-1">
        <div className="bg-navy-900 rounded-2xl border border-white/10 p-6 sticky top-0">
          <h3 className="text-white font-semibold text-sm mb-5 uppercase tracking-wider">Detected Stats</h3>
          <div className="space-y-4">
            {[
              { icon: BookOpen, label: "Questions", val: job.questions_found },
              { icon: CheckCircle, label: "Answers found", val: job.answers_found },
              { icon: Layers, label: "Sections", val: job.sections_found },
              { icon: ImageIcon, label: "Images", val: job.images_found },
              { icon: Clock, label: "Duration", val: `${duration} min` },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-white/50">
                  <Icon size={15} className="text-amber-500/70" />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="text-white font-semibold text-sm">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-white/40 text-xs">
              Total marks: <span className="text-amber-400 font-semibold">{job.questions_found * marksPerQ}</span>
            </p>
            <p className="text-white/40 text-xs mt-1">
              Negative marking: <span className="text-amber-400 font-semibold">−{negativeMarks}</span> per wrong answer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CreateExamPage() {
  const [step, setStep] = useState(0);
  const [jobId, setJobId] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [completedJob, setCompletedJob] = useState<ProcessingJob | null>(null);

  const handleUploaded = (jId: string, fp: string, fn: string) => {
    setJobId(jId);
    setFilePath(fp);
    setFileName(fn);
    setStep(1);
  };

  const handleCompleted = (job: ProcessingJob) => {
    setCompletedJob(job);
    setStep(2);
  };

  return (
    <AppLayout>
      <div className="min-h-full p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Create Exam</h1>
            <p className="text-white/50 text-sm">Upload a PDF and we will extract questions automatically.</p>
          </div>

          <div className="bg-[#0D1729]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <StepIndicator current={step} />

            {step === 0 && <Step1Upload onUploaded={handleUploaded} />}
            {step === 1 && (
              <Step2Processing jobId={jobId} fileName={fileName} onCompleted={handleCompleted} />
            )}
            {step === 2 && completedJob && (
              <Step3Configure job={completedJob} fileName={fileName} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
