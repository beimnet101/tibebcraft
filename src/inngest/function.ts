import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import { firecrawl } from "@/lib/firecrawl";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ event, step }) => {
    const { prompt } = event.data as { prompt: string };

    const urls = await step.run("extract-urls", async () => {
      return prompt.match(URL_REGEX) ?? [];
    });

    const scrapedContent = await step.run("scrape-urls", async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await firecrawl.scrape(url, {
            formats: ["markdown"],
          });
          return result.markdown ?? null;
        })
      );

      return results.filter(Boolean).join("\n\n");
    });

    const finalPrompt = scrapedContent
      ? `Context:\n${scrapedContent}\n\nQuestion:${prompt}`
      : prompt;

    return await step.run("generate-text", async () => {
      return generateText({
        model: google("gemini-2.5-flash"),
        prompt: finalPrompt,
          experimental_telemetry:{
          isEnabled:true,
          recordInputs:true,
          recordOutputs:true
  }
      });
    });
  }
);

export const demoError = inngest.createFunction(
  { id: "demo-error" },
  { event: "demo/error" },
  async ({ step }) => {
    await step.run("fail", async () => {
      throw new Error("inngest error: Background job failed");
    });
  }
);

// import { generateText } from "ai";
// import { inngest } from "./client";
// import { anthropic } from "@ai-sdk/anthropic";

// export const demoGenerate = inngest.createFunction(
//   { id: "demo-generate" },
//   { event: "demo/generate" },
//   async ({ step }) => {
//     await step.run("generate-text", async () => {
//       return await generateText({
//         model: anthropic('claude-3-haiku-20240307'),
//         prompt: 'Write a vegetarian lasagna recipe for 4 people.',
//       });
//     })
//   },
// );