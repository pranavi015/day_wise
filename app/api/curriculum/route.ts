import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
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

    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      system: "You are an expert curriculum designer. Break down the user's goal into exactly 6 distinct, logical topics for a roadmap. Return a JSON object with a 'topics' array. Each topic MUST have 'title', 'description', 'estimated_hours', and 'week_number'.",
      prompt: `Generate a full curriculum for this goal: ${goal}`,
      schema: z.object({
        topics: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            estimated_hours: z.number(),
            week_number: z.number(),
          })
        ),
      }),
    });

    console.log("AI Generated successfully:", object.topics.length, "topics");
    return new Response(JSON.stringify(object), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate curriculum";
    console.error("Critical AI API Route Error:", error);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
}
