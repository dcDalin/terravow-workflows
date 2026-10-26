import { z } from "zod";
import { PRODUCT_KEYS } from "../brand/products";

export const generateFaqsInputSchema = z.object({
  productKey: z
    .enum(PRODUCT_KEYS)
    .optional()
    .describe(
      'AtlasAir catalogue product — fills in title and description automatically. One of: "atlasair-2", "atlasair-plus", "first-aid-kit", "cpr-course".',
    ),

  productTitle: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'Product name (e.g., "AtlasAir 2.0"). Optional if productKey is set; overrides the preset when both are given.',
    ),

  productDescription: z
    .string()
    .min(10)
    .max(10000)
    .optional()
    .describe(
      "Detailed product description highlighting features and benefits. Optional if productKey is set.",
    ),

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
  filePath: z
    .string()
    .optional()
    .describe("Path to saved .txt file (set by save step)"),
});

export type FaqsOutput = z.infer<typeof faqsOutputSchema>;
