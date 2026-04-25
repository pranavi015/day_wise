import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY || "" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { user_id, topics_completed, total_focus_minutes, quiz_scores, missed_days } = await req.json() as {
      user_id: string;
      topics_completed: string[];
      total_focus_minutes: number;
      quiz_scores: number[];
      missed_days: number;
    };

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("weekly_summaries")
      .select("summary_text")
      .eq("user_id", user_id)
      .eq("week_start", weekStartStr)
      .single();

    if (cached?.summary_text) {
      return NextResponse.json({ summary: cached.summary_text, cached: true });
    }

    const avgQuiz = quiz_scores.length > 0
      ? (quiz_scores.reduce((a, b) => a + b, 0) / quiz_scores.length).toFixed(1)
      : "N/A";

    const { text } = await generateText({
      model: groq("mixtral-8x7b-32768"),
      system: "You are a warm, encouraging learning coach. Write a personalized weekly study summary in exactly 3 paragraphs separated by newlines. Paragraph 1: What went well. Paragraph 2: Where the student struggled. Paragraph 3: One concrete recommendation for next week. Be specific, human, and motivating. Keep each paragraph to 2-3 sentences.",
      prompt: `Weekly stats:
- Topics completed: ${topics_completed.join(", ") || "None"}
- Total focus time: ${total_focus_minutes} minutes
- Average quiz score: ${avgQuiz}/5
- Days missed: ${missed_days} out of 7`,
    });

    // Cache result
    await supabaseAdmin.from("weekly_summaries").upsert({
      user_id,
      week_start: weekStartStr,
      summary_text: text,
      generated_at: new Date().toISOString(),
    }, { onConflict: "user_id,week_start" });

    return NextResponse.json({ summary: text, cached: false });
  } catch {
    return NextResponse.json({ error: "Failed to generate coach summary" }, { status: 500 });
  }
}
