/**
 * How each text element of another brand's ad carries into an AtlasAir remix.
 *
 * The vision agent classifies every text element it finds; this table decides
 * whether the element is kept as generic format wording or rewritten as
 * AtlasAir content. Nothing is copied verbatim from the source brand.
 */

export type ElementClassification =
  /** Their brand name, logo, wordmark, or a product shot of their device. */
  | "brand-mark"
  /** A claim about what the product does or contains. */
  | "product-claim"
  /** Any number presented as evidence: lives saved, success rate, units sold. */
  | "statistic"
  /** Reviews, ratings, star rows, testimonials, quoted customers, UGC framing. */
  | "social-proof"
  /** FDA/CE marks, medical endorsements, awards, "clinically proven", press logos. */
  | "certification-badge"
  /** Countdowns, stock counters, "limited time", discount bursts. */
  | "urgency"
  /** Named or implied comparison against another brand. */
  | "competitor-comparison"
  /** Call to action ("Shop now", "Get yours"). */
  | "cta"
  /** Structural or instructional label: "How it works", "Step 1", "What's included". */
  | "structural-label";

export type ElementAction = "keep" | "replace";

export interface ElementDecision {
  action: ElementAction;
  /** Shown in the run log and written into the manifest. */
  reason: string;
}

/** The decision table. */
export function decideElement(
  classification: ElementClassification,
): ElementDecision {
  switch (classification) {
    case "brand-mark":
      return {
        action: "replace",
        reason:
          "Source brand mark replaced with the AtlasAir logo and the AtlasAir product.",
      };

    case "product-claim":
      // A claim about their device is rewritten from ours: mask counts, age
      // ranges and materials differ per SKU.
      return {
        action: "replace",
        reason: "Claim rewritten from the AtlasAir product description.",
      };

    case "statistic":
      return {
        action: "replace",
        reason: "Statistic rewritten as the AtlasAir equivalent.",
      };

    case "social-proof":
      return {
        action: "replace",
        reason:
          "Social proof rewritten for AtlasAir, using the Judge.me data supplied on this run when there is any.",
      };

    case "certification-badge":
      return {
        action: "replace",
        reason: "Badge rewritten as the AtlasAir equivalent.",
      };

    case "urgency":
      return {
        action: "replace",
        reason: "Offer or urgency line rewritten as the AtlasAir equivalent.",
      };

    case "competitor-comparison":
      return {
        action: "replace",
        reason: "Comparison rewritten with AtlasAir as the brand that wins.",
      };

    case "cta":
      return {
        action: "replace",
        reason: "Call to action replaced with the AtlasAir CTA for this run.",
      };

    case "structural-label":
      return {
        action: "keep",
        reason:
          "Generic structural wording (e.g. 'How it works', 'Step 1') — not brand-specific.",
      };
  }
}

export const ALL_CLASSIFICATIONS: ElementClassification[] = [
  "brand-mark",
  "product-claim",
  "statistic",
  "social-proof",
  "certification-badge",
  "urgency",
  "competitor-comparison",
  "cta",
  "structural-label",
];

/**
 * What the remix takes from the source, stated once so it can be quoted into
 * prompts and into the manifest.
 *
 * The remix reproduces LAYOUT and FORMAT — where a headline sits relative to a
 * product, how a benefit row is arranged. It does not reproduce the source's
 * photography, illustration, artwork or copy, all of which are regenerated from
 * AtlasAir's own assets and words.
 */
export const REMIX_SCOPE = {
  takes: [
    "Composition and layout: what sits where, and at what relative size",
    "Format and ad archetype: the kind of ad it is",
    "Reading order and visual hierarchy",
    "Aspect ratio",
  ],
  neverTakes: [
    "Their photography, illustration or artwork — every visual is regenerated from AtlasAir reference images",
    "Their headline, body copy or any verbatim wording, including statistics, reviews and badges, which are rewritten for AtlasAir",
    "Their logo, wordmark, colours, typefaces or brand styling",
    "Any depiction of their product",
  ],
} as const;
