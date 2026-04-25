import { createGroq } from "@ai-sdk/groq";
import { streamObject } from "ai";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { goal } = await req.json();
    console.log("AI Generation Request for goal:", goal);

    if (!goal) {
      return new Response(JSON.stringify({ error: "Goal is required" }), { status: 400 });
    }

    const result = await streamObject({
      model: groq("llama-3.1-70b-versatile"),
      system: "You are an expert curriculum designer. Break down the user's learning goal into an array of 5-10 topics. Return an array of topic objects.",
      prompt: `Generate a full curriculum for this goal: ${goal}`,
      schema: z.object({
        topics: z.array(
          z.object({
            title: z.string().describe("The name of the topic"),
            description: z.string().describe("Short 1-sentence description"),
            estimated_hours: z.number().describe("Estimated hours, e.g. 2, 4"),
            week_number: z.number().describe("Week number started from 1"),
          })
        ),
      }),
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate curriculum";
    console.error("Critical AI API Route Error:", error);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
}
