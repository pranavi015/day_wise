import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY || "" });

export const maxDuration = 30;

const RescheduleSchema = z.object({
  updates: z.array(
    z.object({
      topic_id: z.string(),
      new_week_number: z.number().int().positive(),
    })
  ),
  summary: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { missed_tasks, remaining_weeks, topics } = await req.json() as {
      missed_tasks: { topic_name: string; topic_id: string; duration_minutes: number }[];
      remaining_weeks: number;
      topics: { id: string; title: string; week_number: number; estimated_hours: number }[];
    };

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      temperature: 0.3,
      system: `You are a smart curriculum planner. 
      Return ONLY a valid JSON object. 
      No preamble, no explanation, no markdown backticks.
      JSON structure: { updates: [{ topic_id, new_week_number }], summary: string }`,
      prompt: `Missed: ${JSON.stringify(missed_tasks)}. Weeks: ${remaining_weeks}. Curr: ${JSON.stringify(topics)}.`,
    });

    console.log("Raw AI Response (Reschedule):", text);

    try {
      const json = JSON.parse(text.trim());
      RescheduleSchema.parse(json);
      return NextResponse.json(json);
    } catch {
      console.error("Reschedule JSON Parse Error:", text);
      return NextResponse.json({ error: "AI returned invalid schedule format" }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Critical Reschedule API Error:", error);
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 });
  }
}
