import { useState, useRef, ChangeEvent } from "react";
import { Camera, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type MessageState = { type: "success" | "error"; text: string } | null;

function InlineMessage({ msg }: { msg: MessageState }) {
  if (!msg) return null;
  const isSuccess = msg.type === "success";
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
        isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      {isSuccess ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg.text}
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [profileMsg, setProfileMsg] = useState<MessageState>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<MessageState>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function validateUsername(val: string): string | null {
    if (val.length < 3) return "Username must be at least 3 characters.";
    if (val.length > 20) return "Username must be 20 characters or fewer.";
    if (/\s/.test(val)) return "Username cannot contain spaces.";
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return "Username can only contain letters, numbers, and underscores.";
    return null;
  }

  async function handleSaveProfile() {
    const usernameError = validateUsername(username);
    if (usernameError) {
      setProfileMsg({ type: "error", text: usernameError });
      return;
    }
    if (!fullName.trim()) {
      setProfileMsg({ type: "error", text: "Full name cannot be empty." });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), username: username.trim(), updated_at: new Date().toISOString() })
        .eq("auth_user_id", user!.id);
      if (error) throw error;
      await refreshProfile();
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message ?? "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message ?? "Failed to update password." });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setProfileMsg(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq("auth_user_id", user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setProfileMsg({ type: "success", text: "Avatar updated." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message ?? "Failed to upload avatar." });
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-navy-950" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
          Profile Settings
        </h1>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold text-xl">
                  {initials}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 size={18} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Camera size={15} />
                {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  placeholder="username"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">3–20 characters, letters, numbers, underscores only.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Contact support to change your email address.</p>
            </div>
          </div>

          <InlineMessage msg={profileMsg} />

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm"
          >
            {savingProfile && <Loader2 size={15} className="animate-spin" />}
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <InlineMessage msg={passwordMsg} />

          <button
            onClick={handleUpdatePassword}
            disabled={savingPassword}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-950 text-white font-semibold rounded-xl hover:bg-navy-800 transition-colors disabled:opacity-50 text-sm"
          >
            {savingPassword && <Loader2 size={15} className="animate-spin" />}
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
