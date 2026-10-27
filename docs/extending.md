# Extending

Recipes for the changes people make most often, listing every file each one touches. Read
[Architecture](architecture.md) first.

> **Before changing Mastra code** (workflows, steps, agents, tools), load the `mastra` skill or read
> the docs installed in `node_modules/@mastra/core/dist/docs/`. Mastra's APIs change between
> versions, and remembered patterns are often out of date. `AGENTS.md` makes this a rule for AI
> assistants, and it's good advice for people too.

## Add a product

1. **[`brand/products.ts`](../src/mastra/brand/products.ts):**
   - Add the key to `PRODUCT_KEYS`.
   - Add an entry to `PRODUCT_CATALOG` with `title`, `shortName`, `type` (`device` | `kit` |
     `digital`), `ships`, `ageRange`, `summary`, `features` and `whatsIncluded`.
   - TypeScript makes you do both, because `PRODUCT_CATALOG` is a `Record<ProductKey, …>`.
2. **Zod enums update themselves.** Every schema uses `z.enum(PRODUCT_KEYS)`.
3. **Update the hand-written key lists** in the help text Studio shows:
   - the `productKey` `.describe(...)` strings in all five `src/mastra/schemas/*-types.ts` files
   - the `Product keys:` line in the `description` of `generate-ad-creatives`, `generate-faqs`,
     `generate-how-it-works` and `generate-product-copy` (`workflows/*/index.ts`)
4. **Update the docs:** the product tables in `README.md`, [Running workflows](running-workflows.md)
   and [Brand and policy](brand-and-policy.md#product-catalogue).
5. **Check choking-specific wording** if the product isn't a choking device. All of these assume one:
   - `BRAND.safetyDisclaimer`
   - the before/after and `[PROBLEM VISUAL]` mappings in `customize-prompts-step.ts`
   - the how-it-works and product-copy agent instructions

   `type: "digital"` switches the FAQ question mix and tells prompts not to mention shipping.

Features are the only claims creatives and remixes may make about a product, so write them as plain,
true statements.

## Add an ad template

1. **Add an entry to `PROMPT_CREATIVE_MAPPINGS`** in
   [`utils/prompt-creative-mapping.ts`](../src/mastra/utils/prompt-creative-mapping.ts):
   - `prompt: { id, name, category, aspectRatio, tags, promptText }` and
     `creative: { fileName, path }`.
   - `aspectRatio` must be `1:1`, `4:5` or `9:16`. `TemplatePrompt` and `generationTaskSchema`
     enforce this.
   - Start `promptText` with the same bracket-instructions line as the other templates.
2. **Add a sample image** to `src/mastra/assets/AdCreatives/`. The `.gitignore` rule `assets`
   matches this folder, so **new files there are ignored silently**. Use `git add -f`. The image is
   for people browsing templates only. It is never sent to the model.
3. **Raise the hard-coded limit of 40:**
   - `templateIds` `.max(40)` and its description in `schemas/ad-creatives-types.ts`
   - `lookupTemplateTool` in `tools/lookup-template.ts`
   - `validateMapping()` in `prompt-creative-mapping.ts`
4. **Map the placeholders you want filled from real data.** The `replacements` map in
   [`customize-prompts-step.ts`](../src/mastra/workflows/generate-ad-creatives/steps/customize-prompts-step.ts)
   fills slots from the product, the analyst's messages, the palette and `socialProof`.
   - **Unmapped placeholders:** anything not in the map, or mapped to `undefined`, is left for the
     image model to fill.
   - **Matching forms:** a key also matches its `[KEY — e.g. …]` and `[KEY, …]` forms.
   - **Repeated slots:** to fill them with different values, give the key an array. The values are
     used in order.
5. **Regenerate** the [template catalogue](ad-template-catalogue.md#keeping-this-page-current).

No agent change is needed. The analyst's `listTemplates` tool reads the mapping directly.

## Change a brand rule

Where the rule needs to live depends on which outputs it should reach:

| To affect                                              | Edit                                                                                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All text agents (copy, FAQs, how-it-works, ad analyst) | `VOICE_RULES` or `BRAND` in [`brand/atlasair.ts`](../src/mastra/brand/atlasair.ts), or `safetyBlock()` in `prompt-blocks.ts`. They reach the agents through `agentPreamble()` |
| Ad creative images                                     | The "ABSOLUTE RULES" block at the end of `customize-prompts-step.ts`. It's inline text                                                                                        |
| Remix images                                           | The "ABSOLUTE CONTENT RULES" in `buildRemixPrompt()` in `plan-remix-tasks-step.ts`. Also inline                                                                               |
| How-it-works images                                    | The "HARD PROHIBITIONS" in `generate-how-it-works-image-step.ts`                                                                                                              |
| Palette, fonts, shape                                  | `BRAND.palette` / `typography` / `shape`. A **new** field must also be added to `visualIdentityBlock()` in [`brand/prompt-blocks.ts`](../src/mastra/brand/prompt-blocks.ts)   |
| Which ad templates the AI picks                        | The selection criteria in [`agents/product-analyzer-agent.ts`](../src/mastra/agents/product-analyzer-agent.ts)                                                                |
| How a remix rewrites each element                      | [`brand/remix-policy.ts`](../src/mastra/brand/remix-policy.ts) (see below)                                                                                                    |

Every rule here is a prompt instruction, so check the output when you change one. See
[Brand and policy](brand-and-policy.md#safety-rules).

## Add a remix element classification

A new classification has to be added in four places, and TypeScript only catches the first:

1. `ElementClassification` and a matching `case` in `decideElement()` in `brand/remix-policy.ts`. The
   switch is exhaustive, so the build fails without the case.
2. `ALL_CLASSIFICATIONS` in the same file. This drives the zod enum and the agent's JSON spec.
3. The classification definitions in
   [`agents/creative-remix-agent.ts`](../src/mastra/agents/creative-remix-agent.ts), so the vision
   agent knows when to use it.
4. If the action is `replace`, a branch in the `switch (classification)` in
   `plan-remix-tasks-step.ts` that supplies the replacement text.

## Add a new workflow

1. **Schemas:** `src/mastra/schemas/<name>-types.ts`. If it's product-based, the input schema includes
   `productKey` / `productTitle` / `productDescription` and calls `resolveProduct()` in the first step.
   Keep it a plain `z.object` with no `.refine()`, so steps can nest and extend it.
2. **Steps:** `src/mastra/workflows/<name>/steps/*.ts`, one `createStep` per file. The first step
   returns `originalInput`.
3. **Workflow:** `src/mastra/workflows/<name>/index.ts` with `createWorkflow({ id, description,
inputSchema, outputSchema, retryConfig })`, the step chain, and `.commit()`. Write `description`
   for operators: a quick-start JSON and the fixed rules.
4. **Agents:** `src/mastra/agents/<name>-agent.ts`, with instructions starting from
   `agentPreamble()` unless there's a reason not to (like the remix vision agent).
5. **Register** the workflow, plus any new agents and tools, in
   [`src/mastra/index.ts`](../src/mastra/index.ts). Steps find agents by id with
   `mastra.getAgent("<id>")`.
6. **For images, copy the existing pattern:**
   - fan out with `.map`
   - `.foreach(step, { concurrency: 3 })`
   - each item saves its own file
   - keep URLs, not base64, in workflow state
   - write a `manifest.json` at the end
7. **Document it:**
   - add `docs/workflows/<name>.md` (copy the structure of an existing page)
   - add a row to [Overview](overview.md)
   - add a recipe to [Running workflows](running-workflows.md)

## Verifying a change

There's no test suite. Before opening a PR:

1. Run `npm run build`. It bundles the server and catches broken imports and syntax.
2. Run `npx tsc --noEmit` to type-check. `npm run build` doesn't. It currently reports 4 errors that
   predate your change (see [Known issues](known-issues.md#the-project-doesnt-type-check-cleanly)).
   Make sure you add no new ones.
3. In Studio (`npm run dev`), run the workflow you changed with a quick-start input, using
   `"storageDestination": "local"` for image workflows. Read the output, open the files, and check
   the trace for each step.
4. If you changed the inputs, steps or outputs, update the matching `docs/workflows/*.md` page and
   the workflow's `description`.
