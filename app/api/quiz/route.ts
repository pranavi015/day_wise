import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
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

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      temperature: 0.3,
      system: `You are an expert quiz creator. 
      Return ONLY a valid JSON object. 
      No preamble, no explanation, no markdown backticks.
      Goal: Generate 3 multiple-choice questions for the given topic.`,
      prompt: `Topic: ${topic_title}\nDescription: ${topic_description || "No description"}. Return JSON matching the schema: { questions: [{ question, options: [4], correct_index, explanation }] }`,
    });

    console.log("Raw AI Response (Quiz):", text);

    try {
      const json = JSON.parse(text.trim());
      QuizSchema.parse(json);
      return NextResponse.json(json);
    } catch {
      console.error("Quiz JSON Parse Error:", text);
      return NextResponse.json({ error: "AI returned invalid quiz format" }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Critical Quiz API Error:", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
