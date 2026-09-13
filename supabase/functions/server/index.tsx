import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import pdfParse from "npm:pdf-parse@1.1.1";

const app = new Hono();
const PREFIX = "";
app.use("*", logger(console.log));
app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], maxAge: 600 }));

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase server credentials are not configured.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
function bearer(c: any) { return (c.req.header("Authorization") || "").replace(/^Bearer\s+/i, "").trim(); }
async function getAuthUser(c: any) {
  const token = bearer(c);
  if (!token) throw new Error("Authentication required.");
  const sb = getAdminClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid or expired session.");
  return data.user;
}
async function requireAdmin(c: any) {
  const user = await getAuthUser(c);
  const sb = getAdminClient();
  const { data: profile, error } = await sb.from("profiles").select("id,is_admin,email,username").eq("auth_user_id", user.id).single();
  if (error || !profile?.is_admin) throw new Error("Administrator access required.");
  return { user, profile, sb };
}
function jsonError(e: unknown) { return e instanceof Error ? e.message : String(e); }
function b64(bytes: Uint8Array) { let s = ""; const chunk = 0x8000; for (let i=0;i<bytes.length;i+=chunk) s += String.fromCharCode(...bytes.subarray(i, i+chunk)); return btoa(s); }
function bytesFromB64(value: string) { const s = atob(value); const out = new Uint8Array(s.length); for (let i=0;i<s.length;i++) out[i]=s.charCodeAt(i); return out; }
async function encryptionKey() {
  const raw = Deno.env.get("AI_CREDENTIAL_ENCRYPTION_KEY");
  if (!raw) throw new Error("AI_CREDENTIAL_ENCRYPTION_KEY is not configured on the server.");
  const bytes = /^[0-9a-fA-F]{64}$/.test(raw) ? new Uint8Array(raw.match(/.{2}/g)!.map(x=>parseInt(x,16))) : bytesFromB64(raw);
  if (bytes.length !== 32) throw new Error("AI_CREDENTIAL_ENCRYPTION_KEY must be 32 bytes (64 hex characters or base64).");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt","decrypt"]);
}
async function encryptSecret(secret: string) {
  const key = await encryptionKey(); const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(secret)));
  return `v1.${b64(iv)}.${b64(ciphertext)}`;
}
async function decryptSecret(value: string) {
  if (!value) throw new Error("No API key configured.");
  // Reject legacy plaintext records instead of accidentally treating them as secure.
  if (!value.startsWith("v1.")) throw new Error("Stored AI credential is not encrypted. Re-enter the API key in Admin → AI Configuration.");
  const [, ivB64, dataB64] = value.split(".");
  const key = await encryptionKey();
  const plaintext = await crypto.subtle.decrypt({ name:"AES-GCM", iv: bytesFromB64(ivB64) }, key, bytesFromB64(dataB64));
  return new TextDecoder().decode(plaintext);
}
function normalizeBaseUrl(url: string) { return url.replace(/\/+$/, ""); }
async function providerRequest(baseUrl: string, apiKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers); headers.set("Authorization", `Bearer ${apiKey}`); headers.set("Content-Type", "application/json");
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, { ...init, headers });
  return res;
}
function extractJson(content: string) {
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/); if (!match) throw new Error("AI returned no valid JSON.");
  return JSON.parse(match[0]);
}

app.get(`${PREFIX}/health`, c => c.json({ status: "ok" }));

app.post(`${PREFIX}/test-ai-provider`, async c => {
  try { await requireAdmin(c); const { baseUrl, apiKey } = await c.req.json(); if (!baseUrl || !apiKey) throw new Error("Provider URL and API key are required."); const res = await providerRequest(baseUrl, apiKey, "/models"); if (!res.ok) return c.json({ success:false, error:`Provider returned HTTP ${res.status}.` }, 400); return c.json({ success:true, message:"Connection successful." }); }
  catch(e){ return c.json({success:false,error:jsonError(e)}, 400); }
});

app.post(`${PREFIX}/list-ai-models`, async c => {
  try { await requireAdmin(c); const { baseUrl, apiKey } = await c.req.json(); if (!baseUrl || !apiKey) throw new Error("Provider URL and API key are required."); const res = await providerRequest(baseUrl, apiKey, "/models"); if (!res.ok) return c.json({success:false,error:`Provider returned HTTP ${res.status}.`},400); const data=await res.json(); const raw=data.data||data.models||[]; const models=raw.map((m:any)=>({model_id:m.id||m.model_id||m.name,display_name:m.name||m.display_name||m.id||m.model_id})).filter((m:any)=>m.model_id); return c.json({success:true,models}); }
  catch(e){ return c.json({success:false,error:jsonError(e)},400); }
});

app.post(`${PREFIX}/test-ai-model`, async c => {
  try { await requireAdmin(c); const {baseUrl,apiKey,modelId}=await c.req.json(); if(!baseUrl||!apiKey||!modelId) throw new Error("Provider URL, API key and model are required."); const res=await providerRequest(baseUrl,apiKey,"/chat/completions",{method:"POST",body:JSON.stringify({model:modelId,messages:[{role:"user",content:"Reply with exactly: OK"}],max_tokens:5,temperature:0})}); if(!res.ok) return c.json({success:false,error:`Model returned HTTP ${res.status}.`},400); return c.json({success:true,message:"Model is responsive."}); }
  catch(e){return c.json({success:false,error:jsonError(e)},400);}
});

app.post(`${PREFIX}/admin-ai-config`, async c => {
  try { const {sb}=await requireAdmin(c); const {data,error}=await sb.from("ai_configurations").select("id,is_active,last_tested_at,provider:ai_providers(name,provider_type),model:ai_models(display_name,model_id)").eq("is_active",true).maybeSingle(); if(error) throw error; return c.json({success:true,config:data}); }
  catch(e){return c.json({success:false,error:jsonError(e)},400);}
});

app.post(`${PREFIX}/save-ai-config`, async c => {
  try {
    const {sb,profile}=await requireAdmin(c); const {providerType,providerName,baseUrl,apiKey,modelId}=await c.req.json();
    if(!providerType||!baseUrl||!apiKey||!modelId) throw new Error("Provider, base URL, API key and model are required.");
    // Validate selected model before persisting anything.
    const test=await providerRequest(baseUrl,apiKey,"/chat/completions",{method:"POST",body:JSON.stringify({model:modelId,messages:[{role:"user",content:"Reply with exactly: OK"}],max_tokens:5,temperature:0})});
    if(!test.ok) throw new Error(`Selected model test failed (HTTP ${test.status}).`);
    const encrypted=await encryptSecret(apiKey);
    const {data:provider,error:pe}=await sb.from("ai_providers").upsert({name:providerName||providerType,provider_type:providerType,base_url:baseUrl,encrypted_secret_reference:encrypted,enabled:true,updated_at:new Date().toISOString()},{onConflict:"provider_type"}).select("id").single();
    if(pe) throw pe;
    const {data:model,error:me}=await sb.from("ai_models").upsert({provider_id:provider.id,model_id:modelId,display_name:modelId,metadata:{},enabled:true},{onConflict:"provider_id,model_id"}).select("id").single();
    if(me) throw me;
    await sb.from("ai_configurations").update({is_active:false,updated_at:new Date().toISOString()}).eq("is_active",true);
    const {error:ce}=await sb.from("ai_configurations").insert({provider_id:provider.id,model_id:model.id,is_active:true,last_tested_at:new Date().toISOString()}); if(ce) throw ce;
    await sb.from("audit_logs").insert({admin_user_id:profile.id,action:"ai_configuration_activated",metadata:{provider_type:providerType,model_id:modelId}});
    return c.json({success:true});
  } catch(e){return c.json({success:false,error:jsonError(e)},400);}
});

app.post(`${PREFIX}/deactivate-ai`, async c => { try { const {sb,profile}=await requireAdmin(c); const {error}=await sb.from("ai_configurations").update({is_active:false}).eq("is_active",true); if(error) throw error; await sb.from("audit_logs").insert({admin_user_id:profile.id,action:"ai_configuration_deactivated",metadata:{}}); return c.json({success:true}); } catch(e){return c.json({success:false,error:jsonError(e)},400);} });

app.post(`${PREFIX}/process-pdf`, async c => {
  const sb=getAdminClient(); let jobId="";
  try {
    const user=await getAuthUser(c); const {jobId:incomingJobId,filePath}=await c.req.json(); jobId=incomingJobId||"";
    if(!jobId||!filePath) throw new Error("Processing job and file path are required.");
    const {data:profile}=await sb.from("profiles").select("id").eq("auth_user_id",user.id).single(); if(!profile) throw new Error("Profile not found.");
    const {data:job,error:je}=await sb.from("processing_jobs").select("*").eq("id",jobId).eq("user_id",profile.id).single(); if(je||!job) throw new Error("Processing job not found or not owned by current user.");
    const {data:config,error:ce}=await sb.from("ai_configurations").select("id,provider_id,model_id,provider:ai_providers(*),model:ai_models(*)").eq("is_active",true).single(); if(ce||!config) throw new Error("No active AI configuration. Configure one in /admin/ai.");
    const apiKey=await decryptSecret(config.provider.encrypted_secret_reference);
    await sb.from("processing_jobs").update({status:"processing",progress:10,started_at:new Date().toISOString(),provider_id:config.provider_id,model_id:config.model_id}).eq("id",jobId);
    const {data:fileData,error:fe}=await sb.storage.from("exam-pdfs").download(filePath); if(fe||!fileData) throw new Error("Failed to download PDF from storage.");
    await sb.from("processing_jobs").update({progress:25}).eq("id",jobId);

    // Generic OpenAI-compatible providers are not guaranteed to accept PDF data URLs.
    // We therefore extract text server-side when possible and preserve the original PDF
    // as the visual fallback for image/scanned questions. Vision-specific adapters can be
    // added per provider without changing the exam UI.
    let extractedText="";
    try {
      const pdfBytes=new Uint8Array(await fileData.arrayBuffer());
      const parsedPdf=await pdfParse(pdfBytes);
      extractedText=(parsedPdf.text||"").replace(/\s+/g," ").slice(0,120000);
    } catch (e) {
      console.warn("PDF text extraction unavailable:", e);
    }
    if(!extractedText.trim()) extractedText="[No machine-readable text was extracted from this PDF. This is likely scanned/image-heavy; use a vision-capable model/provider or the original PDF page fallback.]";
    await sb.from("processing_jobs").update({progress:45}).eq("id",jobId);

    const extractionPrompt=`You are a high-precision examination paper extraction engine. Extract only information actually present in the source. Preserve original numbering and order. Do not invent questions, options, answers, marks, sections or explanations. If an answer is uncertain, use an empty correct_answer array. If a question contains a diagram/image/table or its text is not recoverable, set has_image=true and include source_page when identifiable. Return ONLY valid JSON.

Schema:
{"sections":[{"name":"General","start_question":1,"end_question":1}],"questions":[{"question_number":1,"question_text":"exact text or empty string","question_type":"single_choice","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"correct_answer":["A"],"marks":1,"negative_marks":0,"section":"General","has_image":false,"source_page":1}]}

Rules: support single_choice and multiple_choice; map answer-key letters to exact question numbers; preserve all four/five options when present; detect section headings; never renumber; use has_image=true for figures, charts, diagrams, tables or scanned content; use source_page when possible.

SOURCE PDF TEXT:
${extractedText}`;

    const res=await providerRequest(config.provider.base_url,apiKey,"/chat/completions",{method:"POST",body:JSON.stringify({model:config.model.model_id,messages:[{role:"system",content:"You output strict JSON only."},{role:"user",content:extractionPrompt}],max_tokens:12000,temperature:0})});
    if(!res.ok) throw new Error(`AI extraction failed (HTTP ${res.status}).`);
    const data=await res.json(); const content=data.choices?.[0]?.message?.content; if(!content) throw new Error("AI returned an empty response."); const parsed=extractJson(typeof content==="string"?content:JSON.stringify(content));
    const questions=Array.isArray(parsed.questions)?parsed.questions:[]; if(!questions.length) throw new Error("No questions were extracted.");
    await sb.from("processing_jobs").update({progress:75,questions_found:questions.length,answers_found:questions.filter((q:any)=>Array.isArray(q.correct_answer)&&q.correct_answer.length>0).length,sections_found:Array.isArray(parsed.sections)?parsed.sections.length:0,images_found:questions.filter((q:any)=>q.has_image).length}).eq("id",jobId);

    // The processing job must already have an exam shell. Older builds created the shell
    // after processing; create one here so extraction cannot complete without a destination.
    let examId=job.exam_id;
    if(!examId){ const {data:exam,error:ee}=await sb.from("exams").insert({owner_id:profile.id,title:"Imported Exam",source_file_path:filePath,status:"processing"}).select("id").single(); if(ee) throw ee; examId=exam.id; await sb.from("processing_jobs").update({exam_id:examId}).eq("id",jobId); }
    await sb.from("exam_sections").delete().eq("exam_id",examId); await sb.from("questions").delete().eq("exam_id",examId);
    const sections=Array.isArray(parsed.sections)&&parsed.sections.length?parsed.sections:[{name:"General",start_question:questions[0]?.question_number||1,end_question:questions[questions.length-1]?.question_number||questions.length}];
    const sectionRows:any[]=[];
    for(let i=0;i<sections.length;i++){ const {data:s,error:se}=await sb.from("exam_sections").insert({exam_id:examId,name:sections[i].name||`Section ${i+1}`,section_order:i+1,start_question:Number(sections[i].start_question)||1,end_question:Number(sections[i].end_question)||questions.length}).select().single(); if(se) throw se; sectionRows.push(s); }
    for(const q of questions){ const sec=sectionRows.find(s=>q.question_number>=s.start_question&&q.question_number<=s.end_question)||sectionRows[0]; const {data:question,error:qe}=await sb.from("questions").insert({exam_id:examId,section_id:sec?.id,question_number:Number(q.question_number),question_text:q.question_text||"",question_type:q.question_type==="multiple_choice"?"multiple_choice":"single_choice",correct_answer:Array.isArray(q.correct_answer)?q.correct_answer:[],marks:Number(q.marks)||1,negative_marks:Number(q.negative_marks)||0,source_page:q.source_page?Number(q.source_page):null,source_reference:q.has_image?`Original PDF page ${q.source_page||""}`:null}).select().single(); if(qe) throw qe; for(let i=0;i<(Array.isArray(q.options)?q.options:[]).length;i++){const o=q.options[i]; const {error:oe}=await sb.from("question_options").insert({question_id:question.id,option_key:String(o.key||String.fromCharCode(65+i)),option_text:o.text||"",option_order:i+1}); if(oe) throw oe;} }
    await sb.from("exams").update({owner_id:profile.id,total_questions:questions.length,total_marks:questions.reduce((n:number,q:any)=>n+(Number(q.marks)||1),0),status:"ready"}).eq("id",examId);
    await sb.from("processing_jobs").update({status:"completed",progress:100,exam_id:examId,completed_at:new Date().toISOString()}).eq("id",jobId);
    return c.json({success:true,examId,questionsFound:questions.length});
  } catch(e){ if(jobId) await sb.from("processing_jobs").update({status:"failed",error_message:jsonError(e),completed_at:new Date().toISOString()}).eq("id",jobId); return c.json({success:false,error:jsonError(e)},400); }
});

app.post(`${PREFIX}/submit-exam`, async c => {
  const sb=getAdminClient();
  try { const user=await getAuthUser(c); const {attemptId,answers}=await c.req.json(); if(!attemptId) throw new Error("Attempt ID is required."); const {data:profile}=await sb.from("profiles").select("id").eq("auth_user_id",user.id).single(); if(!profile) throw new Error("Profile not found."); const {data:attempt,error:ae}=await sb.from("exam_attempts").select("*").eq("id",attemptId).eq("user_id",profile.id).single(); if(ae||!attempt) throw new Error("Attempt not found."); if(attempt.status!=="in_progress") throw new Error("This attempt is already closed."); const {data:questions}=await sb.from("questions").select("*").eq("exam_id",attempt.exam_id); if(!questions?.length) throw new Error("Questions not found."); let totalScore=0,correctCount=0,incorrectCount=0,unansweredCount=0; for(const q of questions){const userAnswer:Array<string>=Array.isArray(answers?.[q.id])?answers[q.id]:[]; const correctAnswer:Array<string>=Array.isArray(q.correct_answer)?q.correct_answer:[]; if(!userAnswer.length){unansweredCount++;continue;} const a=[...userAnswer].sort().join(","),b=[...correctAnswer].sort().join(","); if(a===b){totalScore+=Number(q.marks)||0;correctCount++;}else{totalScore-=Number(q.negative_marks)||0;incorrectCount++;} } const maxScore=questions.reduce((n,q)=>n+(Number(q.marks)||0),0); const percentage=maxScore?Math.max(0,(totalScore/maxScore)*100):0; const started=new Date(attempt.started_at).getTime(); const timeTaken=Math.max(0,Math.floor((Date.now()-started)/1000)); await sb.from("exam_attempts").update({status:"submitted",submitted_at:new Date().toISOString()}).eq("id",attemptId); const {data:result,error:re}=await sb.from("results").insert({attempt_id:attemptId,total_score:Math.max(0,totalScore),max_score:maxScore,percentage,correct_count:correctCount,incorrect_count:incorrectCount,unanswered_count:unansweredCount,accuracy:(correctCount+incorrectCount)?(correctCount/(correctCount+incorrectCount))*100:0,time_taken_seconds:timeTaken}).select().single(); if(re) throw re; return c.json({success:true,resultId:result.id}); } catch(e){return c.json({success:false,error:jsonError(e)},400);} });

Deno.serve(app.fetch);
