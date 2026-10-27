# Brand and policy

Everything that makes output read as AtlasAir lives in [`src/mastra/brand/`](../src/mastra/brand/):

- the brand voice
- the product catalogue
- the shared prompt blocks
- the safety rules
- how a competitor's ad is carried into a remix

There are no content gates:

- every ad template can run
- review templates don't need data
- the image model fills any slot the run doesn't supply

## Safety rules

These apply to every workflow:

- **Emergency services come first.** "How it works" always starts with calling emergency services,
  and copy never tells anyone to delay calling.
- **The disclaimer is always there.** Every surface states that these are airway-clearance aids, not
  a substitute for professional medical care. Images render it as small print.
- **No guaranteed medical outcome.** Copy says "helps dislodge a blockage", never "removes the
  object" or "saves your child".
- **No distress.** Images never show a child in visible distress or a staged emergency.

| Rule                                   | Where it lives                                                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text agents follow the safety rules    | `safetyBlock()` in `agentPreamble()`, plus each agent's own instructions                                                                                                    |
| How-it-works step 1 is the 911 call    | `howItWorksAgent` instructions and the step prompt                                                                                                                          |
| "What it is not" FAQ / closing section | `faqsAgent` and `productCopyAgent` instructions                                                                                                                             |
| Disclaimer and no-distress on images   | The "ABSOLUTE RULES" block in each image prompt, the `[DISCLAIMER]` mapping, and the calm-scene `[PROBLEM VISUAL]` and before/after mappings in `customize-prompts-step.ts` |

All of these are prompt instructions, so read what comes back before using it.

## The brand constants

Defined in [`brand/atlasair.ts`](../src/mastra/brand/atlasair.ts):

| Export        | Contents                                                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRAND`       | Name, tagline, website, category and positioning ("the 30 seconds before help arrives"); the four pitch pillars; the safety disclaimer; the emergency-first rule; the **palette**, **typography** (Spectral / Figtree / Caveat) and **shape** (16px radius, pill buttons, navy-tinted shadows); `assetRoot` |
| `VOICE_RULES` | Five tone rules: calm, concrete, second person, never guarantee outcomes, preparedness not fear                                                                                                                                                                                                             |

These are the single source of truth for the brand. To change the brand, change it here.

## Prompt blocks

[`brand/prompt-blocks.ts`](../src/mastra/brand/prompt-blocks.ts) turns the constants into reusable
prompt text:

| Function                | Contains                                                                   | Used by                                                                                        |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `agentPreamble()`       | `brandBlock()` + `safetyBlock()`                                           | The instructions of `productCopyAgent`, `faqsAgent`, `howItWorksAgent`, `productAnalyzerAgent` |
| `visualIdentityBlock()` | Palette (with optional `brandColors` overrides), typography, shape         | Every image prompt (how-it-works, ad creatives, remix)                                         |
| `productBlock(product)` | Title, short name, type, age range, description, features, what's included | The text agents' prompts and the ad analyst's prompt                                           |

`creativeRemixAgent` deliberately does **not** get `agentPreamble()`. Its job is to transcribe the
source ad verbatim, and the brand voice would push it to rewrite.

The image prompts' "ABSOLUTE RULES" blocks are **written inline** in
[`customize-prompts-step.ts`](../src/mastra/workflows/generate-ad-creatives/steps/customize-prompts-step.ts)
and [`plan-remix-tasks-step.ts`](../src/mastra/workflows/remix-creative/steps/plan-remix-tasks-step.ts).
A rule that should reach the image model has to be added there too.

## Product catalogue

[`brand/products.ts`](../src/mastra/brand/products.ts) holds the four products:

| Key             | Title                                 | Type      | Ships | Covers                                    |
| --------------- | ------------------------------------- | --------- | ----- | ----------------------------------------- |
| `atlasair-2`    | AtlasAir 2.0 (flagship)               | `device`  | Yes   | Infant through adult (3 masks)            |
| `atlasair-plus` | AtlasAir+ (original)                  | `device`  | Yes   | Ages 1 to adult (2 masks)                 |
| `first-aid-kit` | Essential First Aid Kit               | `kit`     | Yes   | Whole household                           |
| `cpr-course`    | Emergency CPR + Choking Rescue Course | `digital` | No    | Age-specific protocols, infants to adults |

Each entry has a `summary`, a `features` list and a `whatsIncluded` list. Copy describes features
using the names given there or in a supplied description.

**How `resolveProduct()` works.** Every workflow calls it. It accepts a `productKey`, or
`productTitle` + `productDescription`, or both.

| Input                                | Title                                                                                   | Description                                                     | Features / included | Type     |
| ------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------- | -------- |
| Key only                             | Preset                                                                                  | Built from summary, features, what's included, age range, ships | Preset              | Preset   |
| Key + `productTitle`                 | Yours                                                                                   | As above                                                        | Preset              | Preset   |
| Key + `productDescription`           | Preset                                                                                  | **Yours, replacing the whole generated description**            | Preset              | Preset   |
| Title + description, no key (ad hoc) | Yours                                                                                   | Yours                                                           | **Empty**           | `device` |
| Neither                              | Throws `Provide either "productKey" … or both "productTitle" and "productDescription".` |                                                                 |                     |          |

The check runs in code rather than in the zod schema, so the workflow schemas stay plain objects that
steps can extend. As a result, a run with no product passes input validation and fails at the first
step that resolves the product.

## Social proof

`generate-ad-creatives` and `remix-creative` take an optional `socialProof` input with data copied
from Judge.me:

```json
{
  "socialProof": {
    "ratingValue": 4.8,
    "reviewCount": 212,
    "quotes": [{ "text": "Review text.", "name": "Dana R.", "verified": true }]
  }
}
```

| Field         | Fills                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| `ratingValue` | Rating slots, e.g. "4.8 stars from 212 Judge.me reviews"                    |
| `reviewCount` | Review-count slots                                                          |
| `quotes[]`    | Quote, reviewer-name and verified-badge slots. Only the first quote is used |

Without it, the image model writes the rating, review and reviewer slots itself. In a remix, social
proof is rewritten as an AtlasAir equivalent.

## Ad templates

All 40 templates in the [catalogue](ad-template-catalogue.md) can be chosen, by the AI analyst or by
you. The analyst sees the full list through its `listTemplates` tool. It is told to skip templates
built for a different category, such as food flavour ads, and to avoid layouts that stage panic.

## Remix element policy

[`brand/remix-policy.ts`](../src/mastra/brand/remix-policy.ts) decides, in code, what happens to each
text element the vision agent finds in a competitor's ad. Nothing is copied verbatim:

| Classification          | Action                                             | What is rendered                                                |
| ----------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| `brand-mark`            | Replace                                            | AtlasAir product title. The logo comes from your `logo` image   |
| `product-claim`         | Replace                                            | An AtlasAir catalogue feature                                   |
| `statistic`             | Replace                                            | The AtlasAir equivalent statistic                               |
| `social-proof`          | Replace                                            | Your Judge.me data if supplied, else the AtlasAir equivalent    |
| `certification-badge`   | Replace                                            | The AtlasAir equivalent badge                                   |
| `urgency`               | Replace                                            | The AtlasAir equivalent offer line                              |
| `competitor-comparison` | Replace                                            | The comparison with AtlasAir as the brand that wins             |
| `cta`                   | Keep the source wording, or replace with `ctaText` | Generic action wording. No CTA is added if the source had none  |
| `structural-label`      | Keep                                               | "How it works", "Step 1", "Before / After" belong to the format |

The agent is told to pick the stricter class when an element could fit two. `REMIX_SCOPE` states what
a remix takes from the source (composition, archetype, reading order, aspect ratio) and what it never
takes. It is quoted into every prompt and into the manifest.
