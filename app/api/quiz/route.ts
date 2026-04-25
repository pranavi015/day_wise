import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY || "" });

export const maxDuration = 30;

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correct_index: z.number().int().min(0).max(3),
      explanation: z.string(),
    })
  ).length(3),
});

export async function POST(req: NextRequest) {
  try {
    const { topic_title, topic_description } = (await req.json()) as {
      topic_title: string;
      topic_description?: string;
    };

    if (!topic_title) {
      return NextResponse.json({ error: "topic_title is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: groq("mixtral-8x7b-32768"),
      schema: QuizSchema,
      system: "You are an expert quiz creator. Generate exactly 3 multiple-choice questions to test understanding of the given learning topic. Each question must have exactly 4 answer options and one correct answer. Include a brief explanation of why the correct answer is right.",
      prompt: `Generate a quiz for this topic:\nTitle: ${topic_title}\nDescription: ${topic_description || "No additional description provided."}`,
    });

    return NextResponse.json(object);
  } catch {
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
