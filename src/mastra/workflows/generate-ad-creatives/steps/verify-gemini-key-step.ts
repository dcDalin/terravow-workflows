import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
  customizedPromptSchema,
  processedImageRefSchema,
} from "../../../schemas/ad-creatives-types";
import { GoogleGenAI } from "@google/genai";

/**
 * Step: Verify Gemini API Key
 * Checks that GOOGLE_API_KEY exists and is valid before attempting image generation
 */
export const verifyGeminiKeyStep = createStep({
  id: "verify-gemini-key",
  description: "Verify GOOGLE_API_KEY exists and is valid",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
    customizedPrompts: z.array(customizedPromptSchema),
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
    customizedPrompts: z.array(customizedPromptSchema),
    verified: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    console.log("🔐 Verifying Gemini API key...");

    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error(
        "GOOGLE_API_KEY environment variable is not set. Please add it to your .env file."
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    // Basic format check
    if (apiKey.length < 20) {
      throw new Error(
        "GOOGLE_API_KEY appears to be invalid (too short). Please check your .env file."
      );
    }

    // Test the API key by listing models (lightweight API call)
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      // Try to list models to verify key is valid
      await ai.models.list();

      console.log("✅ Gemini API key verified successfully");
    } catch (error) {
      console.error("❌ Gemini API key verification failed:", error);
      throw new Error(
        `Invalid GOOGLE_API_KEY: ${error instanceof Error ? error.message : "Unknown error"}. Please check your API key in the .env file.`
      );
    }

    // Pass through all data
    return {
      ...inputData,
      verified: true,
    };
  },
});
