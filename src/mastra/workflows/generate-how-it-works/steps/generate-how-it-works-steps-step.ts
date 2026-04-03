import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateHowItWorksInputSchema,
  howItWorksStepSchema,
} from "../../../schemas/how-it-works-types";

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
    console.log(
      `🧠 Generating ${inputData.stepCount} how-it-works steps for "${inputData.productTitle}"...`,
    );

    const agent = mastra?.getAgent("howItWorksAgent");
    if (!agent) {
      throw new Error("howItWorksAgent not found — ensure it is registered in src/mastra/index.ts");
    }

    const prompt = `Generate exactly ${inputData.stepCount} how-it-works steps for the following product.

PRODUCT: ${inputData.productTitle}
DESCRIPTION: ${inputData.productDescription}

Steps should show how this product works at a biological or cellular level, like premium medicine or supplement ads showing organs, cells, molecules, etc. Tell a logical progressive story of the product's mechanism of action.

Each step must have:
- stepNumber: integer starting at 1
- stepLabel: "Step 1", "Step 2", etc.
- title: short, powerful 3–6 word headline (e.g. "Reactivates Cellular Energy", "Restores Radiance & Vitality")
- description: one brief sentence of 8–15 words (e.g. "Cells grow with renewed energy and youthful balance")
- visualTheme: specific scientific CGI background for the image (e.g. "glowing mitochondria with ATP energy particles on dark teal background", "collagen fiber network with skin cell cross-section on deep navy background"). Be vivid and specific.

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
    const jsonMatch = response.text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
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
