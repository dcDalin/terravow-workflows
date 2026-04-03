import { z } from "zod";

// Workflow input
export const generateHowItWorksInputSchema = z.object({
  productTitle: z
    .string()
    .min(1)
    .max(100)
    .describe('Product name (e.g., "CellRevive Serum", "GutBalance Pro")'),

  productDescription: z
    .string()
    .min(10)
    .max(10000)
    .describe(
      "Detailed product description. The more detail, the better the step content and visuals.",
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
    .describe('Short powerful headline, e.g. "Reactivates Cellular Energy"'),
  description: z
    .string()
    .describe(
      'Brief sentence, e.g. "Cells grow with renewed energy and youthful balance"',
    ),
  visualTheme: z
    .string()
    .describe(
      'Scientific CGI background description, e.g. "mitochondria with glowing ATP particles on dark teal"',
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
