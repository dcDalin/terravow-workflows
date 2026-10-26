import { z } from "zod";
import { PRODUCT_KEYS } from "../brand/products";

// Workflow input
export const generateHowItWorksInputSchema = z.object({
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
      "Detailed product description. The more detail, the better the step content and visuals. Optional if productKey is set.",
    ),

  stepCount: z
    .number()
    .int()
    .min(4)
    .max(8)
    .default(4)
    .describe("Number of how-it-works steps to generate (4–8, default: 4)"),

  aspectRatio: z
    .enum(["1:1", "9:16", "4:5"])
    .default("1:1")
    .describe('Image aspect ratio (default: "1:1")'),

  imageSize: z
    .enum(["512", "1K", "2K", "4K"])
    .default("2K")
    .describe('Image resolution (default: "2K")'),

  outputDirectory: z
    .string()
    .optional()
    .describe("Custom output directory (optional)"),

  storageDestination: z
    .enum(["supabase", "local"])
    .default("supabase")
    .describe(
      'Where to save generated files: "supabase" = upload to Supabase Storage, "local" = save to disk',
    ),
});

export type GenerateHowItWorksInput = z.infer<
  typeof generateHowItWorksInputSchema
>;

// A single generated step
export const howItWorksStepSchema = z.object({
  stepNumber: z.number().int(),
  stepLabel: z.string().describe('e.g. "Step 1"'),
  title: z
    .string()
    .describe(
      'Short action title, e.g. "Call Emergency Services", "Pull In One Motion"',
    ),
  description: z
    .string()
    .describe(
      'One clear sentence describing the action, e.g. "Place the mask over the mouth and nose to form a seal"',
    ),
  visualTheme: z
    .string()
    .describe(
      'Calm instructional illustration description, e.g. "flat medical illustration of mask placement over mouth and nose on a light neutral background"',
    ),
});

export type HowItWorksStep = z.infer<typeof howItWorksStepSchema>;

// Output schema for a single generated image
export const stepImageOutputSchema = z.object({
  stepNumber: z.number(),
  stepLabel: z.string(),
  title: z.string(),
  description: z.string(),
  localPath: z
    .string()
    .describe("File path or public URL where the image was saved"),
  generatedAt: z.string(),
  generationTime: z.number(),
  metadata: z.object({
    productTitle: z.string(),
    modelUsed: z.string(),
    visualTheme: z.string(),
  }),
});

export type StepImageOutput = z.infer<typeof stepImageOutputSchema>;

// Final workflow output
export const howItWorksOutputSchema = z.object({
  success: z.boolean(),
  totalImagesGenerated: z.number(),
  images: z.array(stepImageOutputSchema),
  outputDirectory: z
    .string()
    .describe("Storage path or directory where files were saved"),
  manifestPath: z.string().describe("Path or public URL to manifest.json"),
  summary: z.string(),
});

export type HowItWorksOutput = z.infer<typeof howItWorksOutputSchema>;
