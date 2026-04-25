import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const maxDuration = 30;

const CurriculumSchema = z.object({
  topics: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      estimated_hours: z.number(),
      week_number: z.number(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { goal } = await req.json();
    console.log("AI Generation Request for goal:", goal);

    if (!goal) {
      return new Response(JSON.stringify({ error: "Goal is required" }), { status: 400 });
    }

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      temperature: 0.3,
      system: `You are an expert curriculum designer. 
      Return ONLY a valid JSON object. 
      No preamble, no explanation, no markdown backticks.
      JSON structure: { "topics": [{ "title": string, "description": string, "estimated_hours": number, "week_number": number }] }`,
      prompt: `Generate a logical 6-topic learning roadmap for: ${goal}`,
    });

    console.log("Raw AI Response:", text);

    try {
      const json = JSON.parse(text.trim());
      // Validate with Zod
      CurriculumSchema.parse(json);
      
      return new Response(JSON.stringify(json), {
        headers: { "Content-Type": "application/json" }
      });
    } catch {
      console.error("JSON Parse Error on text:", text);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate curriculum";
    console.error("Critical AI API Route Error:", error);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
}
