# Ad template catalogue

The 40 layout templates `generate-ad-creatives` can render. Use the IDs with
`"templateSelectionMode": "manual"` and `"templateIds": [...]`, or let the AI analyst choose. Every
template can run.

<!--
  Generated from src/mastra/utils/prompt-creative-mapping.ts (PROMPT_CREATIVE_MAPPINGS). If it
  changes, regenerate this table rather than editing it by hand. See "Keeping this page current".
-->

The **reference image** in each row shows what the layout looks like. It is a sample for people
browsing templates and is **not** sent to the image model, which only sees your logo, your product
photos and the template's text prompt.

|  ID | Template                                                | Category         | Aspect | Reference image                                                                                                                                   |
| --: | ------------------------------------------------------- | ---------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Headline                                                | Text Rendering   |  4:5   | [headline.webp](../src/mastra/assets/AdCreatives/headline.webp)                                                                                   |
|   2 | Offer/Promotion                                         | Promotional      |  9:16  | [offer-promotion.webp](../src/mastra/assets/AdCreatives/offer-promotion.webp)                                                                     |
|   3 | Testimonials                                            | Social Proof     |  9:16  | [testimonials.webp](../src/mastra/assets/AdCreatives/testimonials.webp)                                                                           |
|   4 | Features/Benefits Point-Out                             | Educational      |  4:5   | [features-benefits-point-out.webp](../src/mastra/assets/AdCreatives/features-benefits-point-out.webp)                                             |
|   5 | Bullet-Points                                           | Educational      |  4:5   | [bullet-points.webp](../src/mastra/assets/AdCreatives/bullet-points.webp)                                                                         |
|   6 | Social Proof                                            | Trust Building   |  4:5   | [social-proof.webp](../src/mastra/assets/AdCreatives/social-proof.webp)                                                                           |
|   7 | Us vs Them                                              | Comparison       |  4:5   | [us-vs-them.webp](../src/mastra/assets/AdCreatives/us-vs-them.webp)                                                                               |
|   8 | Before & After (UGC Native)                             | UGC              |  9:16  | [before-and-after-ugc-native.webp](../src/mastra/assets/AdCreatives/before-and-after-ugc-native.webp)                                             |
|   9 | Negative Marketing (Bait & Switch)                      | Hook             |  4:5   | [negative-marketing-bait-and-switch.webp](../src/mastra/assets/AdCreatives/negative-marketing-bait-and-switch.webp)                               |
|  10 | Press/Editorial                                         | Authority        |  4:5   | [press-editorial.webp](../src/mastra/assets/AdCreatives/press-editorial.webp)                                                                     |
|  11 | Pull-Quote Review Card                                  | Social Proof     |  1:1   | [pull-quote-review-card.webp](../src/mastra/assets/AdCreatives/pull-quote-review-card.webp)                                                       |
|  12 | Lifestyle Action + Product Colorway Array               | Lifestyle        |  1:1   | [lifestyle-action-product-colorway-array.webp](../src/mastra/assets/AdCreatives/lifestyle-action-product-colorway-array.webp)                     |
|  13 | Stat Surround / Callout Radial (Product Hero)           | Data-Driven      |  1:1   | [stat-surround-callout-radial-product-hero.webp](../src/mastra/assets/AdCreatives/stat-surround-callout-radial-product-hero.webp)                 |
|  14 | Bundle Showcase + Benefit Bar                           | Product Showcase |  1:1   | [bundle-showcase-benefit-bar.webp](../src/mastra/assets/AdCreatives/bundle-showcase-benefit-bar.webp)                                             |
|  15 | Social Comment Screenshot + Product                     | Social Proof     |  1:1   | [social-comment-screenshot-product.webp](../src/mastra/assets/AdCreatives/social-comment-screenshot-product.webp)                                 |
|  16 | Curiosity Gap / Hook Quote Testimonial                  | Hook             |  1:1   | [curiosity-gap-hook-quote-testimonial.webp](../src/mastra/assets/AdCreatives/curiosity-gap-hook-quote-testimonial.webp)                           |
|  17 | Verified Review Card                                    | Social Proof     |  1:1   | [verified-review-card.webp](../src/mastra/assets/AdCreatives/verified-review-card.webp)                                                           |
|  18 | Stat Surround / Callout Radial (Lifestyle Flatlay)      | Data-Driven      |  1:1   | [stat-surround-callout-radial-lifestyle-flatlay.webp](../src/mastra/assets/AdCreatives/stat-surround-callout-radial-lifestyle-flatlay.webp)       |
|  19 | Highlighted / Annotated Testimonial                     | Social Proof     |  1:1   | [highlighted-annotated-testimonial.webp](../src/mastra/assets/AdCreatives/highlighted-annotated-testimonial.webp)                                 |
|  20 | Advertorial / Editorial Content Card                    | Native           |  4:5   | [advertorial-editorial-content-card.webp](../src/mastra/assets/AdCreatives/advertorial-editorial-content-card.webp)                               |
|  21 | Bold Statement / Reaction Headline                      | Brand Energy     |  1:1   | [bold-statement-reaction-headline.webp](../src/mastra/assets/AdCreatives/bold-statement-reaction-headline.webp)                                   |
|  22 | Flavor Story / "Tastes Like"                            | Product Appeal   |  1:1   | [flavor-story-tastes-like.webp](../src/mastra/assets/AdCreatives/flavor-story-tastes-like.webp)                                                   |
|  23 | Long-Form Manifesto / Letter Ad                         | Copy-Driven      |  1:1   | [long-form-manifesto-letter-ad.webp](../src/mastra/assets/AdCreatives/long-form-manifesto-letter-ad.webp)                                         |
|  24 | Product + Comment Callout (Faux Social Proof)           | Social Proof     |  1:1   | [product-comment-callout-faux-social-proof.webp](../src/mastra/assets/AdCreatives/product-comment-callout-faux-social-proof.webp)                 |
|  25 | Us vs. Them Color Split                                 | Comparison       |  1:1   | [us-vs-them-color-split.webp](../src/mastra/assets/AdCreatives/us-vs-them-color-split.webp)                                                       |
|  26 | Stat Callout (Data-Driven Lifestyle)                    | Data-Driven      |  4:5   | [stat-callout-data-driven-lifestyle.webp](../src/mastra/assets/AdCreatives/stat-callout-data-driven-lifestyle.webp)                               |
|  27 | Benefit Checklist Showcase (Split Product + Info)       | Product Showcase |  1:1   | [benefit-checklist-showcase-split-product-info.webp](../src/mastra/assets/AdCreatives/benefit-checklist-showcase-split-product-info.webp)         |
|  28 | Feature Arrow Callout / Product Annotation              | Educational      |  1:1   | [feature-arrow-callout-product-annotation.webp](../src/mastra/assets/AdCreatives/feature-arrow-callout-product-annotation.webp)                   |
|  29 | UGC + Viral Post Overlay                                | UGC              |  9:16  | [ugc-viral-post-overlay.webp](../src/mastra/assets/AdCreatives/ugc-viral-post-overlay.webp)                                                       |
|  30 | Hero Statement + Icon Benefit Bar                       | Product Hero     |  1:1   | [hero-statement-icon-benefit-bar.webp](../src/mastra/assets/AdCreatives/hero-statement-icon-benefit-bar.webp)                                     |
|  31 | Comparison Grid / Table                                 | Comparison       |  1:1   | [comparison-grid-table.webp](../src/mastra/assets/AdCreatives/comparison-grid-table.webp)                                                         |
|  32 | UGC Story Callout / Text Bubble Explainer               | UGC              |  9:16  | [ugc-story-callout-text-bubble-explainer.webp](../src/mastra/assets/AdCreatives/ugc-story-callout-text-bubble-explainer.webp)                     |
|  33 | Faux Press / News Articles Screenshot                   | Authority        |  4:5   | [faux-press-news-articles-screenshot.webp](../src/mastra/assets/AdCreatives/faux-press-news-articles-screenshot.webp)                             |
|  34 | Faux iPhone Notes / App Screenshot                      | Native           |  1:1   | [faux-iphone-notes-app-screenshot.webp](../src/mastra/assets/AdCreatives/faux-iphone-notes-app-screenshot.webp)                                   |
|  35 | Hero Product Showcase + Stat Bar                        | Product Hero     |  1:1   | [hero-product-showcase-stat-bar.webp](../src/mastra/assets/AdCreatives/hero-product-showcase-stat-bar.webp)                                       |
|  36 | Whiteboard Before / After + Product Hold                | Educational      |  4:5   | [whiteboard-before-after-product-hold.webp](../src/mastra/assets/AdCreatives/whiteboard-before-after-product-hold.webp)                           |
|  37 | Hero Statement + Icon Bar + Offer Burst (Promo Variant) | Promotional      |  1:1   | [hero-statement-icon-bar-offer-burst-promo-variant.webp](../src/mastra/assets/AdCreatives/hero-statement-icon-bar-offer-burst-promo-variant.webp) |
|  38 | UGC Lifestyle + Product + Review Card (Split)           | UGC              |  4:5   | [ugc-lifestyle-product-review-card-split.webp](../src/mastra/assets/AdCreatives/ugc-lifestyle-product-review-card-split.webp)                     |
|  39 | Curiosity Gap + Scroll-Stopper Hook                     | Hook             |  1:1   | [curiosity-gap-scroll-stopper-hook.webp](../src/mastra/assets/AdCreatives/curiosity-gap-scroll-stopper-hook.webp)                                 |
|  40 | Native / Ugly Post-It Note Style (Product Hero)         | Native           |  4:5   | [native-ugly-post-it-note-style-product-hero.webp](../src/mastra/assets/AdCreatives/native-ugly-post-it-note-style-product-hero.webp)             |

## Fit notes

The templates were written for food, supplement and apparel brands. Slots that the run doesn't
supply are filled by the image model, guided by each template's own examples, so a few layouts need
a careful eye on a choking-rescue product (see
[Known issues](known-issues.md#some-templates-were-written-for-other-brands)):

| Template           | What to check                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------- |
| 22                 | A "tastes like" flavour ad. It doesn't fit this catalogue                                 |
| 13, 18, 25, 27, 35 | Prop and scene slots whose examples are food. Make sure no food ends up around the device |
| 14                 | Shows several products in a gift box                                                      |

## Keeping this page current

The table is generated by a short script that imports `PROMPT_CREATIVE_MAPPINGS`. Node 22.18+ runs
TypeScript directly, so no build step is needed:

```js
// Save as catalogue.mts in the repo root (don't commit it), then run `node catalogue.mts`.
import { PROMPT_CREATIVE_MAPPINGS } from "./src/mastra/utils/prompt-creative-mapping.ts";

for (const { prompt: p, creative: c } of PROMPT_CREATIVE_MAPPINGS) {
  console.log(
    `| ${p.id} | ${p.name} | ${p.category} | ${p.aspectRatio} | [${c.fileName}](../src/mastra/assets/AdCreatives/${c.fileName}) |`,
  );
}
```
