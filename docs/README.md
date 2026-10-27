# AtlasAir workflows documentation

How the AtlasAir content workflows work, how to run them, and how their output becomes product pages,
landing pages and ads.

## Start here

**Running workflows** (marketing, content, ops):

1. [Overview](overview.md): what the five workflows produce
2. [Running workflows](running-workflows.md): copy-paste recipes, finding your files, the pre-publish checklist, troubleshooting
3. [Ad template catalogue](ad-template-catalogue.md): every ad template, with a sample image
4. [Brand and policy](brand-and-policy.md): the brand and safety rules, social proof, and how remixes are rewritten
5. [Landing pages](landing-pages.md): where each output goes on Shopify and LPs

**Working on the code** (engineering):

1. [Overview](overview.md)
2. [Getting started](getting-started.md): setup, environment variables, the traps
3. [Architecture](architecture.md): the Mastra setup, workflow patterns, storage paths, retries
4. Workflow reference, one page each:
   - [product copy](workflows/product-copy.md)
   - [FAQs](workflows/faqs.md)
   - [how it works](workflows/how-it-works.md)
   - [ad creatives](workflows/ad-creatives.md)
   - [remix creative](workflows/remix-creative.md)
5. [Brand and policy](brand-and-policy.md)
6. [Extending](extending.md): add a product, template, brand rule or workflow
7. [Known issues](known-issues.md): verified bugs and gaps, with suggested fixes

## Keeping these docs current

- If you change a workflow's inputs, steps or outputs, update its page in `workflows/` and the
  `description` string in its `index.ts` in the same PR. Operators read that description in Studio.
- The [ad template catalogue](ad-template-catalogue.md) table is generated. Regenerate it rather
  than hand-editing.
- When you fix something on the [Known issues](known-issues.md) page, delete its entry and any
  workarounds that link to it.
- Link to source files and symbols, not line numbers, because line numbers go stale.
