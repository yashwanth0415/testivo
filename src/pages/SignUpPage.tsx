import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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

interface FieldErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateUsername(value: string): string {
  if (value.length < 3) return "Username must be at least 3 characters.";
  if (/\s/.test(value)) return "Username cannot contain spaces.";
  if (!/^[a-z0-9_.-]+$/.test(value)) return "Only lowercase letters, numbers, _, . and - allowed.";
  return "";
}

function validatePassword(value: string): string {
  if (value.length < 8) return "Password must be at least 8 characters.";
  return "";
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailConfirmNeeded, setEmailConfirmNeeded] = useState(false);

  function validateAll(): boolean {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    const usernameErr = validateUsername(username);
    if (usernameErr) errors.username = usernameErr;
    if (!email.trim()) errors.email = "Email is required.";
    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!validateAll()) return;

    setLoading(true);
    try {
      await auth.signUp(email.trim(), password, fullName.trim(), username.trim());
      // If signUp resolves without error but there's no user session yet, email confirmation is needed
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/dashboard");
      } else {
        setEmailConfirmNeeded(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create account.";
      if (msg.toLowerCase().includes("username")) {
        setFieldErrors((prev) => ({ ...prev, username: msg }));
      } else if (msg.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      } else {
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setSubmitError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  if (emailConfirmNeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3] px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-navy-900 text-2xl font-semibold mb-3" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Check your email
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            We sent a confirmation link to <strong className="text-gray-700">{email}</strong>. Click the link to activate your account and get started.
          </p>
          <Link
            to="/sign-in"
            className="text-amber-600 hover:text-amber-500 font-semibold text-sm transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 flex-col justify-between p-12">
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

        <div>
          <blockquote
            className="text-white text-3xl font-light leading-snug mb-6"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            "Practice is the hardest part of learning, and training is the essence of transformation."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 text-xs font-bold">A</span>
            </div>
            <div>
              <div className="text-white/80 text-sm font-medium">Ann Voskamp</div>
              <div className="text-white/40 text-xs">Author & Educator</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="text-white/70 text-sm leading-relaxed">
            Join thousands of students who use Testivo to simulate real competitive exams and track their progress.
          </p>
          <div className="flex gap-6 mt-4">
            <div>
              <div className="text-amber-400 text-lg font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>JEE</div>
              <div className="text-white/40 text-xs">Main & Advanced</div>
            </div>
            <div>
              <div className="text-amber-400 text-lg font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>NEET</div>
              <div className="text-white/40 text-xs">UG & PG</div>
            </div>
            <div>
              <div className="text-amber-400 text-lg font-bold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>CAT</div>
              <div className="text-white/40 text-xs">& MBA Exams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F6F3] px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-amber-500 rounded-sm flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-navy-900 text-xl font-semibold" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              testivo
            </span>
          </Link>

          <h1 className="text-navy-900 text-2xl font-semibold mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mb-8">Start your exam preparation journey today.</p>

          {/* Global error */}
          {submitError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                }}
                required
                autoComplete="name"
                placeholder="Rahul Sharma"
                className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                  fieldErrors.fullName
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                    : "border-gray-200 focus:ring-amber-500/30 focus:border-amber-500"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/\s/g, "");
                    setUsername(val);
                    if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                  }}
                  required
                  autoComplete="username"
                  placeholder="rahul_sharma"
                  className={`w-full bg-white border rounded-lg pl-8 pr-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                    fieldErrors.username
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                      : "border-gray-200 focus:ring-amber-500/30 focus:border-amber-500"
                  }`}
                />
              </div>
              {fieldErrors.username && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
              )}
              {!fieldErrors.username && username.length >= 3 && (
                <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Username looks good
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                required
                autoComplete="email"
                placeholder="rahul@example.com"
                className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                  fieldErrors.email
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                    : "border-gray-200 focus:ring-amber-500/30 focus:border-amber-500"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`w-full bg-white border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                    fieldErrors.password
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                      : "border-gray-200 focus:ring-amber-500/30 focus:border-amber-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={`w-full bg-white border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                    fieldErrors.confirmPassword
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                      : "border-gray-200 focus:ring-amber-500/30 focus:border-amber-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
              {!fieldErrors.confirmPassword && confirmPassword && password === confirmPassword && (
                <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating Account…" : "Create Account"}
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

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-amber-600 hover:text-amber-500 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
