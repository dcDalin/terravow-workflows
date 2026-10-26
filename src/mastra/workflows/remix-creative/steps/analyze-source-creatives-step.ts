import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateRemixInputSchema,
  sourceAnalysisSchema,
} from "../../../schemas/remix-creative-types";

/**
 * Step 1: Read each source creative and describe its structure.
 *
 * One vision call per source image, run in parallel. The agent transcribes and
 * classifies; nothing is filtered here — the policy pass happens in the next
 * step so the raw reading stays visible in traces.
 */
export const analyzeSourceCreativesStep = createStep({
  id: "analyze-source-creatives",
  description:
    "Analyze each source ad creative's layout, text and structure using a vision agent",
  inputSchema: generateRemixInputSchema,
  outputSchema: z.object({
    originalInput: generateRemixInputSchema,
    analyses: z.array(sourceAnalysisSchema),
  }),
  execute: async ({ inputData, mastra }) => {
    const { sourceImages, sourceBrandName } = inputData;

    console.log(`🔍 Analyzing ${sourceImages.length} source creative(s)...`);

    const agent = mastra?.getAgent("creativeRemixAgent");
    if (!agent) {
      throw new Error(
        "creativeRemixAgent not found — ensure it is registered in src/mastra/index.ts",
      );
    }

    const brandHint = sourceBrandName
      ? `The source brand is "${sourceBrandName}". Find every one of their marks, logos, wordmarks and product mentions — downstream code needs all of them located in order to replace them.`
      : "Identify the source brand's marks, logos and wordmarks wherever they appear.";

    const analyses = await Promise.all(
      sourceImages.map(async (url, index) => {
        console.log(`   [${index + 1}/${sourceImages.length}] Reading ${url}`);

        const response = await agent.generate([
          {
            role: "user",
            content: [
              {
                type: "image",
                image: url,
                mimeType: "image/*",
              },
              {
                type: "text",
                text: `Analyze this ad creative's structure.

${brandHint}

Transcribe EVERY piece of text in the image exactly as written — including statistics, badges,
star ratings, review counts, testimonials and small print — and classify each one. Do not skip
marketing claims; they are the elements that most need to be seen.

Return ONLY the JSON object described in your instructions.`,
              },
            ],
          },
        ]);

        if (!response.text) {
          throw new Error(`Vision agent returned an empty response for ${url}`);
        }

        // Strip markdown fences if the model added them
        const jsonMatch = response.text.match(
          /```(?:json)?\s*(\{[\s\S]*\})\s*```/,
        );
        const jsonText = jsonMatch ? jsonMatch[1] : response.text.trim();

        try {
          const parsed = JSON.parse(jsonText);
          const analysis = sourceAnalysisSchema.parse({
            ...parsed,
            sourceUrl: url,
          });
          console.log(
            `   ✓ ${analysis.adArchetype} (${analysis.detectedAspectRatio}), ${analysis.textElements.length} text element(s)`,
          );
          return analysis;
        } catch (error) {
          console.error(`Failed to parse analysis for ${url}:`, response.text);
          throw new Error(
            `Failed to parse source analysis for ${url}: ${error instanceof Error ? error.message : error}`,
          );
        }
      }),
    );

    console.log(`✅ Analyzed ${analyses.length} source creative(s)`);

    return { originalInput: inputData, analyses };
  },
});
