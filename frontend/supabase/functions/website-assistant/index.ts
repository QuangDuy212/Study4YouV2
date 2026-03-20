import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Study4You Assistant, a helpful AI assistant for the Study4You TOEIC practice platform.

About Study4You:
- Study4You is an online TOEIC practice platform for English learners
- Users can take TOEIC practice tests, practice listening, practice reading, and track their progress
- The platform provides AI-powered feedback on speaking exercises

Key Features:
1. TOEIC Practice Tests - Full practice tests with reading and listening sections
2. Reading Practice - Passages and comprehension questions to improve reading skills
3. Listening Practice - Audio exercises with questions to enhance listening skills
4. Speaking Practice - Record responses and receive AI feedback on pronunciation and fluency
5. Dashboard - View test history, progress, and recent activity
6. Settings - Update account information, change theme, and language preferences

TOEIC Test Structure (what users should know):
- Part 1: Photos (Listening) - Look at photos and choose the best description
- Part 2: Question Response (Listening) - Listen to a question and choose the best response
- Part 3: Conversations (Listening) - Listen to conversations and answer questions
- Part 4: Talks (Listening) - Listen to talks and answer questions
- Part 5: Incomplete Sentences (Reading) - Fill in the blank with the correct word
- Part 6: Text Completion (Reading) - Complete passages with missing words
- Part 7: Reading Comprehension (Reading) - Read passages and answer questions

Navigation Help:
- Dashboard: /dashboard - Main hub showing progress and quick access to features
- Tests: /tests - Browse and start practice tests
- Settings: /settings - Account settings, theme, language options
- Login: /login - Sign in to your account
- Register: /register - Create a new account

Admin Features (for admin users):
- Manage Tests - Create and edit TOEIC tests
- Question Bank - Manage all questions
- Users Management - View and manage registered users
- Roles & Permissions - Configure user roles
- Analytics - View platform statistics
- AI Generation - Generate questions using AI

Guidelines for responses:
1. Be helpful, friendly, and concise
2. Guide users to the right pages/features
3. Explain how to use features step by step
4. If you don't know something specific, suggest checking the Settings or contacting support
5. Keep responses under 100 words unless detailed explanation is needed
6. Use simple, clear language suitable for English learners`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
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
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Website assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
