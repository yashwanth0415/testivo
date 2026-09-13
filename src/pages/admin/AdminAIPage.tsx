import { useEffect, useState } from "react";
import { CheckCircle, Eye, EyeOff, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { supabase, callEdgeFunction } from "../../lib/supabase";

type ProviderType = "nvidia" | "openrouter" | "openai_compatible" | "custom";
interface AIModel { model_id: string; display_name: string; }
interface ActiveConfig { id: string; last_tested_at?: string; provider: { name: string; provider_type: string }; model: { display_name: string; model_id: string }; }
const defaults: Record<ProviderType, string> = {
  nvidia: "https://integrate.api.nvidia.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  openai_compatible: "",
  custom: "",
};
const labels: Record<ProviderType, string> = { nvidia: "NVIDIA", openrouter: "OpenRouter", openai_compatible: "OpenAI Compatible", custom: "Custom" };

export default function AdminAIPage() {
  const [active, setActive] = useState<ActiveConfig | null>(null);
  const [providerType, setProviderType] = useState<ProviderType>("nvidia");
  const [providerName, setProviderName] = useState("NVIDIA");
  const [baseUrl, setBaseUrl] = useState(defaults.nvidia);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }
  async function loadActive() {
    try {
      const res = await callEdgeFunction("/admin-ai-config", {}, await token());
      setActive(res.config || null);
    } catch { setActive(null); }
  }
  useEffect(() => { loadActive(); }, []);

  function changeProvider(pt: ProviderType) {
    setProviderType(pt); setProviderName(labels[pt]); setBaseUrl(defaults[pt]); setModels([]); setSelectedModel(""); setMessage(null);
  }
  async function testConnection() {
    setBusy(true); setMessage(null);
    try { const res = await callEdgeFunction("/test-ai-provider", { providerType, baseUrl, apiKey }, await token()); setMessage({ ok: !!res.success, text: res.message || (res.success ? "Connection successful" : "Connection failed") }); }
    catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Connection failed" }); }
    finally { setBusy(false); }
  }
  async function fetchModels() {
    setBusy(true); setMessage(null); setModels([]); setSelectedModel("");
    try { const res = await callEdgeFunction("/list-ai-models", { providerType, baseUrl, apiKey }, await token()); setModels(res.models || []); setMessage({ ok: true, text: `${(res.models || []).length} models found.` }); }
    catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not fetch models" }); }
    finally { setBusy(false); }
  }
  async function activate() {
    if (!selectedModel) return;
    setBusy(true); setMessage(null);
    try {
      const res = await callEdgeFunction("/save-ai-config", { providerType, providerName, baseUrl, apiKey, modelId: selectedModel }, await token());
      if (!res.success) throw new Error(res.error || "Could not activate model");
      setMessage({ ok: true, text: "AI provider and model activated successfully." });
      setApiKey("");
      await loadActive();
    } catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Save failed" }); }
    finally { setBusy(false); }
  }
  async function deactivate() {
    setBusy(true);
    try { await callEdgeFunction("/deactivate-ai", {}, await token()); setActive(null); setMessage({ ok: true, text: "AI configuration deactivated." }); }
    catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Failed" }); }
    finally { setBusy(false); }
  }
  const input = "w-full bg-[#070D1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500 text-sm";
  return <div className="p-8 space-y-6">
    <div><h1 className="text-2xl font-bold text-white">AI Configuration</h1><p className="text-white/45 text-sm mt-1">Securely connect a provider, discover its models, test one, and activate it for new PDF processing jobs.</p></div>
    {message && <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${message.ok ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>{message.ok ? <CheckCircle size={16}/> : <XCircle size={16}/>} {message.text}</div>}
    <div className="rounded-2xl border border-white/10 p-6 bg-[#0D1729]">
      <div className="flex items-center justify-between"><div><h2 className="text-white font-semibold">Active configuration</h2><p className="text-white/40 text-xs mt-1">API secrets are never returned to the browser.</p></div><ShieldCheck className="text-green-400" size={22}/></div>
      {active ? <div className="mt-5 grid sm:grid-cols-3 gap-4"><div><p className="text-white/40 text-xs">Provider</p><p className="text-white font-medium mt-1">{active.provider.name}</p></div><div><p className="text-white/40 text-xs">Model</p><p className="text-white font-medium mt-1">{active.model.display_name}</p><p className="text-white/35 text-xs mt-1">{active.model.model_id}</p></div><div><p className="text-white/40 text-xs">Status</p><p className="text-green-400 font-semibold mt-1">Active</p></div><button onClick={deactivate} disabled={busy} className="sm:col-span-3 w-fit px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10">Deactivate</button></div> : <p className="mt-5 text-white/35 text-sm">No active configuration.</p>}
    </div>
    <div className="rounded-2xl border border-white/10 p-6 bg-[#0D1729] space-y-5">
      <h2 className="text-white font-semibold">Connect provider</h2>
      <div className="flex flex-wrap gap-2">{(Object.keys(labels) as ProviderType[]).map(pt => <button key={pt} onClick={() => changeProvider(pt)} className={`px-3 py-2 rounded-lg text-sm border ${providerType===pt ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-white/10 text-white/60"}`}>{labels[pt]}</button>)}</div>
      <div className="grid md:grid-cols-2 gap-4"><div><label className="text-white/50 text-xs">Provider name</label><input className={input+" mt-1"} value={providerName} onChange={e=>setProviderName(e.target.value)}/></div><div><label className="text-white/50 text-xs">Base API URL</label><input className={input+" mt-1"} value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://provider.example/v1"/></div></div>
      <div><label className="text-white/50 text-xs">API key</label><div className="relative mt-1"><input className={input+" pr-12"} type={showKey?"text":"password"} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Enter API key securely" autoComplete="off"/><button type="button" onClick={()=>setShowKey(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">{showKey?<EyeOff size={16}/>:<Eye size={16}/>}</button></div><p className="text-white/30 text-xs mt-1">The key is sent only to the protected Supabase Edge Function and encrypted before storage.</p></div>
      <div className="flex flex-wrap gap-3"><button onClick={testConnection} disabled={busy || !apiKey || !baseUrl} className="px-4 py-2.5 rounded-lg border border-white/10 text-white text-sm disabled:opacity-40">{busy?<Loader2 size={15} className="inline animate-spin mr-2"/>:null}Test connection</button><button onClick={fetchModels} disabled={busy || !apiKey || !baseUrl} className="px-4 py-2.5 rounded-lg bg-white text-[#070D1A] text-sm font-semibold disabled:opacity-40">{busy?<RefreshCw size={15} className="inline animate-spin mr-2"/>:null}Fetch models</button></div>
      {models.length>0 && <div><div className="flex items-center justify-between mb-2"><h3 className="text-white/70 text-sm font-semibold">Available models</h3><span className="text-white/35 text-xs">{models.length} found</span></div><div className="max-h-80 overflow-auto rounded-xl border border-white/10 divide-y divide-white/5">{models.map(m=><button key={m.model_id} onClick={()=>setSelectedModel(m.model_id)} className={`w-full text-left px-4 py-3 ${selectedModel===m.model_id?"bg-amber-500/10":"hover:bg-white/[0.03]"}`}><p className="text-white text-sm">{m.display_name}</p><p className="text-white/35 text-xs mt-1">{m.model_id}</p></button>)}</div></div>}
      <button onClick={activate} disabled={busy || !selectedModel || !apiKey} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold disabled:opacity-40">{busy?<><Loader2 size={16} className="inline animate-spin mr-2"/>Testing & activating…</>:"Test selected model & Save / Activate"}</button>
    </div>
  </div>;
}
