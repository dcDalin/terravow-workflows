# Landing pages: where this repo's output goes

**This repo doesn't build landing pages (LPs) or product pages, and it publishes nothing.** It
generates the parts that go on them: copy, FAQs, guarantee text, how-it-works images and ad
creatives. A person moves each part into place by hand. No code connects this repo to Shopify or to
any LP repo.

This page shows how LPs are made across our repos and where each output from here ends up. Each
repo's own docs have the details.

## The repos involved

| Repo (under `Projects/smc/`)    | Role in making a landing page                                                                                                                                                                                                                                                                               | Its docs                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **`terravow-workflows`** (this) | Generates the **content**: product copy, guarantee, FAQs, how-it-works images, ad creatives, competitor remixes                                                                                                                                                                                             | You're reading them                                  |
| **`smc-lp-workflow`**           | A separate Mastra project that **clones competitor LPs**. It finds winning competitor ads in the Facebook Ad Library, renders their landing page, rewrites it with AtlasAir copy and imagery, and publishes the clone to Supabase for PageDeck. A Google Sheet is the source of truth and the approval gate | `smc-lp-workflow/docs/README.md`, `docs/pipeline.md` |
| **`atlas-air`**                 | The AtlasAir **storefront and landing site**. `apps/storefront` is Shopify Hydrogen. `apps/landing` hosts the LP routes, each hand-composed from shared sections. `packages/content` holds hand-written FAQs and how-it-works copy                                                                          | `atlas-air/README.md`, `CLAUDE.md`, `docs/brand.md`  |
| **`shopify/terravow-plain`**    | A Shopify Liquid theme from the store's TerraVow days. Its product template reads FAQ, how-it-works and guarantee content from **product metafields**                                                                                                                                                       | Theme sections in `sections/product-*.liquid`        |
| **`rescuaid-lp`**               | An LP proof of concept for a sister brand (RescUAid). Its **seven-section product-page SOP** is the house template for how a PDP/LP is structured                                                                                                                                                           | `rescuaid-lp/docs/pdp-template-sop.md`               |

`smc-lp-workflow` and this repo overlap: both target AtlasAir, and both make template ads and
remix images with Gemini. They share no code, and they use different buckets (`smc-assets` there,
`SUPABASE_BUCKET` here). Neither imports the other.

## Where each output goes

| Output from here                                            | Destination                                                                                                                                                                                                                       | How it gets there                                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Product copy** (`generatedTitle`, `generatedDescription`) | Shopify admin → product title and description. The Hydrogen storefront renders the description (`descriptionHtml`). On an LP it fills the title/subheadline and the open "why you'll love it" details section                     | Paste from `product-copy.txt`. Formatted for Shopify's rich-text editor                               |
| **Guarantee** (`guaranteeTitle`, `guaranteeDescription`)    | Theme metafield `custom.product_guarantee` (`title`, `body`). On an LP, the guarantee under the buy button (SOP §3) and in the closing section (§7)                                                                               | Paste into the metafield in Shopify admin                                                             |
| **FAQs**                                                    | Theme metafield `custom.product_faq`, a list of `{ title, description }`, so `question` → `title` and `answer` → `description`. In `atlas-air`, `packages/content/src/faqs.ts`. On an LP, the FAQ in the closing section (SOP §7) | Paste into the metafield, or hand-edit into the content file                                          |
| **How-it-works images**                                     | Theme metafield `custom.how_it_works`, a list of images shown as a carousel. On an LP, the how-it-works band under value props (SOP §6)                                                                                           | Download from Supabase (`manifest.json` lists them), upload to Shopify Files, attach to the metafield |
| **Ad creatives and remixes**                                | Ad platforms (Meta etc.), each ad pointing at the LP built for its ad set. They don't go on the page                                                                                                                              | Download from Supabase and upload to the ad account                                                   |

The theme's product template order is: product → testimonial → FAQ → how-it-works → text banner →
feature → guarantee. The metafield names come from the theme code. **Who fills them, and when, is a
team process**, not something either repo records.

### The seven-section LP template

From `rescuaid-lp/docs/pdp-template-sop.md`, with the parts this repo can supply:

| #   | Section          | Supplied from here                        |
| --- | ---------------- | ----------------------------------------- |
| 1   | Above the fold   | Title and subheadline from product copy   |
| 2   | Buy box          | None (bundles and pricing are store data) |
| 3   | Under the button | Guarantee section                         |
| 4   | Details          | Description body ("why you'll love it")   |
| 5   | Social proof     | None. The review wall is store data       |
| 6   | Value props      | How-it-works sequence                     |
| 7   | Closing          | Guarantee, FAQs                           |

### A note on text in images

How-it-works images have their step label, title and description **rendered into the image**. That
suits the theme's carousel. It clashes with the LP gallery rule in the SOP ("Photos carry no words";
all text is overlaid by the page), so for LP galleries use the how-it-works **text** from the run
output (`images[].title` / `description`) over separate photography. AI-rendered text can also
contain typos, so check every word.

## Claims must match the product description

`atlas-air` requires every product claim on the storefront to already appear in the Shopify product
description. Publish the product copy from here **before** any LP or ad that relies on its claims,
and keep feature claims consistent with [`brand/products.ts`](../src/mastra/brand/products.ts).

## If you want to automate this

Today every handoff is manual. The natural next steps would be:

- writing the FAQ and guarantee metafields through the Shopify Admin API
- uploading how-it-works images to Shopify Files

Neither exists in any repo yet. Treat this as a design choice to make deliberately, not a missing
piece of existing code.
