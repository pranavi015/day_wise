import { createGroq } from "@ai-sdk/groq";
import { streamObject } from "ai";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { goal } = await req.json();

  const result = await streamObject({
    model: groq("mixtral-8x7b-32768"),
    system: "You are an expert curriculum designer. Break down the user's learning goal into an array of topics. Provide a solid, rigorous but realistic breakdown. Return an array of topic objects. Each topic must have a 'title', 'description', 'estimated_hours' (a number), and a 'week_number' (starting from 1, typically 1 to 4 topics per week). Be very concise in descriptions.",
    prompt: `Generate a full curriculum for this goal: ${goal}`,
    schema: z.object({
      topics: z.array(
        z.object({
          title: z.string().describe("The name of the topic"),
          description: z.string().describe("Short 1-sentence description"),
          estimated_hours: z.number().describe("Estimated hours to complete this topic, e.g., 2, 4.5"),
          week_number: z.number().describe("Chronological week number, e.g., 1, 2"),
        })
      ),
    }),
  });

  return result.toTextStreamResponse();
}
