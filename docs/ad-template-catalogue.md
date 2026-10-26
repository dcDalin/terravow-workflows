# Ad template catalogue

The 40 layout templates `generate-ad-creatives` can render, and what AtlasAir brand policy allows.
Use the IDs with `"templateSelectionMode": "manual"` and `"templateIds": [...]`.

<!--
  Generated from src/mastra/utils/prompt-creative-mapping.ts (PROMPT_CREATIVE_MAPPINGS) and
  src/mastra/brand/template-policy.ts. If either file changes, regenerate this table rather than
  editing it by hand. See "Keeping this page current" below.
-->

**Status meanings**

| Status                       | What it means                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Allowed**                  | Can be chosen by the AI or by you                                                                                                                                                                                                                                                                      |
| **Needs real Judge.me data** | The layout is built around a rating, review or testimonial. It runs only when `socialProof` is supplied, and is skipped with a warning otherwise                                                                                                                                                       |
| **Blocked**                  | Its premise is deceptive: faux press, faux comments or posts, invented people presented as real users (UGC/native formats), bait-and-switch, offer bursts. It is hidden from the AI, and asking for it manually **throws**. The reasons are in [Brand and policy](brand-and-policy.md#template-policy) |
| **Off-category**             | Meaningless for this catalogue (a "tastes like" flavour ad). Treated like blocked                                                                                                                                                                                                                      |

Without Judge.me data, 20 templates are usable. With it, 28 are.

The **reference image** in each row shows what the layout looks like. It is a sample for people
browsing templates and is **not** sent to the image model, which only sees your logo, your product
photos and the template's text prompt.

|  ID | Template                                                | Category         | Aspect | Status                   | Reference image                                                                                                                                   |
| --: | ------------------------------------------------------- | ---------------- | :----: | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Headline                                                | Text Rendering   |  4:5   | Allowed                  | [headline.webp](../src/mastra/assets/AdCreatives/headline.webp)                                                                                   |
|   2 | Offer/Promotion                                         | Promotional      |  9:16  | Allowed                  | [offer-promotion.webp](../src/mastra/assets/AdCreatives/offer-promotion.webp)                                                                     |
|   3 | Testimonials                                            | Social Proof     |  9:16  | Needs real Judge.me data | [testimonials.webp](../src/mastra/assets/AdCreatives/testimonials.webp)                                                                           |
|   4 | Features/Benefits Point-Out                             | Educational      |  4:5   | Allowed                  | [features-benefits-point-out.webp](../src/mastra/assets/AdCreatives/features-benefits-point-out.webp)                                             |
|   5 | Bullet-Points                                           | Educational      |  4:5   | Allowed                  | [bullet-points.webp](../src/mastra/assets/AdCreatives/bullet-points.webp)                                                                         |
|   6 | Social Proof                                            | Trust Building   |  4:5   | Needs real Judge.me data | [social-proof.webp](../src/mastra/assets/AdCreatives/social-proof.webp)                                                                           |
|   7 | Us vs Them                                              | Comparison       |  4:5   | Allowed                  | [us-vs-them.webp](../src/mastra/assets/AdCreatives/us-vs-them.webp)                                                                               |
|   8 | Before & After (UGC Native)                             | UGC              |  9:16  | Blocked                  | [before-and-after-ugc-native.webp](../src/mastra/assets/AdCreatives/before-and-after-ugc-native.webp)                                             |
|   9 | Negative Marketing (Bait & Switch)                      | Hook             |  4:5   | Blocked                  | [negative-marketing-bait-and-switch.webp](../src/mastra/assets/AdCreatives/negative-marketing-bait-and-switch.webp)                               |
|  10 | Press/Editorial                                         | Authority        |  4:5   | Blocked                  | [press-editorial.webp](../src/mastra/assets/AdCreatives/press-editorial.webp)                                                                     |
|  11 | Pull-Quote Review Card                                  | Social Proof     |  1:1   | Needs real Judge.me data | [pull-quote-review-card.webp](../src/mastra/assets/AdCreatives/pull-quote-review-card.webp)                                                       |
|  12 | Lifestyle Action + Product Colorway Array               | Lifestyle        |  1:1   | Allowed                  | [lifestyle-action-product-colorway-array.webp](../src/mastra/assets/AdCreatives/lifestyle-action-product-colorway-array.webp)                     |
|  13 | Stat Surround / Callout Radial (Product Hero)           | Data-Driven      |  1:1   | Allowed                  | [stat-surround-callout-radial-product-hero.webp](../src/mastra/assets/AdCreatives/stat-surround-callout-radial-product-hero.webp)                 |
|  14 | Bundle Showcase + Benefit Bar                           | Product Showcase |  1:1   | Allowed                  | [bundle-showcase-benefit-bar.webp](../src/mastra/assets/AdCreatives/bundle-showcase-benefit-bar.webp)                                             |
|  15 | Social Comment Screenshot + Product                     | Social Proof     |  1:1   | Blocked                  | [social-comment-screenshot-product.webp](../src/mastra/assets/AdCreatives/social-comment-screenshot-product.webp)                                 |
|  16 | Curiosity Gap / Hook Quote Testimonial                  | Hook             |  1:1   | Needs real Judge.me data | [curiosity-gap-hook-quote-testimonial.webp](../src/mastra/assets/AdCreatives/curiosity-gap-hook-quote-testimonial.webp)                           |
|  17 | Verified Review Card                                    | Social Proof     |  1:1   | Needs real Judge.me data | [verified-review-card.webp](../src/mastra/assets/AdCreatives/verified-review-card.webp)                                                           |
|  18 | Stat Surround / Callout Radial (Lifestyle Flatlay)      | Data-Driven      |  1:1   | Allowed                  | [stat-surround-callout-radial-lifestyle-flatlay.webp](../src/mastra/assets/AdCreatives/stat-surround-callout-radial-lifestyle-flatlay.webp)       |
|  19 | Highlighted / Annotated Testimonial                     | Social Proof     |  1:1   | Needs real Judge.me data | [highlighted-annotated-testimonial.webp](../src/mastra/assets/AdCreatives/highlighted-annotated-testimonial.webp)                                 |
|  20 | Advertorial / Editorial Content Card                    | Native           |  4:5   | Blocked                  | [advertorial-editorial-content-card.webp](../src/mastra/assets/AdCreatives/advertorial-editorial-content-card.webp)                               |
|  21 | Bold Statement / Reaction Headline                      | Brand Energy     |  1:1   | Allowed                  | [bold-statement-reaction-headline.webp](../src/mastra/assets/AdCreatives/bold-statement-reaction-headline.webp)                                   |
|  22 | Flavor Story / "Tastes Like"                            | Product Appeal   |  1:1   | Off-category             | [flavor-story-tastes-like.webp](../src/mastra/assets/AdCreatives/flavor-story-tastes-like.webp)                                                   |
|  23 | Long-Form Manifesto / Letter Ad                         | Copy-Driven      |  1:1   | Allowed                  | [long-form-manifesto-letter-ad.webp](../src/mastra/assets/AdCreatives/long-form-manifesto-letter-ad.webp)                                         |
|  24 | Product + Comment Callout (Faux Social Proof)           | Social Proof     |  1:1   | Blocked                  | [product-comment-callout-faux-social-proof.webp](../src/mastra/assets/AdCreatives/product-comment-callout-faux-social-proof.webp)                 |
|  25 | Us vs. Them Color Split                                 | Comparison       |  1:1   | Allowed                  | [us-vs-them-color-split.webp](../src/mastra/assets/AdCreatives/us-vs-them-color-split.webp)                                                       |
|  26 | Stat Callout (Data-Driven Lifestyle)                    | Data-Driven      |  4:5   | Allowed                  | [stat-callout-data-driven-lifestyle.webp](../src/mastra/assets/AdCreatives/stat-callout-data-driven-lifestyle.webp)                               |
|  27 | Benefit Checklist Showcase (Split Product + Info)       | Product Showcase |  1:1   | Allowed                  | [benefit-checklist-showcase-split-product-info.webp](../src/mastra/assets/AdCreatives/benefit-checklist-showcase-split-product-info.webp)         |
|  28 | Feature Arrow Callout / Product Annotation              | Educational      |  1:1   | Allowed                  | [feature-arrow-callout-product-annotation.webp](../src/mastra/assets/AdCreatives/feature-arrow-callout-product-annotation.webp)                   |
|  29 | UGC + Viral Post Overlay                                | UGC              |  9:16  | Blocked                  | [ugc-viral-post-overlay.webp](../src/mastra/assets/AdCreatives/ugc-viral-post-overlay.webp)                                                       |
|  30 | Hero Statement + Icon Benefit Bar                       | Product Hero     |  1:1   | Allowed                  | [hero-statement-icon-benefit-bar.webp](../src/mastra/assets/AdCreatives/hero-statement-icon-benefit-bar.webp)                                     |
|  31 | Comparison Grid / Table                                 | Comparison       |  1:1   | Allowed                  | [comparison-grid-table.webp](../src/mastra/assets/AdCreatives/comparison-grid-table.webp)                                                         |
|  32 | UGC Story Callout / Text Bubble Explainer               | UGC              |  9:16  | Blocked                  | [ugc-story-callout-text-bubble-explainer.webp](../src/mastra/assets/AdCreatives/ugc-story-callout-text-bubble-explainer.webp)                     |
|  33 | Faux Press / News Articles Screenshot                   | Authority        |  4:5   | Blocked                  | [faux-press-news-articles-screenshot.webp](../src/mastra/assets/AdCreatives/faux-press-news-articles-screenshot.webp)                             |
|  34 | Faux iPhone Notes / App Screenshot                      | Native           |  1:1   | Blocked                  | [faux-iphone-notes-app-screenshot.webp](../src/mastra/assets/AdCreatives/faux-iphone-notes-app-screenshot.webp)                                   |
|  35 | Hero Product Showcase + Stat Bar                        | Product Hero     |  1:1   | Allowed                  | [hero-product-showcase-stat-bar.webp](../src/mastra/assets/AdCreatives/hero-product-showcase-stat-bar.webp)                                       |
|  36 | Whiteboard Before / After + Product Hold                | Educational      |  4:5   | Allowed                  | [whiteboard-before-after-product-hold.webp](../src/mastra/assets/AdCreatives/whiteboard-before-after-product-hold.webp)                           |
|  37 | Hero Statement + Icon Bar + Offer Burst (Promo Variant) | Promotional      |  1:1   | Blocked                  | [hero-statement-icon-bar-offer-burst-promo-variant.webp](../src/mastra/assets/AdCreatives/hero-statement-icon-bar-offer-burst-promo-variant.webp) |
|  38 | UGC Lifestyle + Product + Review Card (Split)           | UGC              |  4:5   | Needs real Judge.me data | [ugc-lifestyle-product-review-card-split.webp](../src/mastra/assets/AdCreatives/ugc-lifestyle-product-review-card-split.webp)                     |
|  39 | Curiosity Gap + Scroll-Stopper Hook                     | Hook             |  1:1   | Allowed                  | [curiosity-gap-scroll-stopper-hook.webp](../src/mastra/assets/AdCreatives/curiosity-gap-scroll-stopper-hook.webp)                                 |
|  40 | Native / Ugly Post-It Note Style (Product Hero)         | Native           |  4:5   | Needs real Judge.me data | [native-ugly-post-it-note-style-product-hero.webp](../src/mastra/assets/AdCreatives/native-ugly-post-it-note-style-product-hero.webp)             |

## Use with care

Every truth-bearing placeholder is filled from real input or left empty, so no template asks the
model to invent numbers, prices, offers, reviews, endorsements or competitor claims. That covers:

- stat slots, which carry product features instead
- comparisons, which are against "being unprepared"
- before/after, which shows preparation, not a result
- review slots, which take the verbatim Judge.me quote or nothing

The layouts were written for other brands, though, and some still need a careful eye (see
[Known issues](known-issues.md#some-templates-were-written-for-other-brands)):

| Template           | What to check                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------- |
| 13, 18, 25, 27, 35 | Prop and scene slots whose examples are food. Make sure no food ends up around the device |
| 14                 | Shows several products in a gift box                                                      |
| 11, 16, 17, 38     | Star graphics always show five stars, whatever the real rating                            |

## Keeping this page current

The table is generated by a short script that imports `PROMPT_CREATIVE_MAPPINGS` and the policy
helpers (`isBlocked`, `isOffCategory`, `requiresRealProof`). Node 22.18+ runs TypeScript directly, so
no build step is needed:

```js
// Save as catalogue.mts in the repo root (don't commit it), then run `node catalogue.mts`.
import { PROMPT_CREATIVE_MAPPINGS } from "./src/mastra/utils/prompt-creative-mapping.ts";
import * as policy from "./src/mastra/brand/template-policy.ts";

const status = (id) =>
  policy.isBlocked(id)
    ? "Blocked"
    : policy.isOffCategory(id)
      ? "Off-category"
      : policy.requiresRealProof(id)
        ? "Needs real Judge.me data"
        : "Allowed";

for (const { prompt: p, creative: c } of PROMPT_CREATIVE_MAPPINGS) {
  console.log(
    `| ${p.id} | ${p.name} | ${p.category} | ${p.aspectRatio} | ${status(p.id)} | [${c.fileName}](../src/mastra/assets/AdCreatives/${c.fileName}) |`,
  );
}
```
