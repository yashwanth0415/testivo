import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, ChevronRight } from "lucide-react";
import { supabase, callEdgeFunction } from "../../lib/supabase";

type ProviderType = "nvidia" | "openrouter" | "openai_compatible" | "custom";

interface AIModel {
  id?: string;
  model_id: string;
  name: string;
  status?: string;
}

interface ActiveConfig {
  id: string;
  is_active: boolean;
  last_tested_at?: string;
  ai_providers?: { id?: string; name: string; provider_type?: string };
  ai_models?: { id?: string; name: string; model_id: string };
}

const PROVIDER_URLS: Record<ProviderType, string> = {
  nvidia: "https://integrate.api.nvidia.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  openai_compatible: "",
  custom: "",
};

const PROVIDER_LABELS: Record<ProviderType, string> = {
  nvidia: "NVIDIA",
  openrouter: "OpenRouter",
  openai_compatible: "OpenAI Compatible",
  custom: "Custom",
};

function maskApiKey(key: string) {
  if (!key || key.length < 8) return "••••••••";
  return "sk-" + "•".repeat(12) + key.slice(-4);
}

export default function AdminAIPage() {
  const [activeConfig, setActiveConfig] = useState<ActiveConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Form state
  const [providerType, setProviderType] = useState<ProviderType>("nvidia");
  const [providerName, setProviderName] = useState("");
  const [baseUrl, setBaseUrl] = useState(PROVIDER_URLS.nvidia);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyEntered, setKeyEntered] = useState(false);

  // Test / fetch state
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [modelTestStatus, setModelTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [modelTestMsg, setModelTestMsg] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadActiveConfig();
  }, []);

  async function loadActiveConfig() {
    setConfigLoading(true);
    const { data } = await supabase
      .from("ai_configurations")
      .select("id, is_active, last_tested_at, ai_providers(id, name, provider_type), ai_models(id, name, model_id)")
      .eq("is_active", true)
      .maybeSingle();
    setActiveConfig(data as ActiveConfig | null);
    setConfigLoading(false);
  }

  function handleProviderTypeChange(pt: ProviderType) {
    setProviderType(pt);
    setBaseUrl(PROVIDER_URLS[pt]);
    setProviderName(PROVIDER_LABELS[pt]);
    setModels([]);
    setSelectedModel(null);
    setTestStatus("idle");
  }

  async function handleTestConnection() {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await callEdgeFunction("/test-ai-provider", { providerType, baseUrl, apiKey }, token);
      setTestStatus("success");
      setTestMsg(res?.message || "Connection successful");
    } catch (err: unknown) {
      setTestStatus("error");
      setTestMsg(err instanceof Error ? err.message : "Connection failed");
    }
  }

  async function handleFetchModels() {
    setFetchLoading(true);
    setModels([]);
    setSelectedModel(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await callEdgeFunction("/list-ai-models", { providerType, baseUrl, apiKey }, token);
      const modelList: AIModel[] = (res?.models || res?.data || []).map((m: { id?: string; model_id?: string; name?: string }) => ({
        model_id: m.id || m.model_id || "",
        name: m.name || m.id || m.model_id || "",
        status: "available",
      }));
      setModels(modelList);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Failed to fetch models");
    } finally {
      setFetchLoading(false);
    }
  }

  async function handleTestModel() {
    if (!selectedModel) return;
    setModelTestStatus("loading");
    setModelTestMsg("");
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await callEdgeFunction(
        "/test-ai-model",
        { providerType, baseUrl, apiKey, modelId: selectedModel.model_id },
        token
      );
      setModelTestStatus("success");
      setModelTestMsg(res?.message || "Model test passed");
    } catch (err: unknown) {
      setModelTestStatus("error");
      setModelTestMsg(err instanceof Error ? err.message : "Model test failed");
    }
  }

  async function handleSaveActivate() {
    if (!selectedModel) return;
    setSaveLoading(true);
    try {
      // Upsert provider
      const { data: provider, error: pErr } = await supabase
        .from("ai_providers")
        .upsert({ name: providerName || PROVIDER_LABELS[providerType], provider_type: providerType, base_url: baseUrl, api_key: apiKey }, { onConflict: "provider_type" })
        .select()
        .single();
      if (pErr) throw pErr;

      // Upsert model
      const { data: model, error: mErr } = await supabase
        .from("ai_models")
        .upsert({ provider_id: provider.id, model_id: selectedModel.model_id, name: selectedModel.name, status: "active" }, { onConflict: "model_id" })
        .select()
        .single();
      if (mErr) throw mErr;

      // Deactivate all
      await supabase.from("ai_configurations").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert new active config
      const { error: cErr } = await supabase.from("ai_configurations").insert({
        provider_id: provider.id,
        model_id: model.id,
        is_active: true,
      });
      if (cErr) throw cErr;

      setToast("AI configuration saved and activated!");
      await loadActiveConfig();
      setTimeout(() => setToast(""), 4000);
    } catch (err: unknown) {
      setToast("Error: " + (err instanceof Error ? err.message : "Save failed"));
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!activeConfig) return;
    await supabase.from("ai_configurations").update({ is_active: false }).eq("id", activeConfig.id);
    setActiveConfig(null);
    setToast("Configuration deactivated.");
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="p-8 space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-navy-900 border border-white/20 rounded-xl px-4 py-3 text-sm text-white shadow-2xl" style={{ backgroundColor: "#0D1729" }}>
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold text-white">AI Configuration</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Active Config Card */}
          <div className="rounded-xl border border-white/10 p-6 space-y-4" style={{ backgroundColor: "#0D1729" }}>
            <h2 className="text-sm font-semibold text-white/70">Active Configuration</h2>
            {configLoading ? (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : activeConfig ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-white/40 text-xs mb-0.5">Provider</div>
                    <div className="text-white font-medium">{activeConfig.ai_providers?.name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-0.5">Model</div>
                    <div className="text-white font-medium">{activeConfig.ai_models?.name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-0.5">Status</div>
                    <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                  {activeConfig.last_tested_at && (
                    <div>
                      <div className="text-white/40 text-xs mb-0.5">Last Tested</div>
                      <div className="text-white/70 text-xs">{new Date(activeConfig.last_tested_at).toLocaleString()}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleDeactivate}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/30">No active configuration.</p>
            )}
          </div>

          {/* Configure New Provider */}
          <div className="rounded-xl border border-white/10 p-6 space-y-5" style={{ backgroundColor: "#0D1729" }}>
            <h2 className="text-sm font-semibold text-white/70">Configure New Provider</h2>

            {/* Provider type buttons */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PROVIDER_LABELS) as ProviderType[]).map((pt) => (
                <button
                  key={pt}
                  onClick={() => handleProviderTypeChange(pt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    providerType === pt
                      ? "border-amber-500 text-amber-400 bg-amber-500/10"
                      : "border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                  }`}
                >
                  {PROVIDER_LABELS[pt]}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Provider Name</label>
                <input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder={PROVIDER_LABELS[providerType]}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Base URL</label>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">API Key</label>
                {keyEntered ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 font-mono">
                      {maskApiKey(apiKey)}
                    </div>
                    <button
                      onClick={() => { setKeyEntered(false); setApiKey(""); }}
                      className="text-xs text-white/40 hover:text-white/70"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onBlur={() => { if (apiKey) setKeyEntered(true); }}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-9 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection */}
            <div className="space-y-2">
              <button
                onClick={handleTestConnection}
                disabled={!apiKey || !baseUrl || testStatus === "loading"}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white/80 hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                {testStatus === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
                Test Connection
              </button>
              {testStatus !== "idle" && testStatus !== "loading" && (
                <div className={`flex items-center gap-2 text-xs ${testStatus === "success" ? "text-green-400" : "text-red-400"}`}>
                  {testStatus === "success" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {testMsg}
                </div>
              )}
            </div>

            <button
              onClick={handleFetchModels}
              disabled={!apiKey || !baseUrl || fetchLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 text-white"
              style={{ backgroundColor: "#E8941A" }}
            >
              {fetchLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              {fetchLoading ? "Fetching..." : "Fetch Models"}
            </button>
          </div>
        </div>

        {/* RIGHT — Available Models */}
        <div className="rounded-xl border border-white/10 p-6 space-y-4" style={{ backgroundColor: "#0D1729" }}>
          <h2 className="text-sm font-semibold text-white/70">
            Available Models {models.length > 0 && <span className="text-white/30">({models.length})</span>}
          </h2>

          {models.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">
              {fetchLoading ? "Fetching models..." : "Fetch models to see available options."}
            </p>
          ) : (
            <div className="space-y-4">
              {/* Selected model highlight */}
              {selectedModel && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-amber-300">{selectedModel.name}</div>
                      <div className="text-xs text-white/50 font-mono mt-0.5">{selectedModel.model_id}</div>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Selected</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleTestModel}
                      disabled={modelTestStatus === "loading"}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/20 text-white/70 hover:bg-white/5"
                    >
                      {modelTestStatus === "loading" ? <Loader2 size={12} className="animate-spin" /> : null}
                      Test Selected Model
                    </button>
                    <button
                      onClick={handleSaveActivate}
                      disabled={saveLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: "#E8941A" }}
                    >
                      {saveLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                      Save &amp; Activate
                    </button>
                  </div>
                  {modelTestStatus !== "idle" && modelTestStatus !== "loading" && (
                    <div className={`flex items-center gap-1.5 text-xs ${modelTestStatus === "success" ? "text-green-400" : "text-red-400"}`}>
                      {modelTestStatus === "success" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {modelTestMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Model list */}
              <div className="overflow-y-auto max-h-96 space-y-1 pr-1">
                {models.map((m) => (
                  <div
                    key={m.model_id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedModel?.model_id === m.model_id
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "hover:bg-white/5"
                    }`}
                    onClick={() => { setSelectedModel(m); setModelTestStatus("idle"); setModelTestMsg(""); }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-white/90 truncate">{m.name}</div>
                      <div className="text-xs text-white/40 font-mono truncate">{m.model_id}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedModel(m); setModelTestStatus("idle"); setModelTestMsg(""); }}
                      className="ml-3 shrink-0 text-xs text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
