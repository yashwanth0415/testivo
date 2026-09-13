import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function AdminSettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setMessage(""); setError("");
    try {
      if (!username.trim()) throw new Error("Username is required.");
      const { error: uerr } = await supabase.from("profiles").update({ username: username.trim(), updated_at: new Date().toISOString() }).eq("auth_user_id", user?.id);
      if (uerr) throw uerr;
      if (password) {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error: perr } = await supabase.auth.updateUser({ password });
        if (perr) throw perr;
      }
      await refreshProfile(); setPassword(""); setMessage("Admin settings updated successfully.");
    } catch(e) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { setSaving(false); }
  }
  const input="w-full rounded-xl border border-white/10 bg-[#070D1A] px-4 py-3 text-white focus:outline-none focus:border-amber-500";
  return <div className="p-8 max-w-2xl space-y-6"><div><h1 className="text-2xl font-bold text-white">Admin Settings</h1><p className="text-white/40 text-sm mt-1">Change the administrator username and password.</p></div><div className="rounded-2xl border border-white/10 bg-[#0D1729] p-6 space-y-5"><div><label className="text-white/50 text-xs">Admin email</label><input className={input+" mt-1 opacity-60"} value={user?.email || ""} readOnly /></div><div><label className="text-white/50 text-xs">Admin username</label><input className={input+" mt-1"} value={username} onChange={e=>setUsername(e.target.value)} /></div><div><label className="text-white/50 text-xs">New password</label><input className={input+" mt-1"} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Leave blank to keep current password" autoComplete="new-password" /></div>{error&&<p className="text-red-400 text-sm">{error}</p>}{message&&<p className="text-green-400 text-sm">{message}</p>}<button onClick={save} disabled={saving} className="px-5 py-3 rounded-xl bg-amber-500 text-white font-semibold disabled:opacity-40">{saving?"Saving…":"Save changes"}</button></div></div>;
}
