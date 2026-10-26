import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  getCreativeForPrompt,
  getAllMappings,
  getPromptsByCategory,
} from "../utils/prompt-creative-mapping";
import {
  getBlockReason,
  isBlocked,
  isOffCategory,
} from "../brand/template-policy";

/**
 * Tool to lookup template information by ID
 */

export const lookupTemplateTool = createTool({
  id: "lookup-template",
  description:
    "Get template information including name, category, aspect ratio, and prompt text",
  inputSchema: z.object({
    templateId: z.number().int().min(1).max(40).describe("Template ID (1-40)"),
  }),
  outputSchema: z.object({
    templateId: z.number(),
    templateName: z.string(),
    category: z.string(),
    aspectRatio: z.string(),
    tags: z.array(z.string()),
    promptText: z.string(),
  }),
  execute: async ({ templateId }) => {
    const mapping = getCreativeForPrompt(templateId);

    if (!mapping) {
      throw new Error(`Template ${templateId} not found. Valid IDs are 1-40.`);
    }

    if (isBlocked(templateId)) {
      throw new Error(
        `Template ${templateId} (${mapping.prompt.name}) is blocked by AtlasAir brand policy: ${getBlockReason(templateId)}`,
      );
    }

    if (isOffCategory(templateId)) {
      throw new Error(
        `Template ${templateId} (${mapping.prompt.name}) is not applicable to the AtlasAir catalogue.`,
      );
    }

    return {
      templateId: mapping.prompt.id,
      templateName: mapping.prompt.name,
      category: mapping.prompt.category,
      aspectRatio: mapping.prompt.aspectRatio,
      tags: mapping.prompt.tags,
      promptText: mapping.prompt.promptText,
    };
  },
});

/**
 * Tool to list all available templates
 */

export const listTemplatesTool = createTool({
  id: "list-templates",
  description:
    "List the ad creative templates AtlasAir is permitted to generate, with their categories. Templates blocked by brand policy (fabricated press, fabricated social proof, manufactured urgency) are excluded and cannot be requested.",
  inputSchema: z.object({
    category: z.string().optional().describe("Filter by category (optional)"),
  }),
  outputSchema: z.object({
    templates: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        category: z.string(),
        aspectRatio: z.string(),
        tags: z.array(z.string()),
      }),
    ),
    availableCategories: z.array(z.string()),
  }),
  execute: async ({ category }) => {
    const mappings = (
      category ? getPromptsByCategory(category) : getAllMappings()
    ).filter(
      // Brand policy is applied here so blocked templates are absent from the
      // agent's choices entirely, rather than merely discouraged in a prompt.
      (m) => !isBlocked(m.prompt.id) && !isOffCategory(m.prompt.id),
    );

    return {
      templates: mappings.map((m) => ({
        id: m.prompt.id,
        name: m.prompt.name,
        category: m.prompt.category,
        aspectRatio: m.prompt.aspectRatio,
        tags: m.prompt.tags,
      })),
      // Categories are derived from the permitted set too, so the agent can't
      // filter by a category that only blocked templates belong to.
      availableCategories: Array.from(
        new Set(
          getAllMappings()
            .filter(
              (m) => !isBlocked(m.prompt.id) && !isOffCategory(m.prompt.id),
            )
            .map((m) => m.prompt.category),
        ),
      ).sort(),
    };
  },
});
