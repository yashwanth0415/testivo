import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignInPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.signIn(email.trim(), password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 flex-col justify-between p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-500 rounded-sm flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-white text-xl font-semibold tracking-tight"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            testivo
          </span>
        </Link>

        {/* Quote */}
        <div>
          <blockquote
            className="text-white text-3xl font-light leading-snug mb-6"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            "An examination is not a test of what you know — it is a test of how well you know what you know."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 text-xs font-bold">A</span>
            </div>
            <div>
              <div className="text-white/80 text-sm font-medium">Anupam Mishra</div>
              <div className="text-white/40 text-xs">Educator & Mentor</div>
            </div>
          </div>
        </div>

        {/* Decorative stats */}
        <div className="flex gap-8">
          <div>
            <div className="text-amber-400 text-2xl font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>50k+</div>
            <div className="text-white/40 text-xs mt-0.5">Exams completed</div>
          </div>
          <div>
            <div className="text-amber-400 text-2xl font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>98%</div>
            <div className="text-white/40 text-xs mt-0.5">Extraction accuracy</div>
          </div>
          <div>
            <div className="text-amber-400 text-2xl font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>10k+</div>
            <div className="text-white/40 text-xs mt-0.5">PDFs processed</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F6F3] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-amber-500 rounded-sm flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-navy-900 text-xl font-semibold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              testivo
            </span>
          </Link>

          <h1 className="text-navy-900 text-2xl font-semibold mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue your preparation.</p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-amber-600 hover:text-amber-500 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google SSO */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2.5 text-sm"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {"Don't have an account?"}{" "}
            <Link to="/sign-up" className="text-amber-600 hover:text-amber-500 font-semibold transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
