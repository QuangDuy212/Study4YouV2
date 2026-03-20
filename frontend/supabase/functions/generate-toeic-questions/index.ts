import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PART_CONFIG: Record<string, { count: number; label: string }> = {
  PART_5: { count: 30, label: "Incomplete Sentences" },
  PART_6: { count: 16, label: "Text Completion" },
  PART_7: { count: 54, label: "Reading Comprehension" },
};

function buildPrompt(partType: string, difficulty: string, count: number): string {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  if (partType === "PART_5") {
    return `You are a TOEIC exam question generator. Generate exactly ${count} TOEIC Part 5 (Incomplete Sentences) questions at ${diffLabel} difficulty level.

Each question must have:
- "content": a sentence with one blank written as "____"
- "correctAnswer": one of "A", "B", "C", "D"
- "options": exactly 4 options with labels "A", "B", "C", "D" and a "content" field for each

Rules:
- Questions should test grammar, vocabulary, and word form
- The correctAnswer must match one of the option labels exactly
- All questions must be unique and realistic TOEIC-style
- Do NOT include passage, audioUrl, or imageUrl (they should be null)

Return a JSON array of objects. Each object:
{
  "content": "string with ____",
  "correctAnswer": "A" | "B" | "C" | "D",
  "options": [
    {"label": "A", "content": "..."},
    {"label": "B", "content": "..."},
    {"label": "C", "content": "..."},
    {"label": "D", "content": "..."}
  ]
}

Return ONLY the JSON array, no markdown, no explanation.`;
  }

  if (partType === "PART_6") {
    return `You are a TOEIC exam question generator. Generate exactly ${count} TOEIC Part 6 (Text Completion) questions at ${diffLabel} difficulty level.

Generate 4 passages (emails, memos, notices, letters). Each passage should have 4 questions (total 16 questions).

Each question must have:
- "content": a sentence with one blank written as "____"
- "passage": the full passage text that this question belongs to (NOT null)
- "correctAnswer": one of "A", "B", "C", "D"
- "options": exactly 4 options with labels "A", "B", "C", "D"

Rules:
- Questions within the same passage should share the same passage text
- Passages should be realistic business documents (150-250 words each)
- The correctAnswer must match one of the option labels exactly
- Questions test vocabulary, grammar, and sentence insertion in context

Return a JSON array of objects. Each object:
{
  "content": "string with ____",
  "passage": "full passage text",
  "correctAnswer": "A" | "B" | "C" | "D",
  "options": [
    {"label": "A", "content": "..."},
    {"label": "B", "content": "..."},
    {"label": "C", "content": "..."},
    {"label": "D", "content": "..."}
  ]
}

Return ONLY the JSON array, no markdown, no explanation.`;
  }

  // PART_7
  return `You are a TOEIC exam question generator. Generate exactly ${count} TOEIC Part 7 (Reading Comprehension) questions at ${diffLabel} difficulty level.

Generate a mix of single passages (2-4 questions each), double passages (5 questions each), and triple passages (5 questions each).

Each question must have:
- "content": a comprehension question about the passage
- "passage": the full passage text (NOT null, 150-400 words)
- "correctAnswer": one of "A", "B", "C", "D"
- "options": exactly 4 options with labels "A", "B", "C", "D"

Rules:
- Questions within the same passage group share the same passage text
- Passages should be realistic: emails, ads, articles, schedules, forms, chat messages
- Questions test main idea, detail, inference, vocabulary in context, purpose
- The correctAnswer must match one of the option labels exactly
- Total must be exactly ${count} questions

Return a JSON array of objects. Each object:
{
  "content": "question text",
  "passage": "full passage text",
  "correctAnswer": "A" | "B" | "C" | "D",
  "options": [
    {"label": "A", "content": "..."},
    {"label": "B", "content": "..."},
    {"label": "C", "content": "..."},
    {"label": "D", "content": "..."}
  ]
}

Return ONLY the JSON array, no markdown, no explanation.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partType, difficulty } = await req.json();

    if (!partType || !PART_CONFIG[partType]) {
      return new Response(
        JSON.stringify({ error: "Invalid partType. Must be PART_5, PART_6, or PART_7" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = PART_CONFIG[partType];
    const prompt = buildPrompt(partType, difficulty || "intermediate", config.count);

    console.log(`Generating ${config.count} questions for ${partType} (${difficulty || "intermediate"})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional TOEIC exam question generator. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response, handling potential markdown code blocks
    let questions;
    try {
      let jsonStr = rawContent.trim();
      // Remove markdown code block if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      questions = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse generated questions. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and normalize questions
    const normalized = questions.map((q: any) => ({
      content: q.content || "",
      audioUrl: null,
      imageUrl: null,
      passage: q.passage || null,
      correctAnswer: q.correctAnswer,
      options: (q.options || []).map((opt: any) => ({
        label: opt.label,
        content: opt.content,
      })),
    }));

    console.log(`Successfully generated ${normalized.length} questions for ${partType}`);

    return new Response(
      JSON.stringify({ questions: normalized, partType, count: normalized.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-toeic-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
