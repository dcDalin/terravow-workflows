import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
} from "../../schemas/ad-creatives-types";

/**
 * Step 2: Analyze product and recommend templates using AI
 */
export const analyzeProductStep = createStep({
  id: "analyze-product",
  description: "AI analyzes product and recommends templates",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: z.object({
      data: z.string(),
      mimeType: z.string(),
      originalSource: z.string(),
      filename: z.string(),
    }),
    productImages: z.array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
        originalSource: z.string(),
        filename: z.string(),
      }),
    ),
    processingTime: z.number(),
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: z.object({
      data: z.string(),
      mimeType: z.string(),
      originalSource: z.string(),
      filename: z.string(),
    }),
    productImages: z.array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
        originalSource: z.string(),
        filename: z.string(),
      }),
    ),
    analysis: productAnalysisSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    console.log("🤖 Analyzing product...");

    const agent = mastra?.getAgent("productAnalyzerAgent");
    if (!agent) {
      throw new Error("Product analyzer agent not found");
    }

    const { originalInput } = inputData;

    const prompt = `
      Analyze this product and recommend the best ad creative templates:

      PRODUCT INFORMATION:
      Title: ${originalInput.productTitle}
      Description: ${originalInput.productDescription}
      ${originalInput.targetAudience ? `Target Audience: ${originalInput.targetAudience}` : ""}
      ${originalInput.brandTone ? `Brand Tone: ${originalInput.brandTone}` : ""}

      TASK:
      1. Use the listTemplates tool to see all 40 available templates
      2. Analyze the product thoroughly
      3. Recommend 10-15 templates that best fit this product
      4. Provide clear reasoning for each recommendation
      5. Rank them by priority (high/medium/low)

      Return your analysis as valid JSON matching the productAnalysisSchema.
      
    `;

    const response = await agent.generate(prompt);

    if (!response.text) {
      throw new Error("Agent returned empty response");
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : response.text;

    let analysisObject;
    try {
      const parsed = JSON.parse(jsonText);
      analysisObject = productAnalysisSchema.parse(parsed);
    } catch (error) {
      console.error("Failed to parse agent response:", error);
      console.error("Response text:", response.text);
      throw new Error(
        `Failed to parse agent response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    console.log(
      `✅ Analysis complete: ${analysisObject.recommendedTemplates.length} templates recommended`,
    );

    return {
      originalInput: inputData.originalInput,
      logo: inputData.logo,
      productImages: inputData.productImages,
      analysis: analysisObject,
    };
  },
});
