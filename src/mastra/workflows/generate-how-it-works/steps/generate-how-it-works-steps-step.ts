import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import {
  generateHowItWorksInputSchema,
  howItWorksStepSchema,
} from "../../../schemas/how-it-works-types";

/**
 * Step 1: Generate how-it-works step content from product info using Gemini
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
  execute: async ({ inputData }) => {
    console.log(
      `🧠 Generating ${inputData.stepCount} how-it-works steps for "${inputData.productTitle}"...`,
    );

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error(
        "GOOGLE_API_KEY environment variable is not set. Please add it to your .env file.",
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const prompt = `You are a scientific copywriter creating content for a pharmaceutical-style "How It Works" illustration series.

PRODUCT: ${inputData.productTitle}
DESCRIPTION: ${inputData.productDescription}

Generate exactly ${inputData.stepCount} sequential steps showing how this product works at a biological or cellular level, like those premium medicine or supplement ads that show organs, cells, molecules, etc.

Each step must have:
- stepNumber: integer starting at 1
- stepLabel: "Step 1", "Step 2", etc.
- title: short, powerful 3–6 word headline (e.g. "Reactivates Cellular Energy", "Restores Radiance & Vitality")
- description: one brief sentence of 8–15 words (e.g. "Cells grow with renewed energy and youthful balance")
- visualTheme: specific scientific CGI background for the image (e.g. "glowing mitochondria with ATP energy particles on dark teal background", "collagen fiber network with skin cell cross-section on deep navy background", "microbiome bacteria colony in warm amber bioluminescent glow"). Be specific and evocative.

Steps should tell a logical progressive story of the product's mechanism of action.

Return ONLY a valid JSON array with no markdown formatting:
[
  {
    "stepNumber": 1,
    "stepLabel": "Step 1",
    "title": "...",
    "description": "...",
    "visualTheme": "..."
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: prompt }],
    });

    const rawText =
      response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.text,
      )?.text;

    if (!rawText) {
      throw new Error("Empty response from Gemini when generating step content");
    }

    // Strip markdown code fences if present
    const jsonMatch = rawText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : rawText.trim();

    let steps;
    try {
      const parsed = JSON.parse(jsonText);
      steps = z.array(howItWorksStepSchema).parse(parsed);
    } catch (error) {
      console.error("Failed to parse step content. Raw response:", rawText);
      throw new Error(
        `Failed to parse step content: ${error instanceof Error ? error.message : error}`,
      );
    }

    console.log(`✅ Generated ${steps.length} steps`);
    steps.forEach((s) => console.log(`   ${s.stepLabel}: ${s.title}`));

    return { originalInput: inputData, steps };
  },
});
