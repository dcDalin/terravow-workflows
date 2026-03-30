
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { generateAdCreativesWorkflow } from './workflows/generate-ad-creatives-workflow';
import { weatherAgent } from './agents/weather-agent';
import { productAnalyzerAgent } from './agents/product-analyzer-agent';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';
import { processImageInputTool } from './tools/process-image-input';
import { generateImageGeminiTool } from './tools/generate-image-gemini';
import { writeFileTool } from './tools/write-file';
import { ensureDirectoryTool } from './tools/ensure-directory';
import { uploadToSupabaseTool } from './tools/upload-to-supabase';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, generateAdCreativesWorkflow },
  agents: { weatherAgent, productAnalyzerAgent },
  tools: {
    processImageInputTool,
    generateImageGeminiTool,
    writeFileTool,
    ensureDirectoryTool,
    uploadToSupabaseTool,
  },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into persistent file storage
    url: "file:./mastra.db",
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
