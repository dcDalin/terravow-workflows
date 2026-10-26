import { z } from "zod";
import { PRODUCT_KEYS } from "../brand/products";

export const generateProductCopyInputSchema = z.object({
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
      "Raw product description — what it is, how it works, what's included, who it's for. Optional if productKey is set. Put the store's real returns policy here if you want it reflected in the guarantee section: it will not be invented.",
    ),

  outputDirectory: z
    .string()
    .optional()
    .describe("Custom output directory for the .txt file (optional)"),
});

export type GenerateProductCopyInput = z.infer<
  typeof generateProductCopyInputSchema
>;

export const productCopyOutputSchema = z.object({
  productTitle: z.string(),
  generatedTitle: z.string().describe("Rewritten headline title"),
  generatedDescription: z
    .string()
    .describe("Rich text description ready for Shopify admin"),
  guaranteeTitle: z
    .string()
    .describe("Guarantee/store-policy section headline"),
  guaranteeDescription: z
    .string()
    .describe("Guarantee/store-policy body ready for Shopify admin"),
  filePath: z
    .string()
    .optional()
    .describe("Path to saved .txt file (set by save step)"),
});

export type ProductCopyOutput = z.infer<typeof productCopyOutputSchema>;
