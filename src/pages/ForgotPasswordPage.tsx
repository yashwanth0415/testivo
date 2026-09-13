import { useState } from "react";
import { Link } from "react-router";
import { FileText, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3] px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-amber-500 rounded-sm flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-navy-900 text-xl font-semibold"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            testivo
          </span>
        </Link>

        {sent ? (
          /* Success State */
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2
              className="text-navy-900 text-2xl font-semibold mb-3"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Check your inbox
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              We sent a password reset link to
            </p>
            <p className="text-navy-900 font-semibold text-sm mb-6">{email}</p>
            <p className="text-gray-400 text-xs mb-8 leading-relaxed">
              If you don't see it within a few minutes, check your spam folder or verify the email address you entered.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-amber-600 hover:text-amber-500 font-medium text-sm transition-colors"
            >
              Try a different email address
            </button>
          </div>
        ) : (
          /* Form State */
          <>
            <Link
              to="/sign-in"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium mb-8 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>

            <h1
              className="text-navy-900 text-2xl font-semibold mb-2"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Reset your password
            </h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Enter the email address linked to your account and we'll send you a secure reset link.
            </p>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{" "}
              <Link to="/sign-in" className="text-amber-600 hover:text-amber-500 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
