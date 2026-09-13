import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const EDGE_FUNCTION_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1b359045`;

export async function callEdgeFunction(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || publicAnonKey}`,
  };
  const res = await fetch(`${EDGE_FUNCTION_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Edge function error");
  }
  return res.json();
}
