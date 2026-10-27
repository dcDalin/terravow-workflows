# Running workflows

A guide for anyone producing AtlasAir content: what to enter, what you get back, where to find
it and what to check before it goes live. No coding needed.

## Before you start

- Someone on the team runs `npm run dev`, and Studio opens at
  [http://localhost:4111](http://localhost:4111). [Getting started](getting-started.md) covers the
  setup.
- In Studio, open **Workflows**, pick a workflow, paste a JSON input (recipes below) and run it.
  You can watch each step complete. The final output appears when the run finishes.
- Image URLs you give a workflow (logo, product photos, competitor ads) must open in a private
  browser window without logging in. Supabase public URLs and the Shopify CDN both work.

## Pick the product

Every workflow takes a `productKey`:

| Key             | Product                               |
| --------------- | ------------------------------------- |
| `atlasair-2`    | AtlasAir 2.0 (flagship device)        |
| `atlasair-plus` | AtlasAir+ (original device)           |
| `first-aid-kit` | Essential First Aid Kit               |
| `cpr-course`    | Emergency CPR + Choking Rescue Course |

For something not in the list, pass `productTitle` and `productDescription` instead. Passing either
alongside a key overrides that part of the preset. To get your **real returns policy** into product
copy, include it in `productDescription`. The workflow never makes one up.

## Recipes

### Product page copy

`generate-product-copy` writes the title, description and guarantee section. [Details](workflows/product-copy.md)

```json
{ "productKey": "atlasair-2" }
```

You get `generatedTitle`, `generatedDescription`, `guaranteeTitle` and `guaranteeDescription` in the
output, plus a `product-copy.txt` file. The description is plain text formatted for Shopify's
rich-text editor, so paste it in as-is.

### FAQs

`generate-faqs` writes 3–20 FAQs. [Details](workflows/faqs.md)

```json
{ "productKey": "cpr-course", "faqCount": 10 }
```

### How-it-works illustrations

`generate-how-it-works` makes 4–8 images, each with its step text built in. [Details](workflows/how-it-works.md)

```json
{
  "productKey": "atlasair-plus",
  "stepCount": 5,
  "aspectRatio": "1:1",
  "storageDestination": "supabase"
}
```

### Ad creatives (AI picks the templates)

[Details](workflows/ad-creatives.md)

```json
{
  "productKey": "atlasair-2",
  "logo": "https://YOUR-PUBLIC-URL/atlasair-logo.png",
  "productImages": [
    "https://YOUR-PUBLIC-URL/atlasair-2-hero.jpg",
    "https://YOUR-PUBLIC-URL/atlasair-2-masks.jpg"
  ],
  "aiSelectTemplateCount": 4,
  "creativesPerTemplate": 2
}
```

That's 4 templates × 2 variations = 8 images.

### Ad creatives (you pick the templates)

Browse the [template catalogue](ad-template-catalogue.md), which shows every template's ID and a
sample image.

```json
{
  "productKey": "first-aid-kit",
  "logo": "https://YOUR-PUBLIC-URL/atlasair-logo.png",
  "productImages": ["https://YOUR-PUBLIC-URL/first-aid-kit.jpg"],
  "templateSelectionMode": "manual",
  "templateIds": [5, 27, 30],
  "ctaText": "BE READY"
}
```

### Ad creatives with your Judge.me reviews

Every template can run without review data; Gemini writes the rating and review slots itself. To use
the store's real figures instead, pass `socialProof` copied from the Judge.me dashboard: the average
rating, the review count and the review text.

```json
{
  "productKey": "atlasair-2",
  "logo": "https://YOUR-PUBLIC-URL/atlasair-logo.png",
  "productImages": ["https://YOUR-PUBLIC-URL/atlasair-2-hero.jpg"],
  "templateSelectionMode": "manual",
  "templateIds": [11, 17, 27],
  "socialProof": {
    "ratingValue": 4.8,
    "reviewCount": 212,
    "quotes": [
      {
        "text": "Paste the review exactly as written.",
        "name": "Dana R.",
        "verified": true
      }
    ]
  }
}
```

Only the first quote is used. Set `verified` to `true` only if Judge.me marks the review as a
verified purchase.

### Remix a competitor's ad

`remix-creative` rebuilds another brand's ad layout as an AtlasAir ad. [Details](workflows/remix-creative.md)

```json
{
  "sourceImages": [
    "https://YOUR-PUBLIC-URL/competitor-ad-1.jpg",
    "https://YOUR-PUBLIC-URL/competitor-ad-2.jpg"
  ],
  "sourceBrandName": "LifeAid",
  "productKey": "atlasair-2",
  "logo": "https://YOUR-PUBLIC-URL/atlasair-logo.png",
  "variationsPerSource": 2
}
```

- **Leave out `productImages`** when the competitor's device is physically the same as ours. Their
  product is kept and only the branding on it changes.
- **Add `productImages`** when ours looks different. Their product is replaced with ours.
- **Re-host competitor ads before using them.** Download the ad and upload it to Supabase or Shopify
  first, because the original CDN URL often blocks the workflow.

## Finding your files

| Workflow                          | Where the files go                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product copy, FAQs                | A `.txt` file on the machine running Studio: `<asset folder>/<product>/<timestamp>/`                                                                                                                              |
| How-it-works, ad creatives, remix | **Supabase** by default: bucket `SUPABASE_BUCKET` (usually `AtlasAir`), folder `<product>/<timestamp>/`. Remixes use `<product>-remix/<timestamp>/`. Pass `"storageDestination": "local"` to save to disk instead |

- **Asset folder:** `~/Desktop/AtlasAirAssets` unless `ASSET_OUTPUT_ROOT` is set.
- **Product folder name:** the product title lowercased, with spaces and punctuation turned into
  dashes. For example, AtlasAir 2.0 becomes `atlasair-2-0`.
- **Timestamp:** milliseconds since 1970, so newer runs sort last.

In the run output:

- **`manifestPath`** is the link to `manifest.json`, which lists every file in the run, its prompt,
  and the input you used.
- **Each image's `localPath`** is its public link (Supabase) or file path (local).
- **`outputDirectory`** is **not** a clickable link in Supabase mode. Use `manifestPath` or the
  Supabase dashboard (Storage → bucket → folder) instead.

## What a run costs

| Workflow     | Calls per run                                                                |
| ------------ | ---------------------------------------------------------------------------- |
| Product copy | 1 GPT-4o                                                                     |
| FAQs         | 1 GPT-4o                                                                     |
| How-it-works | 1 GPT-4o + `stepCount` Gemini images                                         |
| Ad creatives | 1 GPT-4o + (templates × `creativesPerTemplate`) Gemini images                |
| Remix        | 1 GPT-4o vision per source + (sources × `variationsPerSource`) Gemini images |

Failed steps retry automatically, 2–5 times depending on the workflow. A configuration problem, like
a wrong Supabase key, can therefore burn several paid image calls before the run gives up. If a run
fails on setup, fix the setup before running it again.

## Check before publishing

The safety rules are instructions to the AI (see
[Brand and policy](brand-and-policy.md#safety-rules)), so read every asset for:

- [ ] **Safety framing**: the airway-clearance-aid disclaimer is present and legible. Copy says
      "helps dislodge a blockage", and how-it-works starts with calling emergency services.
- [ ] **No distress**: no child shown in visible distress, and no staged emergency.
- [ ] **Remixes**: no trace of the competitor's logo or symbol, including on the device itself, in
      reflections, in small print and on packaging.
- [ ] **Text in images**: AI-rendered text can contain typos. Read every word.
- [ ] **Props and scenes**: templates 13, 18, 25, 27 and 35 were written for food brands, so check
      that no food ends up around the device. Template 14 shows several products in a gift box. See
      the [catalogue](ad-template-catalogue.md#fit-notes).

## When something goes wrong

| You see                                                                          | What to do                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Provide either "productKey" … or both "productTitle" and "productDescription"`  | Add a `productKey`, or both title and description                                                                                                                                                                        |
| `Failed to fetch image from URL (403)` / `Failed to fetch reference image (403)` | The image URL isn't public, or blocks servers. Re-upload it to Supabase and use that link                                                                                                                                |
| Your manual templates were ignored                                               | Set `"templateSelectionMode": "manual"`. Without it, `templateIds` is ignored                                                                                                                                            |
| `GOOGLE_API_KEY …` / `Invalid GOOGLE_API_KEY`                                    | The Gemini key is missing or wrong in `.env`. Ask whoever runs the server                                                                                                                                                |
| `Failed to upload to Supabase: …`                                                | Supabase settings, bucket name or permissions. Try `"storageDestination": "local"` to unblock                                                                                                                            |
| `No image generated in response` / `No candidates returned from Gemini`          | Gemini declined that prompt. Re-run, or choose a different template                                                                                                                                                      |
| `Failed to parse …`                                                              | The AI returned malformed output. It retries automatically. If it still fails, re-run                                                                                                                                    |
| Can't find the `.txt` / local files                                              | Look in `~/Desktop/AtlasAirAssets`, or wherever `ASSET_OUTPUT_ROOT` points. If it's set to a relative path, look under `src/mastra/public/` in the repo. See [Getting started](getting-started.md#environment-variables) |
