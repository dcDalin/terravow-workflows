import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateHowItWorksInputSchema,
  howItWorksStepSchema,
} from "../../../schemas/how-it-works-types";
import { resolveProduct } from "../../../brand/products";
import { productBlock } from "../../../brand/prompt-blocks";

/**
 * Step 1: Generate how-it-works step content from product info using OpenAI via Mastra agent
 * Produces an array of steps with step label, title, description, and visual theme
 */
export const generateHowItWorksStepsStep = createStep({
  id: "generate-how-it-works-steps",
  description:
    "Use AI to generate step-by-step how-it-works content from product info",
  inputSchema: generateHowItWorksInputSchema,
  outputSchema: z.object({
    originalInput: generateHowItWorksInputSchema,
    steps: z.array(howItWorksStepSchema),
  }),
  execute: async ({ inputData, mastra }) => {
    const product = resolveProduct(inputData);

    console.log(
      `🧠 Generating ${inputData.stepCount} how-it-works steps for "${product.title}"...`,
    );

    const agent = mastra?.getAgent("howItWorksAgent");
    if (!agent) {
      throw new Error(
        "howItWorksAgent not found — ensure it is registered in src/mastra/index.ts",
      );
    }

    const prompt = `Generate exactly ${inputData.stepCount} how-it-works steps for the following product.

${productBlock(product)}

These steps double as instructions someone may need to recall under pressure. Describe the
real sequence of using the product, in the order it actually happens.

STEP 1 IS FIXED: it is always calling emergency services. Do not reorder it, do not soften
it, do not merge it into another step.

Each step must have:
- stepNumber: integer starting at 1
- stepLabel: "Step 1", "Step 2", etc.
- title: 3–6 word action title (e.g. "Call Emergency Services", "Seal The Mask", "Pull In One Motion")
- description: one clear sentence of 8–15 words describing exactly what the person does
- visualTheme: a calm, instructional illustration description — either a clean flat medical
  illustration of the airway and mask placement on a light neutral background, or a realistic
  calm domestic scene (kitchen, living room, car glovebox, a hand reaching for the case).
  NEVER dark cinematic biotech, glowing cells, mitochondria, DNA or molecular renders.
  NEVER a child in visible distress.

Language: "helps dislodge a blockage" — never "removes the object" or "clears the airway".
Invent no numbers: no countdown, no survival rate, no success percentage.

Return ONLY a valid JSON array, no markdown:
[
  {
    "stepNumber": 1,
    "stepLabel": "Step 1",
    "title": "...",
    "description": "...",
    "visualTheme": "..."
  }
]`;

    const response = await agent.generate(prompt);

    if (!response.text) {
      throw new Error("Agent returned empty response");
    }

    // Strip markdown code fences if present
    const jsonMatch = response.text.match(
      /```(?:json)?\s*(\[[\s\S]*?\])\s*```/,
    );
    const jsonText = jsonMatch ? jsonMatch[1] : response.text.trim();

    let steps;
    try {
      const parsed = JSON.parse(jsonText);
      steps = z.array(howItWorksStepSchema).parse(parsed);
    } catch (error) {
      console.error("Failed to parse agent response:", response.text);
      throw new Error(
        `Failed to parse step content: ${error instanceof Error ? error.message : error}`,
      );
    }

    console.log(`✅ Generated ${steps.length} steps`);
    steps.forEach((s) => console.log(`   ${s.stepLabel}: ${s.title}`));

    return { originalInput: inputData, steps };
  },
});
