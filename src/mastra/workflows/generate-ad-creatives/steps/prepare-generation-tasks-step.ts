import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
  generationTaskSchema,
  processedImageRefSchema,
} from "../../../schemas/ad-creatives-types";
import { getCreativeForPrompt } from "../../../utils/prompt-creative-mapping";
import { filterTemplates } from "../../../brand/template-policy";

/**
 * Step 3: Select templates and create generation task list
 */
export const prepareGenerationTasksStep = createStep({
  id: "prepare-generation-tasks",
  description: "Select templates and create generation task list",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
    tasks: z.array(generationTaskSchema),
  }),
  execute: async ({ inputData }) => {
    console.log("📋 Preparing generation tasks...");

    const { originalInput, analysis } = inputData;

    // Real Judge.me data decides whether review-dependent templates are usable.
    // A rating alone is enough for a star row; a quote is needed for testimonials.
    const proof = originalInput.socialProof;
    const hasRealProof = Boolean(
      proof &&
      (proof.ratingValue !== undefined ||
        proof.reviewCount !== undefined ||
        proof.quotes?.length),
    );

    // Determine final template IDs
    let finalTemplateIds: number[];

    if (
      originalInput.templateSelectionMode === "manual" &&
      originalInput.templateIds?.length
    ) {
      // User-specified templates. Brand policy is enforced in strict mode: an
      // explicitly requested blocked template throws rather than disappearing,
      // because silently ignoring a direct instruction hides the policy.
      const filtered = filterTemplates(originalInput.templateIds, {
        hasRealProof,
        strict: true,
      });

      if (filtered.droppedForMissingProof.length) {
        console.warn(
          `⚠️  Skipping template(s) ${filtered.droppedForMissingProof.join(", ")} — they render a review, rating or before/after result, and no real Judge.me data was supplied. Pass "socialProof" to enable them.`,
        );
      }

      finalTemplateIds = filtered.allowed;
      console.log(
        `Using ${finalTemplateIds.length} manually selected templates`,
      );
    } else {
      // AI-selected templates (sorted by priority), then filtered by policy.
      const count = originalInput.aiSelectTemplateCount || 5;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const recommended = analysis.recommendedTemplates
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .map((t) => t.templateId);

      const filtered = filterTemplates(recommended, { hasRealProof });

      if (filtered.droppedByPolicy.length) {
        console.warn(
          `⚠️  Dropped recommended template(s) ${filtered.droppedByPolicy.join(", ")} — blocked by AtlasAir brand policy.`,
        );
      }
      if (filtered.droppedForMissingProof.length) {
        console.warn(
          `⚠️  Dropped recommended template(s) ${filtered.droppedForMissingProof.join(", ")} — no real Judge.me review data supplied.`,
        );
      }

      // Slice AFTER filtering so a policy drop doesn't silently shrink the batch
      // below the requested count when other valid recommendations are available.
      finalTemplateIds = filtered.allowed.slice(0, count);
      console.log(
        `AI selected ${finalTemplateIds.length} templates (from ${analysis.recommendedTemplates.length} recommendations, ${filtered.allowed.length} permitted)`,
      );
    }

    if (finalTemplateIds.length === 0) {
      throw new Error(
        'No templates remain after applying AtlasAir brand policy. Every selected template was either blocked, or requires real Judge.me review data that was not supplied — pass a "socialProof" object, or choose product/educational templates instead.',
      );
    }

    // Create tasks for each template × variations
    const tasks: z.infer<typeof generationTaskSchema>[] = [];
    for (const templateId of finalTemplateIds) {
      const templateInfo = getCreativeForPrompt(templateId);
      if (!templateInfo) {
        console.warn(`Template ${templateId} not found, skipping`);
        continue;
      }

      for (let i = 1; i <= originalInput.creativesPerTemplate; i++) {
        tasks.push({
          templateId,
          templateName: templateInfo.prompt.name,
          variationNumber: i,
          aspectRatio: templateInfo.prompt.aspectRatio,
        });
      }
    }

    if (tasks.length === 0) {
      throw new Error("No generation tasks created");
    }

    console.log(`✅ Created ${tasks.length} generation tasks`);

    return {
      originalInput: inputData.originalInput,
      logo: inputData.logo,
      productImages: inputData.productImages,
      analysis: inputData.analysis,
      tasks,
    };
  },
});
