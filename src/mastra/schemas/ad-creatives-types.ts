import { z } from "zod";

/**
 * Type definitions for Ad Creative Generation Workflow
 */

// Image input must be a publicly accessible URL
export const imageInputSchema = z
  .url()
  .describe(
    'Publicly accessible image URL (e.g., "https://example.com/logo.png")',
  );

export type ImageInput = z.infer<typeof imageInputSchema>;

// Main workflow input schema
export const generateAdCreativesInputSchema = z.object({
  // ========== PRODUCT INFO ==========
  productTitle: z
    .string()
    .min(1)
    .max(100)
    .describe('Product name (e.g., "EcoBottle Pro", "FitTrack Watch")'),

  productDescription: z
    .string()
    .min(10)
    .max(10000)
    .describe(
      "Detailed product description highlighting key features and benefits",
    ),

  targetAudience: z
    .string()
    .optional()
    .describe(
      'Target demographic (e.g., "fitness enthusiasts 25-40"). Leave empty for AI to determine.',
    ),

  brandTone: z
    .enum(["professional", "playful", "luxury", "minimal", "bold", "friendly"])
    .optional()
    .describe("Brand personality. Leave empty for AI to determine."),

  // ========== ASSETS (URL inputs) ==========
  logo: imageInputSchema.describe(
    'Brand logo as publicly accessible URL (e.g., "https://cdn.example.com/logo.png")',
  ),

  productImages: z
    .array(imageInputSchema)
    .min(1)
    .max(10)
    .describe(
      'Product images (1-10) as publicly accessible URLs (e.g., ["https://cdn.example.com/product1.jpg", "https://cdn.example.com/product2.jpg"])',
    ),

  // ========== BRAND COLORS ==========
  brandColors: z
    .object({
      primary: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .describe('Primary brand color in hex (e.g., "#FF6B35")'),
      secondary: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .describe("Secondary brand color (optional)"),
      accent: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .describe("Accent color (optional)"),
    })
    .optional()
    .describe(
      "Brand color palette. Leave empty for AI to extract from logo/images.",
    ),

  // ========== TEMPLATE SELECTION ==========
  templateSelectionMode: z
    .enum(["manual", "ai"])
    .default("ai")
    .describe(
      'How to choose templates: "manual" = you specify IDs, "ai" = AI recommends best fit',
    ),

  templateIds: z
    .array(z.number().int().min(1).max(40))
    .optional()
    .describe(
      'Template IDs (1-40). Example: [1, 11, 21]. Required if mode is "manual".',
    ),

  aiSelectTemplateCount: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe("If AI selecting, how many templates? (1-20, default: 5)"),

  // ========== GENERATION CONFIG ==========
  creativesPerTemplate: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(1)
    .describe("Variations per template (1-10, default: 1)"),

  // ========== ADVANCED OPTIONS ==========
  imageGenerationModel: z
    .string()
    .optional()
    .describe(
      'Image generation model (e.g., "nano-gpt/gpt-5-pro"). Leave empty for default.',
    ),

  brandWebsite: z
    .string()
    .optional()
    .describe('Brand website URL to display in creatives (e.g., "www.terravow.com")'),

  ctaText: z
    .string()
    .optional()
    .describe('CTA button text (e.g., "SHOP NOW", "GET YOURS TODAY"). Defaults to "SHOP NOW".'),

  reviewCount: z
    .string()
    .optional()
    .describe('Review count for social proof elements (e.g., "10,000+", "50,000+").'),

  outputDirectory: z
    .string()
    .optional()
    .describe("Custom output directory (optional)"),

  storageDestination: z
    .enum(["supabase", "local"])
    .default("supabase")
    .describe(
      'Where to save generated files: "supabase" = upload to Supabase Storage, "local" = save to output directory on disk',
    ),
});

export type GenerateAdCreativesInput = z.infer<
  typeof generateAdCreativesInputSchema
>;

// Product analysis output
export const productAnalysisSchema = z.object({
  keyFeatures: z.array(z.string()).describe("Key product features"),
  targetAudience: z.string().describe("Identified target audience"),
  brandTone: z.string().describe("Brand personality"),
  visualStyle: z.string().describe("Visual style description"),
  keyMessages: z.array(z.string()).describe("Core messaging"),

  recommendedTemplates: z.array(
    z.object({
      templateId: z.number(),
      templateName: z.string(),
      reasoning: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    }),
  ),

  brandAttributes: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    tone: z.string(),
  }),
});

export type ProductAnalysis = z.infer<typeof productAnalysisSchema>;

// Generation task
export const generationTaskSchema = z.object({
  templateId: z.number(),
  templateName: z.string(),
  variationNumber: z.number(),
  aspectRatio: z.enum(["1:1", "4:5", "9:16"]),
});

export type GenerationTask = z.infer<typeof generationTaskSchema>;

// Customized prompt
export const customizedPromptSchema = z.object({
  templateId: z.number(),
  templateName: z.string(),
  variationNumber: z.number(),
  prompt: z.string(),
  aspectRatio: z.string(),
});

export type CustomizedPrompt = z.infer<typeof customizedPromptSchema>;

// Creative output
export const creativeOutputSchema = z.object({
  templateId: z.number(),
  templateName: z.string(),
  variationNumber: z.number(),

  imageUrl: z.string().optional(),
  imageData: z.string().optional(), // base64 if generated
  localPath: z.string().describe("Path or public URL where the image was saved"),

  prompt: z.string(),
  aspectRatio: z.string(),

  generatedAt: z.string(),
  generationTime: z.number(),

  metadata: z.object({
    productTitle: z.string(),
    modelUsed: z.string(),
    templateCategory: z.string(),
  }),
});

export type CreativeOutput = z.infer<typeof creativeOutputSchema>;

// Workflow output
export const workflowOutputSchema = z.object({
  success: z.boolean(),
  totalCreativesGenerated: z.number(),
  creatives: z.array(creativeOutputSchema),
  outputDirectory: z.string().describe("Storage path or directory where files were saved"),
  manifestPath: z.string().describe("Path or public URL to the manifest.json"),
  summary: z.string(),
});

export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
