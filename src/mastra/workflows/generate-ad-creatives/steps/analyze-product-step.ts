import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
  processedImageRefSchema,
} from "../../../schemas/ad-creatives-types";
import { resolveProduct } from "../../../brand/products";
import { productBlock } from "../../../brand/prompt-blocks";

/**
 * Step 2: Analyze product and recommend templates using AI
 */
export const analyzeProductStep = createStep({
  id: "analyze-product",
  description: "AI analyzes product and recommends templates",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    processingTime: z.number(),
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    console.log("🤖 Analyzing product...");

    const agent = mastra?.getAgent("productAnalyzerAgent");
    if (!agent) {
      throw new Error("Product analyzer agent not found");
    }

    const { originalInput } = inputData;
    const product = resolveProduct(originalInput);

    // Whether real Judge.me data exists decides if review-dependent templates
    // are worth recommending — they get filtered out downstream otherwise.
    const proof = originalInput.socialProof;
    const hasRealProof = Boolean(
      proof &&
      (proof.ratingValue !== undefined ||
        proof.reviewCount !== undefined ||
        proof.quotes?.length),
    );

    const prompt = `
      Analyze this product and recommend the best ad creative templates:

      ${productBlock(product)}
      ${originalInput.targetAudience ? `Target Audience: ${originalInput.targetAudience}` : ""}
      ${originalInput.brandTone ? `Brand Tone: ${originalInput.brandTone}` : ""}

      REAL SOCIAL PROOF SUPPLIED: ${
        hasRealProof
          ? `YES — ${[
              proof?.ratingValue !== undefined
                ? `rating ${proof.ratingValue}`
                : null,
              proof?.reviewCount !== undefined
                ? `${proof.reviewCount} reviews`
                : null,
              proof?.quotes?.length
                ? `${proof.quotes.length} verbatim review(s)`
                : null,
            ]
              .filter(Boolean)
              .join(
                ", ",
              )} from Judge.me. Review-dependent templates are permitted.`
          : "NO. Do NOT recommend templates that require a review, rating, testimonial or before/after result — they will be rejected. Recommend product, educational and instructional templates instead."
      }

      TASK:
      1. Use the listTemplates tool to see the templates AtlasAir is permitted to generate
      2. Analyze the product thoroughly
      3. Recommend 10-15 templates that best fit this product
      4. Provide clear reasoning for each recommendation
      5. Rank them by priority (high/medium/low)

      keyFeatures and keyMessages are rendered directly onto the images — they must be
      factual statements drawn from the product description above, never invented claims,
      statistics or urgency.

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
