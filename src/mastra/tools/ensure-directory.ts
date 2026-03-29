import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { mkdir, access } from "fs/promises";
import { constants } from "fs";

/**
 * Tool to ensure a directory exists
 * Creates the directory and all parent directories if they don't exist
 */
export const ensureDirectoryTool = createTool({
  id: "ensure-directory",
  description: "Ensure a directory exists, creating it and all parent directories if needed",
  inputSchema: z.object({
    directoryPath: z.string().describe("Absolute or relative path to the directory"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    directoryPath: z.string(),
    created: z.boolean().describe("Whether the directory was newly created (false if it already existed)"),
    message: z.string().optional(),
  }),
  execute: async ({ directoryPath }) => {
    try {
      // Check if directory already exists
      let existed = false;
      try {
        await access(directoryPath, constants.F_OK);
        existed = true;
      } catch {
        // Directory doesn't exist, which is fine
      }

      // Create directory (recursive will succeed even if it exists)
      await mkdir(directoryPath, { recursive: true });

      return {
        success: true,
        directoryPath,
        created: !existed,
        message: existed
          ? `Directory already exists: ${directoryPath}`
          : `Created directory: ${directoryPath}`,
      };
    } catch (error) {
      return {
        success: false,
        directoryPath,
        created: false,
        message: `Failed to create directory: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
