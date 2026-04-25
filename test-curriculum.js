require('dotenv').config({ path: '.env.local' });
const { createGroq } = require('@ai-sdk/groq');
const { streamObject } = require('ai');
const { z } = require('zod');

async function test() {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const result = await streamObject({
      model: groq("llama-3.3-70b-versatile"),
      system: "You are an expert curriculum designer.",
      prompt: "Generate a full curriculum for this goal: Learn NextJS",
      schema: z.object({
        topics: z.array(z.object({
          title: z.string(), description: z.string(), estimated_hours: z.number(), week_number: z.number()
        })).min(1),
      }),
    });
    console.log("Stream opened!");
    for await (const chunk of result.partialObjectStream) {
      console.log(JSON.stringify(chunk));
    }
    console.log("Final object:", await result.object);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
