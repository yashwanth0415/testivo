import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const PREFIX = "/make-server-1b359045";

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// Test AI provider connection
app.post(`${PREFIX}/test-ai-provider`, async (c) => {
  try {
    const { providerType, baseUrl, apiKey } = await c.req.json();
    const url = `${baseUrl}/models`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return c.json({ success: false, error: `Provider returned ${res.status}` });
    }
    return c.json({ success: true, message: "Connection successful" });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

// List available AI models from provider
app.post(`${PREFIX}/list-ai-models`, async (c) => {
  try {
    const { baseUrl, apiKey } = await c.req.json();
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return c.json({ success: false, error: `Provider returned ${res.status}` });
    const data = await res.json();
    const models = (data.data || data.models || []).map((m: Record<string, string>) => ({
      model_id: m.id || m.model_id || m.name,
      display_name: m.name || m.display_name || m.id,
    }));
    return c.json({ success: true, models });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

// Test a specific AI model with a lightweight request
app.post(`${PREFIX}/test-ai-model`, async (c) => {
  try {
    const { baseUrl, apiKey, modelId } = await c.req.json();
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Reply with just the word: ok" }],
        max_tokens: 5,
      }),
    });
    if (!res.ok) return c.json({ success: false, error: `Model returned ${res.status}` });
    return c.json({ success: true, message: "Model is responsive" });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

// Process PDF — extract exam content using configured AI
app.post(`${PREFIX}/process-pdf`, async (c) => {
  const supabase = getSupabaseAdmin();
  try {
    const { jobId, filePath, userId } = await c.req.json();

    // Get active AI configuration
    const { data: config } = await supabase
      .from("ai_configurations")
      .select("*, provider:ai_providers(*), model:ai_models(*)")
      .eq("is_active", true)
      .single();

    if (!config) {
      await supabase.from("processing_jobs").update({
        status: "failed", error_message: "No active AI configuration. Please configure an AI provider in the admin panel."
      }).eq("id", jobId);
      return c.json({ success: false, error: "No active AI configuration" });
    }

    // Update job to processing
    await supabase.from("processing_jobs").update({ status: "processing", progress: 10, started_at: new Date().toISOString() }).eq("id", jobId);

    // Download the PDF from storage
    const { data: fileData, error: fileErr } = await supabase.storage.from("exam-pdfs").download(filePath);
    if (fileErr || !fileData) {
      await supabase.from("processing_jobs").update({ status: "failed", error_message: "Failed to download PDF" }).eq("id", jobId);
      return c.json({ success: false, error: "Failed to download PDF" });
    }

    await supabase.from("processing_jobs").update({ progress: 30 }).eq("id", jobId);

    // Convert PDF to base64 for vision model
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    await supabase.from("processing_jobs").update({ progress: 50 }).eq("id", jobId);

    const extractionPrompt = `You are an expert exam extraction system. Analyze the provided PDF examination paper and extract all questions.

Return ONLY valid JSON with this exact structure:
{
  "sections": [
    {
      "name": "Section name (or 'General' if none)",
      "start_question": 1,
      "end_question": 25
    }
  ],
  "questions": [
    {
      "question_number": 1,
      "question_text": "The exact question text",
      "question_type": "single_choice",
      "options": [
        { "key": "A", "text": "Option A text" },
        { "key": "B", "text": "Option B text" },
        { "key": "C", "text": "Option C text" },
        { "key": "D", "text": "Option D text" }
      ],
      "correct_answer": ["A"],
      "marks": 1,
      "negative_marks": 0.25,
      "section": "Section name",
      "has_image": false
    }
  ]
}

Rules:
- Preserve original question numbering exactly
- Extract all options completely
- Map answer keys correctly to question numbers
- For multiple correct answers use array: ["A","C"]
- Set has_image:true if question contains diagrams/figures
- Never invent answers — if uncertain, set correct_answer to []
- Detect sections from headings
- Return ONLY the JSON, no other text`;

    const providerBaseUrl = config.provider.base_url;
    const apiKey = config.provider.encrypted_secret_reference;
    const modelId = config.model.model_id;

    let aiResponse;
    try {
      const res = await fetch(`${providerBaseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: extractionPrompt },
                { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } }
              ]
            }
          ],
          max_tokens: 8000,
        }),
      });
      if (!res.ok) throw new Error(`AI API error ${res.status}`);
      const resData = await res.json();
      const content = resData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in AI response");
      aiResponse = JSON.parse(jsonMatch[0]);
    } catch (e) {
      await supabase.from("processing_jobs").update({ status: "failed", error_message: `AI extraction failed: ${e}` }).eq("id", jobId);
      return c.json({ success: false, error: `AI extraction failed: ${e}` });
    }

    await supabase.from("processing_jobs").update({ progress: 75 }).eq("id", jobId);

    // Create the exam record
    const { data: jobData } = await supabase.from("processing_jobs").select("exam_id").eq("id", jobId).single();
    const examId = jobData?.exam_id;

    if (examId && aiResponse.sections) {
      // Insert sections
      for (let i = 0; i < aiResponse.sections.length; i++) {
        const s = aiResponse.sections[i];
        await supabase.from("exam_sections").insert({
          exam_id: examId,
          name: s.name,
          section_order: i + 1,
          start_question: s.start_question,
          end_question: s.end_question,
        });
      }

      // Insert questions
      const { data: sections } = await supabase.from("exam_sections").select("*").eq("exam_id", examId);

      for (const q of aiResponse.questions) {
        const section = sections?.find(s => q.question_number >= s.start_question && q.question_number <= s.end_question);
        const { data: question } = await supabase.from("questions").insert({
          exam_id: examId,
          section_id: section?.id,
          question_number: q.question_number,
          question_text: q.question_text,
          question_type: q.question_type || "single_choice",
          correct_answer: q.correct_answer || [],
          marks: q.marks || 1,
          negative_marks: q.negative_marks || 0,
          source_page: q.source_page,
        }).select().single();

        if (question && q.options) {
          for (let oi = 0; oi < q.options.length; oi++) {
            const opt = q.options[oi];
            await supabase.from("question_options").insert({
              question_id: question.id,
              option_key: opt.key,
              option_text: opt.text,
              option_order: oi + 1,
            });
          }
        }
      }

      const qCount = aiResponse.questions.length;
      const aCount = aiResponse.questions.filter((q: { correct_answer: string[] }) => q.correct_answer.length > 0).length;

      await supabase.from("exams").update({
        total_questions: qCount,
        status: "ready",
      }).eq("id", examId);

      await supabase.from("processing_jobs").update({
        status: "completed",
        progress: 100,
        questions_found: qCount,
        answers_found: aCount,
        sections_found: aiResponse.sections.length,
        images_found: aiResponse.questions.filter((q: { has_image: boolean }) => q.has_image).length,
        completed_at: new Date().toISOString(),
        provider_id: config.provider_id,
        model_id: config.model_id,
      }).eq("id", jobId);
    }

    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

// Submit exam and calculate result
app.post(`${PREFIX}/submit-exam`, async (c) => {
  const supabase = getSupabaseAdmin();
  try {
    const { attemptId, answers } = await c.req.json();

    const { data: attempt } = await supabase.from("exam_attempts").select("*, exam:exams(*)").eq("id", attemptId).single();
    if (!attempt) return c.json({ success: false, error: "Attempt not found" });

    const { data: questions } = await supabase.from("questions").select("*").eq("exam_id", attempt.exam_id);
    if (!questions) return c.json({ success: false, error: "Questions not found" });

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    for (const q of questions) {
      const userAnswer: string[] = answers[q.id] || [];
      const correctAnswer: string[] = q.correct_answer || [];

      if (userAnswer.length === 0) {
        unansweredCount++;
        continue;
      }

      const isCorrect = q.question_type === "single_choice"
        ? userAnswer[0] === correctAnswer[0]
        : userAnswer.sort().join(",") === correctAnswer.sort().join(",");

      if (isCorrect) {
        totalScore += q.marks;
        correctCount++;
      } else {
        totalScore -= q.negative_marks;
        incorrectCount++;
      }
    }

    const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;
    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100 * 10) / 10 : 0;

    const startedAt = new Date(attempt.started_at).getTime();
    const timeTaken = Math.floor((Date.now() - startedAt) / 1000);

    await supabase.from("exam_attempts").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", attemptId);

    const { data: result } = await supabase.from("results").insert({
      attempt_id: attemptId,
      total_score: Math.max(0, totalScore),
      max_score: maxScore,
      percentage: Math.max(0, percentage),
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      accuracy,
      time_taken_seconds: timeTaken,
    }).select().single();

    return c.json({ success: true, resultId: result?.id });
  } catch (e) {
    return c.json({ success: false, error: String(e) });
  }
});

Deno.serve(app.fetch);
