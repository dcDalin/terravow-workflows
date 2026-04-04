import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateFaqsInputSchema,
  faqItemSchema,
} from "../../../schemas/faqs-types";

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
    console.log(
      `💬 Generating ${inputData.faqCount} FAQs for "${inputData.productTitle}"...`,
    );

    const agent = mastra?.getAgent("faqsAgent");
    if (!agent) {
      throw new Error(
        "faqsAgent not found — ensure it is registered in src/mastra/index.ts",
      );
    }

    const prompt = `Generate exactly ${inputData.faqCount} FAQs for the following product.

PRODUCT: ${inputData.productTitle}
DESCRIPTION: ${inputData.productDescription}

Requirements:
- Use the product's short name naturally throughout (derive it from the title)
- Questions must feel specific to this product, not generic
- Cover a mix of: how to use, expected results, ingredients/safety, who it's for, what makes it different, shipping/returns
- Answers should be concise (2–4 sentences), reassuring, and subtly persuasive
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

    const jsonMatch = response.text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
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
      productTitle: inputData.productTitle,
      faqs,
      totalFaqs: faqs.length,
    };
  },
});
