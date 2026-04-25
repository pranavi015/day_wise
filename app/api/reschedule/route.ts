import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
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

    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: RescheduleSchema,
      system: "You are a smart curriculum planner. Given a list of missed tasks and the current topic schedule, redistribute the missed work across upcoming weeks. Return topic_id and new_week_number for each topic that needs rescheduling. Provide a brief human summary of the changes.",
      prompt: `Missed tasks: ${JSON.stringify(missed_tasks)}
Remaining weeks: ${remaining_weeks}
Current curriculum: ${JSON.stringify(topics)}

Redistribute missed work across upcoming weeks and return updated week numbers for affected topics.`,
    });

    return NextResponse.json(object);
  } catch {
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 });
  }
}
