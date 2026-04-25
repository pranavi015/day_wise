import 'dotenv/config';
import { createGroq } from '@ai-sdk/groq';
import { streamObject } from 'ai';
import { z } from 'zod';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  try {
    const result = await streamObject({
      model: groq("llama3-8b-8192"),
      system: "You are an expert.",
      prompt: "Generate a curriculum",
      schema: z.object({ topics: z.array(z.object({ title: z.string() })) })
    });
    console.log("Success: Stream opened");
    for await (const partialObject of result.partialObjectStream) {
      // just verify stream works
    }
  } catch(e) {
    console.error(e.message);
  }
}
test();
