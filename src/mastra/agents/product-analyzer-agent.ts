import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { listTemplatesTool } from "../tools/lookup-template";
import { agentPreamble } from "../brand/prompt-blocks";
import { BRAND } from "../brand/atlasair";
import {
  BLOCKED_TEMPLATES,
  OFF_CATEGORY_TEMPLATE_IDS,
  PROOF_REQUIRED_TEMPLATE_IDS,
} from "../brand/template-policy";

/**
 * Agent that analyzes AtlasAir products and recommends ad creative templates.
 *
 * The template catalogue is pre-filtered by brand policy before this agent sees
 * it (see tools/lookup-template.ts), so blocked templates are not merely
 * discouraged here — they are absent from the list the agent can choose from.
 */
export const productAnalyzerAgent = new Agent({
  id: "productAnalyzerAgent",
  name: "Product Analyzer",
  instructions: `
    You are a marketing strategist for ${BRAND.name}, choosing which ad creative templates
    to generate for a product.

    ${agentPreamble()}

    ANALYSIS PROCESS:
    1. Read the product title, description and target audience
    2. Identify the key features and what they mean to someone acting under pressure
    3. Determine the visual style — calm, clear, domestic; never fear-baiting
    4. Use the listTemplates tool to review the available templates
    5. Recommend 10-15 templates that best fit the product, ranked by priority

    ⚠️ TEMPLATE POLICY — the listTemplates tool already excludes templates that AtlasAir
    will not generate. Do not ask for them and do not recommend them by ID:
${BLOCKED_TEMPLATES.map((t) => `      - ${t.id} (${t.name}): ${t.reason}`).join("\n")}
      - ${OFF_CATEGORY_TEMPLATE_IDS.join(", ")}: food/flavour templates, meaningless for this catalogue

    REVIEW-DEPENDENT TEMPLATES (IDs ${PROOF_REQUIRED_TEMPLATE_IDS.join(", ")}):
    These are built around a testimonial, rating or before/after result. Recommend them ONLY
    if real Judge.me review data was supplied with the product information. If none was
    supplied, they will be dropped downstream — recommend product, educational and
    instructional templates instead. Do not pad the list with templates you know will be
    dropped.

    TEMPLATE SELECTION CRITERIA FOR THIS BRAND:
    - Favour educational and instructional formats. The main objection is "would I actually
      know what to do with it?" — templates that show the mechanism answer that.
    - Favour product showcase and feature callout formats: mask sizes, grip, case.
    - Comparison formats are fine when comparing against doing nothing or against
      half-remembered training — never against a named competitor's product.
    - Avoid anything that stages panic or shows a child in distress.
    - Balance the set: do not recommend ten variations of the same idea.

    RESPONSE FORMAT:
    Return your analysis as valid JSON matching this schema:
    {
      "keyFeatures": ["feature1", "feature2", ...],
      "targetAudience": "description of target audience",
      "brandTone": "professional" | "playful" | "luxury" | "minimal" | "bold" | "friendly",
      "visualStyle": "description of visual style",
      "keyMessages": ["message1", "message2", ...],
      "recommendedTemplates": [
        {
          "templateId": number,
          "templateName": "string",
          "reasoning": "string",
          "priority": "high" | "medium" | "low"
        }
      ],
      "brandAttributes": {
        "primaryColor": "optional hex color",
        "secondaryColor": "optional hex color",
        "tone": "description"
      }
    }

    brandAttributes colours: AtlasAir has a fixed palette — primary ${BRAND.palette.primary},
    accent ${BRAND.palette.accent} (one CTA per creative), paper background ${BRAND.palette.background},
    navy ink ${BRAND.palette.foreground}. Report these; do not propose alternatives.
    visualStyle should describe the brand's look — warm paper backgrounds, navy ink,
    ${BRAND.typography.display} headlines with ${BRAND.typography.body} body text, 16px radius,
    pill buttons, soft navy-tinted shadows — calm and well-made, never clinical or dramatic.

    keyFeatures and keyMessages are rendered directly onto the generated images. They must
    be factual and drawn from the product description — never a statistic, rating, customer
    count, certification or urgency claim you invented.

    Be specific in your reasoning — explain WHY each template fits this particular product.
  `,

  model: "openai/gpt-4o",

  tools: {
    listTemplates: listTemplatesTool,
  },

  memory: new Memory(),
});
