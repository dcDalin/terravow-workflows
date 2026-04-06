import { z } from "zod";

export const generateProductCopyInputSchema = z.object({
  productTitle: z
    .string()
    .min(1)
    .max(100)
    .describe('Product name (e.g., "MagRestore 8-Form Complex", "CellRevive Serum")'),

  productDescription: z
    .string()
    .min(10)
    .max(10000)
    .describe("Raw product description — ingredients, benefits, who it's for, key claims"),

  outputDirectory: z
    .string()
    .optional()
    .describe("Custom output directory for the .txt file (optional)"),
});

export type GenerateProductCopyInput = z.infer<typeof generateProductCopyInputSchema>;

export const productCopyOutputSchema = z.object({
  productTitle: z.string(),
  generatedTitle: z.string().describe("Rewritten headline title"),
  generatedDescription: z.string().describe("Rich text description ready for Shopify admin"),
  guaranteeTitle: z.string().describe("Guarantee/social-proof section headline"),
  guaranteeDescription: z.string().describe("Guarantee/social-proof body ready for Shopify admin"),
  filePath: z.string().optional().describe("Path to saved .txt file (set by save step)"),
});

export type ProductCopyOutput = z.infer<typeof productCopyOutputSchema>;
