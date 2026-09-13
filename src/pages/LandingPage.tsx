import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Upload,
  Brain,
  Monitor,
  Layers,
  Zap,
  MinusCircle,
  Grid3X3,
  Image,
  BarChart2,
  ChevronRight,
  FileText,
} from "lucide-react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0D1729]/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-500 rounded-sm flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-white text-xl font-semibold tracking-tight"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            testivo
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            How it Works
          </a>
          <a href="#pricing" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            Pricing
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/sign-in")}
            className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/sign-up")}
            className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

function ExamPreview() {
  const questions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const paletteStatus: Record<number, "answered" | "marked" | "not-visited" | "current"> = {
    1: "answered",
    2: "answered",
    3: "answered",
    4: "current",
    5: "not-visited",
    6: "not-visited",
    7: "marked",
    8: "not-visited",
    9: "not-visited",
    10: "not-visited",
  };

  const paletteColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-emerald-500 text-white";
      case "marked": return "bg-purple-500 text-white";
      case "current": return "bg-amber-500 text-white ring-2 ring-amber-300";
      default: return "bg-gray-200 text-gray-500";
    }
  };

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 shadow-2xl overflow-hidden text-xs select-none">
      {/* Exam Header */}
      <div className="bg-navy-900 text-white px-4 py-2.5 flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">JEE Main 2024 — Paper 1</div>
          <div className="text-white/60 text-xs">Mathematics · Section A</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-amber-400 text-base">01:23:45</div>
          <div className="text-white/50 text-xs">Time Remaining</div>
        </div>
      </div>

      <div className="flex">
        {/* Question Area */}
        <div className="flex-1 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-navy-900 text-white text-xs font-semibold px-2 py-0.5 rounded">Q4</span>
            <span className="text-gray-400 text-xs">Marks: +4 / −1</span>
          </div>
          <p className="text-gray-800 text-xs leading-relaxed mb-4">
            Let <span className="font-mono bg-gray-100 px-1 rounded">f(x) = x² − 5x + 6</span>. If the roots of the equation{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">f(x) = 0</span> are α and β, then the value of{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">α² + β²</span> is:
          </p>

          {/* Options */}
          <div className="space-y-2">
            {[
              { label: "A", text: "13", selected: false },
              { label: "B", text: "25", selected: false },
              { label: "C", text: "10", selected: false },
              { label: "D", text: "16", selected: true },
            ].map((opt) => (
              <div
                key={opt.label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md border text-xs cursor-pointer ${
                  opt.selected
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                    opt.selected ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="font-mono">{opt.text}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-navy-900 text-white text-xs py-1.5 rounded font-medium">Save & Next</button>
            <button className="px-3 bg-purple-100 text-purple-700 text-xs py-1.5 rounded font-medium">Mark & Next</button>
            <button className="px-3 bg-gray-100 text-gray-600 text-xs py-1.5 rounded font-medium">Clear</button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-28 bg-gray-50 border-l border-gray-200 p-2.5 flex flex-col gap-3">
          {/* Legend */}
          <div className="space-y-1">
            {[
              { color: "bg-emerald-500", label: "Answered" },
              { color: "bg-purple-500", label: "Marked" },
              { color: "bg-gray-200", label: "Not Visited" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                <span className="text-gray-500" style={{ fontSize: "9px" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Palette */}
          <div>
            <div className="text-gray-500 mb-1.5" style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Question Palette
            </div>
            <div className="grid grid-cols-4 gap-1">
              {questions.map((q) => (
                <div
                  key={q}
                  className={`w-full aspect-square rounded flex items-center justify-center font-semibold ${paletteColor(paletteStatus[q])}`}
                  style={{ fontSize: "9px" }}
                >
                  {q}
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-gray-500 mb-1" style={{ fontSize: "9px" }}>
              <span>Progress</span>
              <span>3/10</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "30%" }} />
            </div>
          </div>

          <button className="w-full bg-red-500 text-white text-xs py-1.5 rounded font-medium mt-auto">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your PDF",
    description: "Drop your question paper — past papers, mock tests, or any PDF with questions and options.",
  },
  {
    icon: Brain,
    step: "02",
    title: "AI Extraction",
    description: "Our model reads every question, option, image, and answer key — even from scanned documents.",
  },
  {
    icon: Monitor,
    step: "03",
    title: "Take the Exam",
    description: "Experience a professional CBT interface identical to real competitive exams. Get instant results.",
  },
];

const features = [
  {
    icon: Layers,
    title: "Multi-section Support",
    description: "Separate sections with individual timers, marks, and negative marking rules.",
  },
  {
    icon: Zap,
    title: "Smart Extraction",
    description: "Questions, options, images, and answer keys extracted automatically with high accuracy.",
  },
  {
    icon: MinusCircle,
    title: "Negative Marking",
    description: "Configurable per question or per section — just like the actual exam.",
  },
  {
    icon: Grid3X3,
    title: "Question Palette",
    description: "Real CBT navigation with answered, marked, and not-visited status indicators.",
  },
  {
    icon: Image,
    title: "Image Questions",
    description: "Diagrams, graphs, and figures preserved faithfully alongside question text.",
  },
  {
    icon: BarChart2,
    title: "Instant Results",
    description: "Detailed score analytics, section-wise breakdown, and accuracy stats the moment you submit.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <Navbar />

      {/* Hero */}
      <section className="bg-navy-900 pt-24 pb-20 px-6 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              AI-Powered Exam Platform
            </div>
            <h1
              className="text-white text-4xl md:text-5xl lg:text-[56px] font-semibold leading-tight mb-6"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Turn Any Question Paper Into Your Next Exam.
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
              Upload a PDF, configure your exam, and experience it like a real computer-based test. No setup. No friction.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/sign-up")}
                className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-md transition-colors flex items-center gap-2"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="border border-white/25 hover:border-white/50 text-white font-semibold px-6 py-3 rounded-md transition-colors"
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-white text-xl font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>50k+</div>
                <div className="text-white/40 text-xs">Exams Taken</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-white text-xl font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>10k+</div>
                <div className="text-white/40 text-xs">PDFs Processed</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-white text-xl font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>98%</div>
                <div className="text-white/40 text-xs">Extraction Accuracy</div>
              </div>
            </div>
          </div>

          {/* Right — exam preview */}
          <div className="hidden md:block">
            <ExamPreview />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#F7F6F3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
            <h2
              className="text-navy-900 text-3xl md:text-4xl font-semibold"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              How Testivo Works
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">
              From PDF to full exam in under a minute.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] right-[-50%] h-px border-t-2 border-dashed border-gray-200" />
                )}
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-md transition-shadow">
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 bg-navy-900 rounded-xl flex items-center justify-center">
                      <step.icon className="w-7 h-7 text-amber-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-navy-900 font-semibold text-lg mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2
              className="text-navy-900 text-3xl md:text-4xl font-semibold"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Built for Serious Learners
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">
              Every detail of a real examination, faithfully replicated.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="bg-[#F7F6F3] rounded-xl p-6 border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                  <feat.icon className="w-5 h-5 text-amber-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-navy-900 font-semibold text-base mb-2">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-navy-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-white text-3xl md:text-4xl font-semibold mb-4"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            Ready to test yourself?
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Upload your first PDF and take an exam in under 60 seconds.
          </p>
          <button
            onClick={() => navigate("/sign-up")}
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-3.5 rounded-md transition-colors text-base"
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded-sm flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              testivo
            </span>
          </div>
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} Testivo. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">Privacy</a>
            <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">Terms</a>
            <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">Contact</a>
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/70 transition-all hover:border-amber-400/50 hover:bg-amber-500 hover:text-white"
            >
              Admin Portal
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
