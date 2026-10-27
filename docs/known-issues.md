# Known issues

These are problems in the code as of this writing, each one checked against the source. They are
listed so nobody trips over them; listing them doesn't mean they've been fixed. When you fix one,
delete its entry and update any docs page that links to it.

## Affects what gets generated

### Some templates were written for other brands

The template catalogue came from food, supplement and apparel brands. Slots the run doesn't supply are
filled by the image model, guided by each template's own examples, so some layouts fit poorly:

- **Food and lifestyle props:** 13, 18, 25, 27 and 35 leave slots like `[FLAVOR PROPS]`,
  `[SCATTERED ELEMENTS]` and `[FLATLAY PROPS]` to the model, and the template examples are food. Food
  scattered around a choking-rescue device is a poor look.
- **Off-category:** 22 is a "tastes like" flavour ad. The AI analyst is told to skip
  other-category templates, but nothing stops it being chosen.
- **Bundle layout:** 14 shows several products in a gift box.
- **Fix:** rewrite the layout text in
  [`utils/prompt-creative-mapping.ts`](../src/mastra/utils/prompt-creative-mapping.ts) for the
  templates you use, or map their prop slots to AtlasAir scenes in `customize-prompts-step.ts`.

### Remix scope text contradicts rebrand mode

`REMIX_SCOPE.neverTakes` in [`brand/remix-policy.ts`](../src/mastra/brand/remix-policy.ts) includes
"Any depiction of their product" and "every visual is regenerated from AtlasAir reference images".
It is appended to **every** remix prompt and written to the manifest. In rebrand mode (no
`productImages`), the same prompt tells the model to reproduce the source product exactly.

- **Impact:** the model gets conflicting instructions, and the manifest misdescribes rebrand runs.
- **Fix:** give `REMIX_SCOPE` a rebrand variant, or build the scope lines per mode in
  `buildRemixPrompt()`.

### Safety rules and counts in the text workflows are prompt-only

For product copy, FAQs and how-it-works, the safety rules exist only in the agent instructions:

- the "what it is not" FAQ
- step 1 = call emergency services
- the closing "what it is not" section of the product copy

Nothing in code checks the output. `faqCount` and `stepCount` aren't checked either: the run returns
whatever count the model produced, and zero steps gives a "successful" empty run.

- **Fix ideas:**
  - Validate counts with zod `.length()`.
  - Assert that step 1's title mentions emergency services.

### `brandWebsite` does nothing in ad creatives

`brandWebsite` fills `[WEBSITE]`, but no template contains `[WEBSITE]`. Template 40 uses
`[BRAND_WEBSITE — e.g. "atlasair.com"]`, which isn't mapped. In `remix-creative`, `brandWebsite`
works as documented.

### `imageGenerationModel` doesn't choose a model

The input is described as a model name, but the workflow only checks whether it contains `"4K"`. If
it does, images are 4K; otherwise they're 2K. The model is always `gemini-3.1-flash-image-preview`.

- **Fix:** replace it with an `imageSize` input, as the other two image workflows have.

### Brand wording assumes a choking device

- **Brand placeholders use the product title.** `[BRAND]` and `[YOUR BRAND]` resolve to the
  **product** title, for example "AtlasAir 2.0", not "AtlasAir".
- **Choking-device copy goes on every product.** These are applied to the first aid kit and the CPR
  course as well as the devices:
  - the choking-device disclaimer ("AtlasAir devices are airway-clearance aids…")
  - the "empty drawer → ready to use" before/after copy
  - the calm-mealtime scene used for template 39's problem visual

## Cost and reliability

### Retries re-run paid calls

Image generation and upload happen in the same step, and `retryConfig.attempts` applies to every
step: 5 for ad creatives, 3 for how-it-works and remix. A Supabase misconfiguration therefore
triggers up to 6 paid Gemini calls **per image** before the run fails. A remix analysis retry re-runs
the vision call for **every** source.

When one foreach item fails for good:

- images from earlier batches stay in the bucket
- no manifest is written for them

**Fix ideas:**

- check Supabase up front, the way `verify-gemini-key` checks Gemini
- separate generation from upload
- lower the retry count on paid steps

### Validation happens late

`resolveProduct()` is the only check that a product was given, and it runs inside steps:

- in ad creatives, after the image fetches
- in remix, after the vision calls

`remix-creative` and `generate-how-it-works` also have no Gemini key check up front.

- **Fix:** resolve the product, and check keys, in the first step.

### Manual template IDs are ignored unless the mode is `manual`

`templateIds` is used only when `templateSelectionMode` is `"manual"`. The default is `"ai"`, so
passing IDs alone silently runs AI selection.

- **Fix:** infer manual mode when `templateIds` is non-empty, or reject the combination.

## Setup and repo hygiene

### The Supabase bucket default is inconsistent

- **Code default:** [`utils/supabase.ts`](../src/mastra/utils/supabase.ts) defaults to
  `"TerraVow"`, the bucket from before the rebrand.
- **`.env.example`:** sets `SUPABASE_BUCKET=AtlasAir`, while its comment says the default is TerraVow
  "so existing uploads keep working".
- **Fix:** pick one bucket, make it the default, and align the comment.

### `mastra build` bundles `src/mastra/public`

The build copies `src/mastra/public/` into `.mastra/output/`, so the build includes the dev
databases (`mastra.db`, `observability.duckdb`). Both are git-ignored, but they're still on disk.

### New template images are git-ignored

`.gitignore` contains `assets`, which matches `src/mastra/assets/` at any depth. The existing images
are tracked, but **new ones are ignored silently**.

- **Fix:** anchor the rule to the folder it was meant for, for example `/assets`.

### Supabase `outputDirectory` isn't a URL

In Supabase mode, the image workflows return
`outputDirectory: "https://supabase.co/storage/<bucket>/<folder>"`. It looks like a link but isn't
one. `manifestPath` and each image's `localPath` are the real public URLs.

### The project doesn't type-check cleanly

`npx tsc --noEmit` reports 4 errors. `npm run build` doesn't type-check, so it still passes.

| File                        | Problem                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `save-faqs-step.ts`         | Reads `.success` / `.bytesWritten` without first narrowing out the tool's `ValidationError` return |
| `save-product-copy-step.ts` | Same as above                                                                                      |

## Cleanup candidates

These are unused, and safe to remove once confirmed:

- `lookupTemplateTool` in `tools/lookup-template.ts`: neither registered nor used.
- `ensureDirectoryTool`: registered, but no workflow calls it.
- `validateMapping()` in `prompt-creative-mapping.ts`: never called.
- `src/mastra/assets/TerraVowLogo.webp`: not referenced anywhere.
- `@mastra/evals` in `package.json`: not imported.
- `"main": "index.js"` in `package.json`: a leftover from `npm init`.
