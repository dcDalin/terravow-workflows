/**
 * What may and may not carry across when an AtlasAir creative is built from the
 * structure of another brand's ad.
 *
 * A competitor ad for this category is dense with things AtlasAir will not say:
 * lives-saved counters, testimonials, medical-endorsement badges, "as seen on"
 * strips. Remixing an ad by "swapping the logo" would inherit all of it and
 * silently undo the honesty policy the rest of this project enforces.
 *
 * So the decision about each element is made HERE, in code, from a
 * classification the vision agent produces. The agent observes; it does not get
 * to decide what survives.
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

export type ElementAction = "keep" | "replace" | "drop";

export interface ElementDecision {
  action: ElementAction;
  /** Shown in the run log and written into the manifest for auditability. */
  reason: string;
}

/**
 * The policy table.
 *
 * `hasRealProof` only ever unlocks social proof — and even then the element is
 * REPLACED with AtlasAir's own Judge.me figures, never carried over from the
 * source. Another brand's reviews are never AtlasAir's reviews.
 */
export function decideElement(
  classification: ElementClassification,
  options: { hasRealProof: boolean },
): ElementDecision {
  switch (classification) {
    case "brand-mark":
      return {
        action: "replace",
        reason:
          "Source brand mark replaced with the AtlasAir logo and the AtlasAir product.",
      };

    case "product-claim":
      // Not carried over even when it sounds generic: a claim that is true of
      // their device is not automatically true of ours (mask counts, age ranges
      // and materials differ per SKU).
      return {
        action: "replace",
        reason:
          "Claim rewritten from the AtlasAir product description — source claims are never assumed true of AtlasAir products.",
      };

    case "statistic":
      return {
        action: "drop",
        reason:
          "AtlasAir publishes no lives-saved, success-rate or units-sold figures, and will not inherit another brand's.",
      };

    case "social-proof":
      return options.hasRealProof
        ? {
            action: "replace",
            reason:
              "Replaced with AtlasAir's real Judge.me rating and verbatim review supplied on this run.",
          }
        : {
            action: "drop",
            reason:
              "No real Judge.me data supplied on this run, so the social-proof element is removed rather than reproduced.",
          };

    case "certification-badge":
      return {
        action: "drop",
        reason:
          "Certifications, endorsements, awards and press marks are never rendered unless genuinely earned. Never inherited.",
      };

    case "urgency":
      return {
        action: "drop",
        reason:
          "AtlasAir runs no countdowns, stock counters or manufactured scarcity.",
      };

    case "competitor-comparison":
      return {
        action: "drop",
        reason:
          "AtlasAir does not run named or implied comparisons against other brands.",
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
    "Their headline, body copy or any verbatim wording",
    "Their logo, wordmark, colours, typefaces or brand styling",
    "Their statistics, reviews, testimonials, badges, endorsements or urgency devices",
    "Any depiction of their product",
  ],
} as const;
