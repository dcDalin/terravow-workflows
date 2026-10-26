# Getting started

Setting up a machine to run and develop the workflows.

> **Naming:** the brand is **AtlasAir**, but the repo folder and git remote are still called
> `terravow-workflows`, from the store's earlier name. The package name in `package.json` is
> `atlasair-workflows`. They're all the same project.

## Prerequisites

- **Node.js 22.13 or newer** (`engines` in `package.json`). Node 22.18+ is nicer, because it can run
  `.ts` files directly for one-off scripts.
- An **OpenAI API key**, for the GPT-4o agents.
- A **Google AI (Gemini) API key** with access to `gemini-3.1-flash-image-preview`, for the images.
- A **Supabase project** with a **public** Storage bucket, if you'll use `storageDestination:
"supabase"` (the default for image workflows).

## Install and run

```bash
npm install
```

```bash
cp .env.example .env
```

Fill in `.env` (see below), then:

```bash
npm run dev
```

Open [http://localhost:4111](http://localhost:4111) for Mastra Studio. The **Workflows** tab lists
all five workflows. Each one's description includes a quick-start JSON you can paste into the input
box. The dev server reloads when you edit files under `src/mastra/`.

| Script          | What it does                                                                    |
| --------------- | ------------------------------------------------------------------------------- |
| `npm run dev`   | `mastra dev`: Studio + API on port 4111, working directory `src/mastra/public/` |
| `npm run build` | `mastra build`: bundles the server into `.mastra/output/`                       |
| `npm run start` | `mastra start`: runs the built server from `.mastra/output/`                    |
| `npm test`      | Not set up. There are no tests                                                  |

## Environment variables

`npm run dev` loads the **first** of `.env.development`, `.env.local`, `.env` that exists. It doesn't
merge them. `npm run start` reads `.env.production`, then `.env`.

| Variable                    | Needed for                                                            | Read in                                                       | Notes                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`            | Every workflow                                                        | Mastra's model router (`openai/gpt-4o`)                       |                                                                                                                                 |
| `GOOGLE_API_KEY`            | How-it-works, ad creatives, remix                                     | `tools/generate-image-gemini.ts`, `verify-gemini-key-step.ts` | Only the ad-creatives workflow checks it before spending money                                                                  |
| `SUPABASE_URL`              | `storageDestination: "supabase"`                                      | `utils/supabase.ts`                                           | Missing values make every upload fail, and the step retries each time                                                           |
| `SUPABASE_SERVICE_ROLE_KEY` | `storageDestination: "supabase"`                                      | `utils/supabase.ts`                                           | Service-role key: full access, server-side only. Never commit it                                                                |
| `SUPABASE_BUCKET`           | Supabase uploads                                                      | `utils/supabase.ts`                                           | **Code default is `TerraVow`** (the old bucket). `.env.example` sets `AtlasAir`. Whichever you use must exist and be **public** |
| `ASSET_OUTPUT_ROOT`         | Local output (text workflows always; image workflows in `local` mode) | `brand/atlasair.ts`                                           | Default `~/Desktop/AtlasAirAssets`, also used when the value is empty. Use an **absolute** path (see below)                     |
| `MASTRA_CLOUD_ACCESS_TOKEN` | Optional                                                              | `CloudExporter` in `index.ts`                                 | Sends traces to Mastra Cloud. Without it the exporter disables itself                                                           |

> **Use an absolute path for `ASSET_OUTPUT_ROOT`.** Leave it unset or empty for the default. A
> relative path, or one starting with `~`, isn't expanded. It resolves against the dev server's
> working directory instead, so files land under `src/mastra/public/`, which isn't git-ignored and
> gets copied into builds.
>
> ```
> ASSET_OUTPUT_ROOT=/Users/you/Desktop/AtlasAirAssets
> ```

> **Trap: the Supabase bucket must be public.** Uploads return `getPublicUrl()`, which only
> serves files from public buckets. A private bucket accepts the upload, but the links in the run
> output and manifest won't load.

## Your first run

1. Start `npm run dev` and open Studio → **Workflows** → `generate-faqs`. It is the cheapest
   workflow: one GPT-4o call and no images.
2. Paste the input below and run it:

   ```json
   { "productKey": "atlasair-2", "faqCount": 5 }
   ```

3. Watch the step timeline in Studio and the logs in your terminal. The run output shows the FAQs
   and the `filePath` of `faqs.txt`.
4. Try an image workflow in local mode, so you don't need Supabase yet:

   ```json
   { "productKey": "atlasair-2", "stepCount": 4, "storageDestination": "local" }
   ```

   That's `generate-how-it-works`: 1 GPT-4o call + 4 Gemini images. Open the folder from the run
   output's `outputDirectory`.

5. Open the run's trace in Studio's observability view. It shows every agent call, prompt and step
   timing.

[Running workflows](running-workflows.md) has recipes for every workflow.

## Files you shouldn't commit

- `.env`: git-ignored. Keep it that way.
- `src/mastra/public/mastra.db*` and `observability.duckdb*`: the dev databases, git-ignored. They
  change every time the dev server runs.

## Editor and AI-assistant setup

- `AGENTS.md` (also loaded via `CLAUDE.md`) is the brief for AI coding assistants working in this
  repo. It says to load the `mastra` skill (`.agents/skills/mastra/`) before touching Mastra code,
  because Mastra's APIs change quickly between versions.
- The installed Mastra docs live in `node_modules/@mastra/core/dist/docs/`. They match the exact
  installed version, so prefer them to the website.
