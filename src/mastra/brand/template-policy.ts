/**
 * Which of the 40 ad-creative templates AtlasAir is allowed to generate.
 *
 * The catalogue in utils/prompt-creative-mapping.ts was assembled for a
 * performance-marketing brand with no honesty constraints. Several templates
 * manufacture authority or urgency by design — a faux news screenshot is faux
 * whatever copy you feed it. Those are blocked in code, not just discouraged in
 * a prompt, because a prompt-level rule is one bad generation away from
 * producing a fake press mention for a child-safety product.
 */

export interface BlockedTemplate {
  id: number;
  name: string;
  reason: string;
}

/** Templates whose entire premise is fabrication. Never generated. */
export const BLOCKED_TEMPLATES: BlockedTemplate[] = [
  {
    id: 8,
    name: "Before & After (UGC Native)",
    reason:
      "Presents a staged before/after selfie of an invented person as a real customer's TikTok post. Real Judge.me data can't make the person or the result real.",
  },
  {
    id: 9,
    name: "Negative Marketing (Bait & Switch)",
    reason:
      "Bait-and-switch framing is deceptive by construction, and doubly wrong for a product bought out of fear for a child.",
  },
  {
    id: 10,
    name: "Press/Editorial",
    reason:
      "The layout requires a press quote. AtlasAir has no press coverage to quote, and a brand message set in editorial type reads as third-party endorsement.",
  },
  {
    id: 15,
    name: "Social Comment Screenshot + Product",
    reason:
      "Renders invented social media comments as if they were real posts.",
  },
  {
    id: 20,
    name: "Advertorial / Editorial Content Card",
    reason:
      "Styled as an organic culture-account post with a category tag and social handle, so brand copy reads as independent editorial coverage.",
  },
  {
    id: 24,
    name: "Product + Comment Callout (Faux Social Proof)",
    reason: "Explicitly faux social proof — the template name says so.",
  },
  {
    id: 29,
    name: "UGC + Viral Post Overlay",
    reason:
      "Renders a realistic Reddit/X post from an invented user, with no product or logo, so the opinion reads as organic rather than as AtlasAir's.",
  },
  {
    id: 32,
    name: "UGC Story Callout / Text Bubble Explainer",
    reason:
      "Presents an invented person's Instagram Story, including a first-person result and endorsement, as authentic user content.",
  },
  {
    id: 33,
    name: "Faux Press / News Articles Screenshot",
    reason:
      "Fabricates press coverage and publication mastheads AtlasAir has not earned.",
  },
  {
    id: 34,
    name: "Faux iPhone Notes / App Screenshot",
    reason:
      "Presents invented personal notes as an authentic screenshot to imply organic endorsement.",
  },
  {
    id: 37,
    name: "Hero Statement + Icon Bar + Offer Burst (Promo Variant)",
    reason:
      "Offer-burst layout manufactures urgency; AtlasAir runs no fake urgency or countdown elements.",
  },
];

export const BLOCKED_TEMPLATE_IDS: number[] = BLOCKED_TEMPLATES.map(
  (t) => t.id,
);

/**
 * Not deceptive, just meaningless for this catalogue — a "tastes like" flavour
 * ad for a suction device would be nonsense.
 */
export const OFF_CATEGORY_TEMPLATE_IDS: number[] = [22];

/**
 * Templates built around a review, testimonial, rating or before/after result.
 * Permitted only when real Judge.me data is supplied on the workflow input;
 * otherwise the model would have to invent the quote to fill the layout.
 */
export const PROOF_REQUIRED_TEMPLATE_IDS: number[] = [
  3, 6, 11, 16, 17, 19, 38, 40,
];

export function getBlockReason(templateId: number): string | undefined {
  return BLOCKED_TEMPLATES.find((t) => t.id === templateId)?.reason;
}

export function isBlocked(templateId: number): boolean {
  return BLOCKED_TEMPLATE_IDS.includes(templateId);
}

export function isOffCategory(templateId: number): boolean {
  return OFF_CATEGORY_TEMPLATE_IDS.includes(templateId);
}

export function requiresRealProof(templateId: number): boolean {
  return PROOF_REQUIRED_TEMPLATE_IDS.includes(templateId);
}

export interface TemplateFilterResult {
  allowed: number[];
  /** Dropped because they need real review data that was not supplied. */
  droppedForMissingProof: number[];
  /** Dropped as blocked or off-category (only reachable via AI selection). */
  droppedByPolicy: number[];
}

/**
 * Filter a list of template IDs against brand policy.
 *
 * `strict` is used for manually selected templates: an explicitly requested
 * blocked template throws rather than being silently dropped, because quietly
 * ignoring a direct instruction is its own kind of dishonesty.
 */
export function filterTemplates(
  templateIds: number[],
  options: { hasRealProof: boolean; strict?: boolean },
): TemplateFilterResult {
  const result: TemplateFilterResult = {
    allowed: [],
    droppedForMissingProof: [],
    droppedByPolicy: [],
  };

  for (const id of templateIds) {
    if (isBlocked(id)) {
      if (options.strict) {
        throw new Error(
          `Template ${id} is blocked by AtlasAir brand policy: ${getBlockReason(id)}`,
        );
      }
      result.droppedByPolicy.push(id);
      continue;
    }

    if (isOffCategory(id)) {
      if (options.strict) {
        throw new Error(
          `Template ${id} is not applicable to the AtlasAir catalogue (food/flavour template).`,
        );
      }
      result.droppedByPolicy.push(id);
      continue;
    }

    if (requiresRealProof(id) && !options.hasRealProof) {
      result.droppedForMissingProof.push(id);
      continue;
    }

    result.allowed.push(id);
  }

  return result;
}
