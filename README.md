# atlasair-workflows

[Mastra](https://mastra.ai/) content-generation workflows for the **AtlasAir** storefront, a
direct-to-consumer store selling home choking-rescue and emergency-preparedness gear for families.

_Life-saving first aid, ready before you need it._

**Full documentation: [`docs/`](docs/README.md).** It covers recipes for operators, architecture for
engineers, the brand rules, and how outputs reach Shopify and landing pages.

## Getting started

```shell
npm install
cp .env.example .env   # then fill in your keys (see docs/getting-started.md)
npm run dev
```

Open [http://localhost:4111](http://localhost:4111) for Mastra Studio, where each workflow can be
run interactively. [Getting started](docs/getting-started.md) lists every environment variable and
the one setup trap: the Supabase bucket must exist and be public.

## The five workflows

| Workflow                                                  | What it produces                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`generate-product-copy`](docs/workflows/product-copy.md) | Product title + Shopify-ready rich-text description, plus the guarantee/store-policy section                     |
| [`generate-faqs`](docs/workflows/faqs.md)                 | Product-specific FAQ set, saved as a `.txt` file                                                                 |
| [`generate-how-it-works`](docs/workflows/how-it-works.md) | The step-by-step illustration series showing how a product is used                                               |
| [`generate-ad-creatives`](docs/workflows/ad-creatives.md) | Ad creatives from a [40-template catalogue](docs/ad-template-catalogue.md), with AI or manual template selection |
| [`remix-creative`](docs/workflows/remix-creative.md)      | Rebuilds another brand's ad _layout_ as an AtlasAir creative, stripping their claims                             |

Every workflow accepts a `productKey`, so you don't retype product details:

```json
{ "productKey": "atlasair-2" }
```

| Key             | Product                               |
| --------------- | ------------------------------------- |
| `atlasair-2`    | AtlasAir 2.0 (flagship device)        |
| `atlasair-plus` | AtlasAir+ (original device)           |
| `first-aid-kit` | Essential First Aid Kit               |
| `cpr-course`    | Emergency CPR + Choking Rescue Course |

For anything outside the catalogue, pass `productTitle` + `productDescription` instead. Either field
also overrides a preset when both are given. [Running workflows](docs/running-workflows.md) has a
recipe for each workflow.

## The honesty policy

AtlasAir competes on being trustworthy:

- **Nothing is invented to fill a layout.** That means no statistics, ratings, reviews, testimonials,
  certifications or press mentions.
- **No manufactured urgency.**
- **Social proof comes from real Judge.me data only.**
- **Deceptive ad templates are blocked.**
- **Every surface carries the safety framing.** These are airway-clearance aids, not a substitute
  for medical care.

For the image workflows, the key rules are **enforced in code**:

- [`brand/template-policy.ts`](src/mastra/brand/template-policy.ts) blocks deceptive templates and
  gates review templates on real data.
- [`brand/remix-policy.ts`](src/mastra/brand/remix-policy.ts) strips competitors' stats, badges,
  reviews and urgency.

For the text workflows (copy, FAQs, how-it-works), the rules are **prompt instructions**, so review
the output before publishing. [Brand and policy](docs/brand-and-policy.md) lists exactly which rules
are which.

## Where outputs go

- Product copy and FAQs are written as `.txt` files to `ASSET_OUTPUT_ROOT`, which defaults to
  `~/Desktop/AtlasAirAssets`.
- Images go to Supabase Storage (bucket `SUPABASE_BUCKET`) by default, or locally with
  `"storageDestination": "local"`. Each run writes a `manifest.json`.
- Nothing is published automatically. People move each output into Shopify, landing pages and ad
  accounts by hand. [Landing pages](docs/landing-pages.md) shows where each one goes.

## Project structure

| Path                   | Description                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- |
| `src/mastra/brand`     | Brand voice, product catalogue, shared prompt blocks, template and remix policy |
| `src/mastra/agents`    | The content-generation agents                                                   |
| `src/mastra/workflows` | Multi-step workflows, one directory each with its steps                         |
| `src/mastra/tools`     | Image generation, file writing, Supabase upload, template lookup                |
| `src/mastra/schemas`   | Zod input/output schemas per workflow                                           |
| `src/mastra/utils`     | Supabase client + the 40-template prompt catalogue                              |
| `src/mastra/index.ts`  | Where agents, workflows and tools are registered                                |
| `docs/`                | Team documentation                                                              |

[Architecture](docs/architecture.md) explains how it fits together, and [Extending](docs/extending.md)
covers adding products, templates, rules and workflows.

## Learn more

- [Mastra documentation](https://mastra.ai/docs/)
- [Mastra Studio](https://mastra.ai/docs/getting-started/studio)
