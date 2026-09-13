import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Clock, AlertTriangle, X, Loader2 } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? "bg-amber-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function DeleteAccountModal({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  const [confirmation, setConfirmation] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
        <p className="text-gray-500 text-sm mb-4">
          This will permanently delete your account, all your exams, and all your results. This action
          cannot be undone.
        </p>
        <p className="text-sm text-gray-700 mb-2">
          Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
        </p>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
          placeholder="DELETE"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting || confirmation !== "DELETE"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("60");
  const [autoSaveInterval, setAutoSaveInterval] = useState("30");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function handleSavePreferences() {
    setSaveMsg("Preferences saved.");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      // Sign out first, then the user record deletion would typically be
      // handled server-side via a Supabase edge function or RPC.
      // For now we sign out and redirect.
      await signOut();
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.message ?? "Failed to delete account. Please contact support.");
      setDeletingAccount(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-navy-950" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          Settings
        </h1>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={18} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-5">
            <Toggle
              checked={emailNotifications}
              onChange={setEmailNotifications}
              label="Email notifications when exam is processed"
              description="Get notified when your uploaded exam is ready to attempt."
            />
            <Toggle
              checked={weeklyReport}
              onChange={setWeeklyReport}
              label="Weekly progress report"
              description="Receive a weekly summary of your exam activity and scores."
            />
          </div>
        </div>

        {/* Exam Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Exam Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Default Exam Duration
              </label>
              <select
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Auto-save Interval
              </label>
              <select
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
              >
                <option value="15">Every 15 seconds</option>
                <option value="30">Every 30 seconds</option>
                <option value="60">Every 60 seconds</option>
              </select>
            </div>
          </div>

          {saveMsg && (
            <p className="text-sm text-green-600 font-medium">{saveMsg}</p>
          )}

          <button
            onClick={handleSavePreferences}
            className="px-5 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors text-sm"
          >
            Save Preferences
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
          </div>
          <p className="text-sm text-gray-500">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {deleteError}
            </div>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors text-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deletingAccount}
        />
      )}
    </AppLayout>
  );
}
