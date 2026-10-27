import { z } from "zod";
import { PRODUCT_KEYS } from "../brand/products";
import { socialProofSchema } from "./ad-creatives-types";
import { ALL_CLASSIFICATIONS } from "../brand/remix-policy";

/**
 * Type definitions for the Creative Remix workflow.
 *
 * Takes an existing ad from another brand, reads its layout, and rebuilds that
 * layout as an AtlasAir creative using AtlasAir's own logo, product photos,
 * palette and copy.
 */

// Gemini's supported aspect ratios, narrowed to the ones ad creatives use.
export const remixAspectRatioSchema = z.enum([
  "1:1",
  "4:5",
  "9:16",
  "3:4",
  "4:3",
  "16:9",
]);

export const generateRemixInputSchema = z.object({
  // ========== SOURCE ==========
  sourceImages: z
    .array(z.url())
    .min(1)
    .max(10)
    .describe(
      'Publicly accessible URLs of the source ad creatives to remix (1-10), e.g. ["https://cdn.example.com/lifeaid-ad-1.jpg"]',
    ),

  sourceBrandName: z
    .string()
    .optional()
    .describe(
      'Brand the source creatives belong to, e.g. "LifeAid". Naming it helps the analyzer find every mark, logo and mention that must be removed. Their logo is described automatically from the image.',
    ),

  // ========== ATLASAIR PRODUCT ==========
  productKey: z
    .enum(PRODUCT_KEYS)
    .optional()
    .describe(
      'AtlasAir catalogue product to feature. One of: "atlasair-2", "atlasair-plus", "first-aid-kit", "cpr-course".',
    ),

  productTitle: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe("Product name. Optional if productKey is set."),

  productDescription: z
    .string()
    .min(10)
    .max(10000)
    .optional()
    .describe("Product description. Optional if productKey is set."),

  // ========== ATLASAIR ASSETS ==========
  logo: z
    .url()
    .describe(
      "AtlasAir logo as a publicly accessible URL. Replaces the source brand's logo everywhere it appears — in the layout AND on the product itself.",
    ),

  productImages: z
    .array(z.url())
    .min(1)
    .max(10)
    .optional()
    .describe(
      "OPTIONAL. AtlasAir product photos as publicly accessible URLs. Supply these only if the AtlasAir product looks DIFFERENT from the source product — the source product is then replaced with yours. Leave empty when the products are physically the same: the source product's form, angle and lighting are kept, and only its branding is changed to AtlasAir.",
    ),

  // ========== BRANDING ==========
  brandColors: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondary: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      accent: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    })
    .optional()
    .describe(
      "Override the AtlasAir palette for this run. Leave empty to use the brand palette.",
    ),

  brandWebsite: z
    .string()
    .optional()
    .describe(
      "Optional. Only used if the source ad shows a web address — that address is then replaced with this one. Leave empty and no website is added; the remix does not introduce a URL that wasn't in the source.",
    ),

  ctaText: z
    .string()
    .optional()
    .describe(
      "Optional. Overrides the source's call-to-action text if it has one. Leave empty and the source's own CTA wording is kept as-is; if the source has no CTA, none is added.",
    ),

  socialProof: socialProofSchema
    .optional()
    .describe(
      "Optional Judge.me data. When supplied it fills the source's social-proof slots; without it, they are rewritten as AtlasAir equivalents.",
    ),

  // ========== GENERATION ==========
  variationsPerSource: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(1)
    .describe("How many remix variations to generate per source image (1-5)"),

  aspectRatio: remixAspectRatioSchema
    .optional()
    .describe(
      "Force an aspect ratio for all remixes. Leave empty to match each source image.",
    ),

  imageSize: z
    .enum(["512", "1K", "2K", "4K"])
    .default("2K")
    .describe('Image resolution (default: "2K")'),

  layoutFidelity: z
    .enum(["close", "loose"])
    .default("close")
    .describe(
      '"close" follows the source composition closely; "loose" keeps only the ad archetype and rebuilds the layout in AtlasAir\'s own style.',
    ),

  outputDirectory: z
    .string()
    .optional()
    .describe("Custom output directory (optional)"),

  storageDestination: z
    .enum(["supabase", "local"])
    .default("supabase")
    .describe(
      'Where to save: "supabase" = upload to Supabase Storage, "local" = save to disk',
    ),
});

export type GenerateRemixInput = z.infer<typeof generateRemixInputSchema>;

// ========== ANALYSIS ==========

export const sourceTextElementSchema = z.object({
  text: z
    .string()
    .describe(
      "The text as it appears in the source image, transcribed exactly",
    ),
  role: z
    .string()
    .describe(
      'What the element does in the layout, e.g. "headline", "benefit row item", "badge"',
    ),
  position: z
    .string()
    .describe(
      'Where it sits, e.g. "top third, centered", "bottom left over the product"',
    ),
  classification: z
    .enum(ALL_CLASSIFICATIONS as [string, ...string[]])
    .describe("Which policy category this element falls into"),
});

export type SourceTextElement = z.infer<typeof sourceTextElementSchema>;

export const sourceAnalysisSchema = z.object({
  sourceUrl: z.string(),
  adArchetype: z
    .string()
    .describe(
      'The kind of ad, e.g. "benefit checklist with product hero", "before/after split"',
    ),
  detectedAspectRatio: remixAspectRatioSchema.describe(
    "Closest matching aspect ratio of the source image",
  ),
  layout: z
    .string()
    .describe(
      "Structural description: the bands/zones of the composition, top to bottom",
    ),
  visualHierarchy: z
    .string()
    .describe("Reading order — what the eye lands on first, second, third"),
  productDepiction: z
    .string()
    .describe(
      "How the source product is shown: angle, scale, placement, lighting",
    ),
  logoPlacement: z
    .string()
    .describe(
      "Where the source brand's logo sits in the LAYOUT, at what size, and what the mark itself looks like",
    ),
  productBranding: z
    .string()
    .describe(
      "Every brand mark carried ON the product itself — symbols moulded, embossed or printed on the device, wordmarks on the case, text on labels or packaging — each with exact placement, size and orientation. These are the marks that must be swapped when the product is kept rather than replaced.",
    ),
  sourceColorScheme: z
    .string()
    .describe(
      "The source palette — recorded for reference only; it is NOT reproduced",
    ),
  typographyStyle: z
    .string()
    .describe("Type treatment: weights, case, relative sizes, alignment"),
  textElements: z.array(sourceTextElementSchema),
});

export type SourceAnalysis = z.infer<typeof sourceAnalysisSchema>;

// ========== REMIX PLAN ==========

export const elementPlanSchema = z.object({
  sourceText: z.string(),
  role: z.string(),
  classification: z.string(),
  action: z.enum(["keep", "replace"]),
  reason: z.string(),
  replacement: z
    .string()
    .optional()
    .describe(
      "AtlasAir content replacing this element, when action is 'replace'",
    ),
});

export type ElementPlan = z.infer<typeof elementPlanSchema>;

export const remixTaskSchema = z.object({
  sourceUrl: z.string(),
  sourceIndex: z.number(),
  variationNumber: z.number(),
  prompt: z.string(),
  aspectRatio: remixAspectRatioSchema,
  adArchetype: z.string(),
  elementPlan: z.array(elementPlanSchema),
});

export type RemixTask = z.infer<typeof remixTaskSchema>;

// ========== OUTPUT ==========

export const remixOutputSchema = z.object({
  sourceUrl: z.string(),
  sourceIndex: z.number(),
  variationNumber: z.number(),
  adArchetype: z.string(),
  localPath: z
    .string()
    .describe("Path or public URL where the remix was saved"),
  prompt: z.string(),
  aspectRatio: z.string(),
  generatedAt: z.string(),
  generationTime: z.number(),
  /** How each source text element was carried into this remix. */
  elementPlan: z.array(elementPlanSchema),
  metadata: z.object({
    productTitle: z.string(),
    modelUsed: z.string(),
  }),
});

export type RemixOutput = z.infer<typeof remixOutputSchema>;

export const remixWorkflowOutputSchema = z.object({
  success: z.boolean(),
  totalRemixesGenerated: z.number(),
  remixes: z.array(remixOutputSchema),
  outputDirectory: z.string(),
  manifestPath: z.string(),
  summary: z.string(),
});

export type RemixWorkflowOutput = z.infer<typeof remixWorkflowOutputSchema>;
