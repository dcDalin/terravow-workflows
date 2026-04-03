import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
  generationTaskSchema,
  processedImageRefSchema,
} from "../../../schemas/ad-creatives-types";
import { getCreativeForPrompt } from "../../../utils/prompt-creative-mapping";

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

    // Determine final template IDs
    let finalTemplateIds: number[];

    if (
      originalInput.templateSelectionMode === "manual" &&
      originalInput.templateIds?.length
    ) {
      // User-specified templates
      finalTemplateIds = originalInput.templateIds;
      console.log(`Using ${finalTemplateIds.length} manually selected templates`);
    } else {
      // AI-selected templates (sorted by priority)
      const count = originalInput.aiSelectTemplateCount || 5;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      finalTemplateIds = analysis.recommendedTemplates
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, count)
        .map((t) => t.templateId);
      console.log(
        `AI selected ${finalTemplateIds.length} templates (from ${analysis.recommendedTemplates.length} recommendations)`,
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
