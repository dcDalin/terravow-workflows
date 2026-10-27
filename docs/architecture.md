# Architecture

How the Mastra runtime is set up here, and the patterns every workflow follows. Read
[Overview](overview.md) first.

> Mastra's APIs change between versions. This repo is on `@mastra/core` 1.21 (`^1.17.0` in
> `package.json`). Before changing Mastra code, check the docs that ship in
> `node_modules/@mastra/*/dist/docs/`. The `mastra` skill in `.agents/skills/mastra/` explains how.

## The Mastra instance

[`src/mastra/index.ts`](../src/mastra/index.ts) builds the single `Mastra` instance.

| Part              | Configuration                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workflows**     | `generateAdCreativesWorkflow`, `generateHowItWorksWorkflow`, `generateFaqsWorkflow`, `generateProductCopyWorkflow`, `remixCreativeWorkflow`                                                        |
| **Agents**        | `productAnalyzerAgent`, `howItWorksAgent`, `faqsAgent`, `productCopyAgent`, `creativeRemixAgent`. Steps look them up with `mastra.getAgent("<id>")`, so a missing registration fails at run time   |
| **Tools**         | `processImageInputTool`, `generateImageGeminiTool`, `writeFileTool`, `ensureDirectoryTool`, `uploadToSupabaseTool`. Registered so they appear in Studio; steps import and call them directly       |
| **Storage**       | `MastraCompositeStore`: `LibSQLStore` at `file:./mastra.db` for workflow runs and snapshots, and a `DuckDBStore` at `./observability.duckdb` for the `observability` domain (traces and logs)      |
| **Logger**        | `PinoLogger`, level `info`. Steps log with `console.log`, which shows in the dev server terminal                                                                                                   |
| **Observability** | `DefaultExporter` (traces into storage, viewable in Studio), `CloudExporter` (only active when `MASTRA_CLOUD_ACCESS_TOKEN` is set), and `SensitiveDataFilter` (redacts keys and tokens from spans) |

`index.ts` uses **top-level `await`** (`await duckdbStore.getStore("observability")`). That works
because the package is ESM (`"type": "module"`, `module: ES2022`). It also means that importing
`mastra` opens the DuckDB file.

### Where `./mastra.db` actually is

The storage paths are relative, so they resolve against the **server's working directory**:

| Command         | Working directory    | Databases end up in                                   |
| --------------- | -------------------- | ----------------------------------------------------- |
| `npm run dev`   | `src/mastra/public/` | `src/mastra/public/mastra.db`, `observability.duckdb` |
| `npm run start` | `.mastra/output/`    | `.mastra/output/…`, separate from dev's               |

`mastra build` copies `src/mastra/public/` into the build output. Anything sitting there, including
the dev databases and any local asset output, gets bundled. DuckDB allows one writer at a time, so
only one server process can open it.

## How a workflow is built

Each workflow lives in `src/mastra/workflows/<name>/`:

```
generate-how-it-works/
├── index.ts          # createWorkflow(...) chain + commit()
└── steps/
    ├── generate-how-it-works-steps-step.ts
    ├── generate-how-it-works-image-step.ts
    └── save-how-it-works-step.ts
```

Its schemas live in `src/mastra/schemas/<name>-types.ts`. The pattern, from
[`generate-how-it-works/index.ts`](../src/mastra/workflows/generate-how-it-works/index.ts):

```ts
createWorkflow({
  id,
  description,
  inputSchema,
  outputSchema,
  retryConfig: { attempts: 3, delay: 2000 },
})
  .then(generateStepsStep) // agent call → structured JSON
  .map(async ({ inputData }) => items) // fan out: one self-contained item per image
  .foreach(generateImageStep, { concurrency: 3 })
  .map(async ({ inputData, getStepResult }) => ({
    originalInput: getStepResult(generateStepsStep).originalInput,
    images: inputData,
  }))
  .then(saveStep); // manifest
workflow.commit();
```

The conventions:

- **`description` is the operator's help text.** It is shown in Studio, so it contains a quick-start
  JSON and the fixed rules. Keep it in sync with the docs.
- **Pass `originalInput` along.** The first step returns `{ originalInput: inputData, … }` so later
  steps and `.map`s can read the run input.
- **`.map` steps hold glue logic:** working out the output folder, fanning out into items, and
  collecting results. `getStepResult(step)` reads an earlier step's output when the previous step's
  output doesn't carry it.
- **Each foreach item is self-contained.** An item carries everything it needs: prompt, aspect ratio,
  size, output folder, destination and reference image URLs. It saves its own file the moment the
  image arrives, so a crash mid-batch loses at most the images in flight.
- **Workflow state holds URLs, never base64.** Workflow state is snapshotted to LibSQL after each
  step. `process-assets` checks that the images can be fetched, then keeps only URLs. Each
  `generate-*-image` step re-fetches its reference images just before calling Gemini. That costs extra
  fetches but stops `mastra.db` from growing by megabytes per run.
- **Steps call tools directly with `tool.execute!(input, { requestContext, mastra })`**, not through
  an agent. When input validation fails, `execute` _returns_ an error object rather than throwing.
  That's why steps check `"imageData" in result` / `"success" in result` and throw "Invalid result
  from … tool".
- **Agents return JSON as text.** Steps strip optional code fences, then `JSON.parse` and
  `schema.parse` the result. A parse failure throws, and the step's retries run the call again.

### Retries and concurrency

- `retryConfig.attempts` is the number of **retries**, so `attempts: 2` gives 3 runs in total. It
  applies to every step, and to each foreach item separately.

  | Workflow            | `attempts` | Max runs per step |
  | ------------------- | ---------- | ----------------- |
  | product copy, FAQs  | 2          | 3                 |
  | how-it-works, remix | 3          | 4                 |
  | ad creatives        | 5          | 6                 |

- `.foreach(step, { concurrency: 3 })` runs items in **fixed batches** of 3, each batch waiting for
  the slowest item. The first item that fails for good fails the foreach and the run.
- Generating and uploading happen in the same step. A retry caused by an upload error therefore
  re-runs the paid Gemini call.

## Tools

| Tool                                                                    | Does                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`generate-image-gemini`](../src/mastra/tools/generate-image-gemini.ts) | Calls `gemini-3.1-flash-image-preview` with `responseModalities: ["TEXT","IMAGE"]`, an aspect ratio, a size and up to 14 reference images. Returns raw base64. Aspect ratios accepted: 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9. `imageExtensionForMimeType()` turns its reported `mimeType` into the file extension the image steps use |
| [`process-image-input`](../src/mastra/tools/process-image-input.ts)     | Fetches a public image URL with a browser-like `User-Agent` and returns base64 + mime type                                                                                                                                                                                                                                                                              |
| [`upload-to-supabase`](../src/mastra/tools/upload-to-supabase.ts)       | Uploads to `SUPABASE_BUCKET` with `upsert: true` and returns `getPublicUrl()`, so the bucket must be **public**. Errors come back as `{ success: false }`, not thrown                                                                                                                                                                                                   |
| [`write-file`](../src/mastra/tools/write-file.ts)                       | Writes utf8/base64/binary to disk, creating folders. Errors come back as `{ success: false }`                                                                                                                                                                                                                                                                           |
| [`lookup-template`](../src/mastra/tools/lookup-template.ts)             | `listTemplatesTool`: the ad analyst's view of the full template catalogue. `lookupTemplateTool` is defined but unused                                                                                                                                                                                                                                                   |
| [`ensure-directory`](../src/mastra/tools/ensure-directory.ts)           | `mkdir -p`. Registered, but no workflow uses it                                                                                                                                                                                                                                                                                                                         |

[`utils/supabase.ts`](../src/mastra/utils/supabase.ts) exports `STORAGE_BUCKET` and
`getSupabaseClient()`, which builds a service-role client on every call. The service-role key
bypasses row-level security, so keep it server-side.

## Storage paths

Local and Supabase paths are both derived from one `outputDirectory`:

```
outputDirectory = input.outputDirectory || resolve(BRAND.assetRoot, <sanitized title>[-remix], Date.now())
local file      = <outputDirectory>/<file>
supabase object = <last two segments of outputDirectory>/<file>        → "<title>/<timestamp>/<file>"
manifest        = folder of the first image + "/manifest.json"
```

`<sanitized title>` is the product title lowercased, with anything outside `[a-zA-Z0-9-_]` turned into
`-`. For example, `AtlasAir 2.0` becomes `atlasair-2-0`, and `AtlasAir+` becomes `atlasair-`.

## Tests

There are none. `npm test` is the npm placeholder that exits with an error. Changes are checked with:

- `npm run build`, which bundles but does not type-check
- `npx tsc --noEmit`, which currently has 4 errors that were already there
- running the workflow in Studio

See [Extending → verifying a change](extending.md#verifying-a-change).
