/**
 * The AtlasAir catalogue. Four single-variant products, USD.
 *
 * Workflows accept an optional `productKey` so a run can be started with just
 * `{ "productKey": "atlasair-2" }` instead of retyping the product copy every
 * time. Explicit productTitle/productDescription still win as overrides.
 */

export type ProductType = "device" | "kit" | "digital";

export interface BrandProduct {
  key: ProductKey;
  title: string;
  /** Short name used naturally inside copy, e.g. "How do I clean AtlasAir 2.0?" */
  shortName: string;
  type: ProductType;
  /** The digital course does not ship. Everything else does. */
  ships: boolean;
  currency: "USD";
  singleVariant: true;
  /** Who the product covers, in plain language. */
  ageRange: string;
  summary: string;
  features: string[];
  whatsIncluded: string[];
}

export const PRODUCT_KEYS = [
  "atlasair-2",
  "atlasair-plus",
  "first-aid-kit",
  "cpr-course",
] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export const PRODUCT_CATALOG: Record<ProductKey, BrandProduct> = {
  "atlasair-2": {
    key: "atlasair-2",
    title: "AtlasAir 2.0",
    shortName: "AtlasAir 2.0",
    type: "device",
    ships: true,
    currency: "USD",
    singleVariant: true,
    ageRange: "Infant through adult",
    summary:
      "The flagship anti-choking suction device. A stronger one-motion pull generates suction to help dislodge a blockage, with three interchangeable mask sizes so one device covers the whole household.",
    features: [
      "Stronger one-motion pull — place, pull, no technique to remember",
      "Three mask sizes: infant, child and adult",
      "Ergonomic grip designed to be used under pressure, one-handed",
      "Hard-shell case for storage in a drawer, cupboard or car",
      "Reusable: latex-free, BPA-free, rinses clean and resets",
    ],
    whatsIncluded: [
      "AtlasAir 2.0 device",
      "Infant mask",
      "Child mask",
      "Adult mask",
      "Hard-shell case",
      "Quick-reference instructions",
    ],
  },

  "atlasair-plus": {
    key: "atlasair-plus",
    title: "AtlasAir+",
    shortName: "AtlasAir+",
    type: "device",
    ships: true,
    currency: "USD",
    singleVariant: true,
    ageRange: "Ages 1 to adult",
    summary:
      "The original AtlasAir device. One-motion suction to help dislodge a blockage, with adult and child masks covering ages 1 through adult, in a soft storage case.",
    features: [
      "One-motion pull — the original AtlasAir mechanism",
      "Two mask sizes: adult and child",
      "Covers ages 1 to adult",
      "Soft storage case",
      "Reusable: latex-free, BPA-free, rinses clean and resets",
    ],
    whatsIncluded: [
      "AtlasAir+ device",
      "Adult mask",
      "Child mask",
      "Soft storage case",
      "Quick-reference instructions",
    ],
  },

  "first-aid-kit": {
    key: "first-aid-kit",
    title: "Essential First Aid Kit",
    shortName: "the Essential Kit",
    type: "kit",
    ships: true,
    currency: "USD",
    singleVariant: true,
    ageRange: "Whole household",
    summary:
      "A first aid kit organised so you can find what you need without emptying it. Supplies for cuts, burns and sprains in a water-resistant case sized for home, car or travel.",
    features: [
      "Organised compartments — find the right item without unpacking the kit",
      "Supplies for cuts, burns and sprains",
      "Water-resistant case",
      "Sized for home, car or travel",
    ],
    whatsIncluded: [
      "Water-resistant case with organised compartments",
      "Supplies for cuts, burns and sprains",
    ],
  },

  "cpr-course": {
    key: "cpr-course",
    title: "Emergency CPR + Choking Rescue Course",
    shortName: "the Course",
    type: "digital",
    ships: false,
    currency: "USD",
    singleVariant: true,
    ageRange: "Age-specific protocols for infants, children and adults",
    summary:
      "A digital course covering CPR and choking rescue, with age-specific protocols for infants, children and adults. HD video plus printable material you can keep on the fridge. Lifetime access.",
    features: [
      "HD video library",
      "Printable handbook and quick-reference cards",
      "Age-specific protocols for infants, children and adults",
      "Lifetime access",
      "Certificate on completion",
      "Digital only — nothing ships",
    ],
    whatsIncluded: [
      "HD video library",
      "Printable handbook",
      "Printable quick-reference cards",
      "Certificate on completion",
      "Lifetime access",
    ],
  },
};

/**
 * Input accepted by every workflow: either a catalogue key, or an explicit
 * title + description for something not (yet) in the catalogue.
 */
export interface ProductResolutionInput {
  productKey?: ProductKey;
  productTitle?: string;
  productDescription?: string;
}

export interface ResolvedProduct {
  title: string;
  shortName: string;
  description: string;
  type: ProductType;
  ships: boolean;
  ageRange?: string;
  features: string[];
  whatsIncluded: string[];
}

/**
 * Resolve a workflow input into a full product record.
 *
 * Validation lives here rather than in a zod `.refine()` so the workflow input
 * schemas stay plain `ZodObject`s — several steps wrap them in
 * `z.object({ originalInput: <schema> })` and extend them, which a ZodEffects
 * would complicate.
 */
export function resolveProduct(input: ProductResolutionInput): ResolvedProduct {
  const preset = input.productKey
    ? PRODUCT_CATALOG[input.productKey]
    : undefined;

  if (!preset && !(input.productTitle && input.productDescription)) {
    throw new Error(
      `Provide either "productKey" (one of: ${PRODUCT_KEYS.join(", ")}) or both "productTitle" and "productDescription".`,
    );
  }

  if (input.productKey && !preset) {
    throw new Error(
      `Unknown productKey "${input.productKey}". Valid keys: ${PRODUCT_KEYS.join(", ")}.`,
    );
  }

  if (!preset) {
    // Ad-hoc product — the caller supplied everything we know about it.
    return {
      title: input.productTitle!,
      shortName: input.productTitle!,
      description: input.productDescription!,
      type: "device",
      ships: true,
      features: [],
      whatsIncluded: [],
    };
  }

  // Catalogue product. Explicit fields override the preset.
  const description =
    input.productDescription ??
    [
      preset.summary,
      "",
      "Features:",
      ...preset.features.map((f) => `- ${f}`),
      "",
      "What's included:",
      ...preset.whatsIncluded.map((i) => `- ${i}`),
      "",
      `Covers: ${preset.ageRange}.`,
      preset.ships
        ? "Ships as a physical product."
        : "Digital only — nothing ships.",
    ].join("\n");

  return {
    title: input.productTitle ?? preset.title,
    shortName: preset.shortName,
    description,
    type: preset.type,
    ships: preset.ships,
    ageRange: preset.ageRange,
    features: preset.features,
    whatsIncluded: preset.whatsIncluded,
  };
}
