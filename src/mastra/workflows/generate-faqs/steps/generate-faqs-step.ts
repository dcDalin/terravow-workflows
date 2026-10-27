import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateFaqsInputSchema,
  faqItemSchema,
} from "../../../schemas/faqs-types";
import { resolveProduct } from "../../../brand/products";
import { productBlock } from "../../../brand/prompt-blocks";

/**
 * Step: Generate product-specific FAQs using OpenAI via Mastra agent
 */
export const generateFaqsStep = createStep({
  id: "generate-faqs",
  description: "Generate product-specific FAQs using AI",
  inputSchema: generateFaqsInputSchema,
  outputSchema: z.object({
    originalInput: generateFaqsInputSchema,
    productTitle: z.string(),
    faqs: z.array(faqItemSchema),
    totalFaqs: z.number(),
  }),
  execute: async ({ inputData, mastra }) => {
    const product = resolveProduct(inputData);

    console.log(
      `💬 Generating ${inputData.faqCount} FAQs for "${product.title}"...`,
    );

    const agent = mastra?.getAgent("faqsAgent");
    if (!agent) {
      throw new Error(
        "faqsAgent not found — ensure it is registered in src/mastra/index.ts",
      );
    }

    const prompt = `Generate exactly ${inputData.faqCount} FAQs for the following product.

${productBlock(product)}

Requirements:
- Use the product's short name naturally throughout
- Questions must feel specific to this product, not generic
- Cover the question mix from your instructions for a ${product.type === "digital" ? "DIGITAL product — access, lifetime use, what the certificate is and is not, refunds. Do NOT mention shipping or delivery" : "physical product — how it works, mask sizing by age, cleaning and reuse, materials, storage, shipping and returns"}
- One FAQ must state plainly that this is an airway-clearance aid, not a substitute for professional medical care, and that emergency services should be called first
- Answers are 2–4 sentences, plain language, accurate
- Write in second person

Return ONLY a valid JSON array:
[
  {
    "question": "...",
    "answer": "..."
  }
]`;

    const response = await agent.generate(prompt);

    if (!response.text) {
      throw new Error("Agent returned empty response");
    }

    const jsonMatch = response.text.match(
      /```(?:json)?\s*(\[[\s\S]*?\])\s*```/,
    );
    const jsonText = jsonMatch ? jsonMatch[1] : response.text.trim();

    let faqs;
    try {
      const parsed = JSON.parse(jsonText);
      faqs = z.array(faqItemSchema).parse(parsed);
    } catch (error) {
      console.error("Failed to parse agent response:", response.text);
      throw new Error(
        `Failed to parse FAQs: ${error instanceof Error ? error.message : error}`,
      );
    }

    console.log(`✅ Generated ${faqs.length} FAQs`);

    return {
      originalInput: inputData,
      productTitle: product.title,
      faqs,
      totalFaqs: faqs.length,
    };
  },
});
