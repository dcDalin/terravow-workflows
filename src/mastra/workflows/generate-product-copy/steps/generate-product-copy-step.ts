import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { generateProductCopyInputSchema } from "../../../schemas/product-copy-types";
import { resolveProduct } from "../../../brand/products";
import { productBlock } from "../../../brand/prompt-blocks";

const agentResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  guaranteeTitle: z.string(),
  guaranteeDescription: z.string(),
});

export const generateProductCopyStep = createStep({
  id: "generate-product-copy",
  description:
    "Generate story-driven product copy and guarantee section using AI",
  inputSchema: generateProductCopyInputSchema,
  outputSchema: z.object({
    originalInput: generateProductCopyInputSchema,
    productTitle: z.string(),
    generatedTitle: z.string(),
    generatedDescription: z.string(),
    guaranteeTitle: z.string(),
    guaranteeDescription: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const product = resolveProduct(inputData);

    console.log(`✍️  Generating product copy for "${product.title}"...`);

    const agent = mastra?.getAgent("productCopyAgent");
    if (!agent) {
      throw new Error(
        "productCopyAgent not found — ensure it is registered in src/mastra/index.ts",
      );
    }

    const prompt = `Write product copy for the following product.

${productBlock(product)}

Follow all style principles from your instructions exactly. In particular:
- Section C ("HOW IT WORKS") begins with calling emergency services.
- Section G ("WHAT IT IS NOT") is mandatory and must never be omitted.
Return ONLY valid JSON:
{
  "title": "...",
  "description": "...",
  "guaranteeTitle": "...",
  "guaranteeDescription": "..."
}`;

    const response = await agent.generate(prompt);

    if (!response.text) {
      throw new Error("Agent returned empty response");
    }

    // Strip optional JSON fences
    const jsonMatch = response.text.match(
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
    );
    const jsonText = jsonMatch ? jsonMatch[1] : response.text.trim();

    let parsed: z.infer<typeof agentResponseSchema>;
    try {
      parsed = agentResponseSchema.parse(JSON.parse(jsonText));
    } catch (error) {
      console.error("Failed to parse agent response:", response.text);
      throw new Error(
        `Failed to parse product copy: ${error instanceof Error ? error.message : error}`,
      );
    }

    console.log(`✅ Copy generated — title: "${parsed.title.slice(0, 60)}..."`);

    return {
      originalInput: inputData,
      productTitle: product.title,
      generatedTitle: parsed.title,
      generatedDescription: parsed.description,
      guaranteeTitle: parsed.guaranteeTitle,
      guaranteeDescription: parsed.guaranteeDescription,
    };
  },
});
