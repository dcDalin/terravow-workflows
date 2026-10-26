# Brand and policy

AtlasAir competes on being trustworthy. That goal shapes every prompt and several pieces of code in
this repo, and all of it lives in [`src/mastra/brand/`](../src/mastra/brand/). This page explains
what each rule is, where it lives, and, most importantly, **whether code enforces it or the
prompt only asks for it**.

## The rules in plain language

- **Nothing is invented to fill a layout.** No statistics, survival rates, customer counts, ratings,
  review counts, testimonials, customer names, certifications, awards or press mentions. An unfilled
  slot is left out, never filled with something plausible.
- **No manufactured urgency.** No countdowns, no "only N left", no fake scarcity or deadlines.
- **Social proof comes from Judge.me only.** It is passed in per run as real figures and verbatim
  review text. Without it, review-dependent assets are skipped or have the element removed.
- **Deceptive templates are blocked.** That covers:
  - faux press screenshots
  - faux social comments and posts
  - UGC formats that present an invented person as a real user
  - bait-and-switch
  - offer bursts
- **Safety framing is mandatory.** These are airway-clearance aids, not a substitute for professional
  medical care. "How it works" always starts with calling emergency services. Copy says "helps
  dislodge a blockage", never "removes the object" or "saves your child".
- **Preparedness, not fear.** The voice is calm, concrete and second person, and never shows a child
  in distress.

## Enforced in code vs. prompt-only

| Rule                                                                       | Where                                                                                     | Enforced by                                                                              |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Blocked / off-category ad templates never run                              | `template-policy.ts` → `listTemplates` tool hides them; `filterTemplates` drops or throws | **Code**                                                                                 |
| Proof-gated ad templates need `socialProof`                                | `filterTemplates({ hasRealProof })`                                                       | **Code**                                                                                 |
| Rating / quote / reviewer slots in ads filled only from `socialProof`      | Replacement map in `customize-prompts-step.ts` (empty string otherwise)                   | **Code**                                                                                 |
| Ad stat, price, promo, endorsement, badge and variant slots never invented | Replacement map: stats carry product features, everything else is empty                   | **Code**                                                                                 |
| Ad comparisons and before/after only against "being unprepared"            | Replacement map                                                                           | **Code**                                                                                 |
| Remix: statistics, badges, urgency, competitor comparisons dropped         | `decideElement()` in `remix-policy.ts`                                                    | **Code** (given the vision agent's classification)                                       |
| Remix: source social proof never carried over                              | `decideElement()` replaces with your Judge.me data or drops                               | **Code**                                                                                 |
| Remix: source product claims never reused                                  | `decideElement()` → replaced with AtlasAir catalogue features                             | **Code**                                                                                 |
| The image model doesn't invent ratings, badges, stats or urgency           | "ABSOLUTE RULES" block appended to each image prompt                                      | Prompt                                                                                   |
| Layout-only ad placeholders (scenes, props, people) stay on-brand          | Same "ABSOLUTE RULES" block                                                               | Prompt. See [Known issues](known-issues.md#some-templates-were-written-for-other-brands) |
| Product copy, FAQs and how-it-works invent nothing                         | Agent instructions (`agentPreamble()` + per-agent rules)                                  | Prompt                                                                                   |
| How-it-works step 1 is "Call Emergency Services"                           | Agent instructions                                                                        | Prompt                                                                                   |
| Mandatory "what it is not" FAQ / "honest bit" in copy                      | Agent instructions                                                                        | Prompt                                                                                   |
| Safety disclaimer on every image                                           | Appended to image prompts                                                                 | Prompt                                                                                   |

**Treat every "Prompt" row as something to check by eye.** Models usually follow these rules, but
nothing stops the output when they don't.

## The brand constants

Defined in [`brand/atlasair.ts`](../src/mastra/brand/atlasair.ts):

| Export          | Contents                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRAND`         | Name, tagline, website, category and positioning ("the 30 seconds before help arrives"); the four pitch pillars; the safety disclaimer; the emergency-first rule; the social-proof policy; the trust-strip rule; the **palette**, **typography** (Spectral / Figtree / Caveat) and **shape** (16px radius, pill buttons, navy-tinted shadows); `assetRoot` |
| `VOICE_RULES`   | Five tone rules: calm, concrete, second person, never guarantee outcomes, preparedness not fear                                                                                                                                                                                                                                                            |
| `HONESTY_RULES` | Seven "never" rules: invented stats, reviews, certifications, urgency, medical-approval claims, replacing emergency services; omit rather than invent                                                                                                                                                                                                      |

These are the single source of truth for the brand. To change the brand, change it here.

## Prompt blocks

[`brand/prompt-blocks.ts`](../src/mastra/brand/prompt-blocks.ts) turns the constants into reusable
prompt text:

| Function                | Contains                                                                   | Used by                                                                                        |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `agentPreamble()`       | `brandBlock()` + `safetyBlock()` + `honestyBlock()`                        | The instructions of `productCopyAgent`, `faqsAgent`, `howItWorksAgent`, `productAnalyzerAgent` |
| `visualIdentityBlock()` | Palette (with optional `brandColors` overrides), typography, shape         | Every image prompt (how-it-works, ad creatives, remix)                                         |
| `productBlock(product)` | Title, short name, type, age range, description, features, what's included | The text agents' prompts and the ad analyst's prompt                                           |

`creativeRemixAgent` deliberately does **not** get `agentPreamble()`. Its job is to transcribe the
source ad verbatim, and the brand voice would push it to rewrite.

The image prompts' "ABSOLUTE RULES" blocks are **written inline** in
[`customize-prompts-step.ts`](../src/mastra/workflows/generate-ad-creatives/steps/customize-prompts-step.ts)
and [`plan-remix-tasks-step.ts`](../src/mastra/workflows/remix-creative/steps/plan-remix-tasks-step.ts).
They don't import `HONESTY_RULES`, so a new honesty rule must be added there too.

## Product catalogue

[`brand/products.ts`](../src/mastra/brand/products.ts) holds the four products:

| Key             | Title                                 | Type      | Ships | Covers                                    |
| --------------- | ------------------------------------- | --------- | ----- | ----------------------------------------- |
| `atlasair-2`    | AtlasAir 2.0 (flagship)               | `device`  | Yes   | Infant through adult (3 masks)            |
| `atlasair-plus` | AtlasAir+ (original)                  | `device`  | Yes   | Ages 1 to adult (2 masks)                 |
| `first-aid-kit` | Essential First Aid Kit               | `kit`     | Yes   | Whole household                           |
| `cpr-course`    | Emergency CPR + Choking Rescue Course | `digital` | No    | Age-specific protocols, infants to adults |

Each entry has a `summary`, a `features` list and a `whatsIncluded` list. Copy and creatives may only
claim features that appear there or in a supplied description.

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

The only accepted source is Judge.me. The `socialProof` input is shared by `generate-ad-creatives` and
`remix-creative`:

```json
{
  "socialProof": {
    "ratingValue": 4.8,
    "reviewCount": 212,
    "quotes": [
      { "text": "Verbatim review text.", "name": "Dana R.", "verified": true }
    ]
  }
}
```

| Field         | Rule                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| `ratingValue` | Real average, 1–5. Never estimate                                            |
| `reviewCount` | Real count. Never round up                                                   |
| `quotes[]`    | Verbatim text, copied exactly. `verified: true` only if Judge.me marks it so |

Supplying **any** of the three counts as "real proof". That unlocks proof-gated templates and the
social-proof element in remixes. A rating renders as e.g. "4.8 stars from 212 Judge.me reviews". Only
the **first** quote is used.

## Template policy

[`brand/template-policy.ts`](../src/mastra/brand/template-policy.ts) controls which of the 40 ad
templates may run. The full list is in the [template catalogue](ad-template-catalogue.md).

| List                          | IDs                                      | Behaviour                                                                   |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `BLOCKED_TEMPLATES`           | 8, 9, 10, 15, 20, 24, 29, 32, 33, 34, 37 | Hidden from the AI. Dropped from AI picks. **Throws** if requested manually |
| `OFF_CATEGORY_TEMPLATE_IDS`   | 22                                       | Same as blocked (a food "tastes like" ad)                                   |
| `PROOF_REQUIRED_TEMPLATE_IDS` | 3, 6, 11, 16, 17, 19, 38, 40             | Skipped with a warning unless `socialProof` is supplied. Never throws       |

Why each template is blocked:

| ID  | Template                                      | Reason                                                                                         |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 8   | Before & After (UGC Native)                   | A staged before/after selfie of an invented person, presented as a real customer's TikTok post |
| 9   | Negative Marketing (Bait & Switch)            | Deceptive by construction                                                                      |
| 10  | Press/Editorial                               | Needs a press quote AtlasAir doesn't have; brand copy in editorial type reads as endorsement   |
| 15  | Social Comment Screenshot + Product           | Renders invented comments as real posts                                                        |
| 20  | Advertorial / Editorial Content Card          | Styled as an organic culture-account post, so brand copy reads as independent coverage         |
| 24  | Product + Comment Callout (Faux Social Proof) | Faux social proof by name                                                                      |
| 29  | UGC + Viral Post Overlay                      | A realistic Reddit/X post from an invented user, with no product or logo                       |
| 32  | UGC Story Callout / Text Bubble Explainer     | An invented person's Instagram Story, with a first-person result, as authentic user content    |
| 33  | Faux Press / News Articles Screenshot         | Fabricates press coverage and mastheads                                                        |
| 34  | Faux iPhone Notes / App Screenshot            | Presents invented notes as an authentic screenshot                                             |
| 37  | Hero Statement + Icon Bar + Offer Burst       | Offer-burst layout manufactures urgency                                                        |

The policy is a **denylist**: a new template is allowed unless you add it to a list. See
[Extending → add an ad template](extending.md#add-an-ad-template).

## Remix element policy

[`brand/remix-policy.ts`](../src/mastra/brand/remix-policy.ts) decides, in code, what happens to each
text element the vision agent finds in a competitor's ad:

| Classification          | Action                                             | Replacement / reason                                                       |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| `brand-mark`            | Replace                                            | AtlasAir product title. The logo comes from your `logo` image              |
| `product-claim`         | Replace                                            | An AtlasAir catalogue feature. Their claims are never assumed true of ours |
| `statistic`             | **Drop**                                           | AtlasAir publishes no lives-saved / success-rate / units-sold figures      |
| `social-proof`          | Replace with your Judge.me data, else **drop**     | Their reviews are never AtlasAir's reviews                                 |
| `certification-badge`   | **Drop**                                           | Certifications, endorsements, awards and press marks are never inherited   |
| `urgency`               | **Drop**                                           | No countdowns, stock counters or scarcity                                  |
| `competitor-comparison` | **Drop**                                           | No comparisons against other brands                                        |
| `cta`                   | Keep the source wording, or replace with `ctaText` | Generic action wording. No CTA is added if the source had none             |
| `structural-label`      | Keep                                               | "How it works", "Step 1", "Before / After" belong to the format            |

The agent is told to pick the stricter class when unsure. For example, a testimonial containing a
statistic is classed as `social-proof`. `REMIX_SCOPE` states what a remix takes from the source
(composition, archetype, reading order, aspect ratio) and what it never takes. It is quoted into
every prompt and into the manifest.
