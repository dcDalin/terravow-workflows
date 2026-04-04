import { z } from "zod";

export const generateFaqsInputSchema = z.object({
  productTitle: z
    .string()
    .min(1)
    .max(100)
    .describe('Product name (e.g., "CellRevive Serum", "GutBalance Pro")'),

  productDescription: z
    .string()
    .min(10)
    .max(10000)
    .describe("Detailed product description highlighting features and benefits"),

  faqCount: z
    .number()
    .int()
    .min(3)
    .max(20)
    .default(8)
    .describe("Number of FAQs to generate (3–20, default: 8)"),

  outputDirectory: z
    .string()
    .optional()
    .describe("Custom output directory for the .txt file (optional)"),
});

export type GenerateFaqsInput = z.infer<typeof generateFaqsInputSchema>;

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export type FaqItem = z.infer<typeof faqItemSchema>;

export const faqsOutputSchema = z.object({
  productTitle: z.string(),
  faqs: z.array(faqItemSchema),
  totalFaqs: z.number(),
  filePath: z.string().optional().describe("Path to saved .txt file (set by save step)"),
});

export type FaqsOutput = z.infer<typeof faqsOutputSchema>;
