
import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather';
import { generateAdCreativesWorkflow } from './workflows/generate-ad-creatives';
import { generateHowItWorksWorkflow } from './workflows/generate-how-it-works';
import { generateFaqsWorkflow } from './workflows/generate-faqs';
import { weatherAgent } from './agents/weather-agent';
import { productAnalyzerAgent } from './agents/product-analyzer-agent';
import { howItWorksAgent } from './agents/how-it-works-agent';
import { faqsAgent } from './agents/faqs-agent';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';
import { processImageInputTool } from './tools/process-image-input';
import { generateImageGeminiTool } from './tools/generate-image-gemini';
import { writeFileTool } from './tools/write-file';
import { ensureDirectoryTool } from './tools/ensure-directory';
import { uploadToSupabaseTool } from './tools/upload-to-supabase';

const duckdbStore = new DuckDBStore({ path: './observability.duckdb' });

export const mastra = new Mastra({
  workflows: { weatherWorkflow, generateAdCreativesWorkflow, generateHowItWorksWorkflow, generateFaqsWorkflow },
  agents: { weatherAgent, productAnalyzerAgent, howItWorksAgent, faqsAgent },
  tools: {
    processImageInputTool,
    generateImageGeminiTool,
    writeFileTool,
    ensureDirectoryTool,
    uploadToSupabaseTool,
  },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: 'file:./mastra.db',
    }),
    domains: {
      // Observability traces/logs go to DuckDB (OLAP, handles high volume)
      // so image generation runs don't bloat mastra.db
      observability: await duckdbStore.getStore('observability'),
    },
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
