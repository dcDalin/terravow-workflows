import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

/**
 * Tool to write files to the filesystem
 * Supports writing text or base64-encoded binary data
 */
export const writeFileTool = createTool({
  id: "write-file",
  description: "Write content to a file on the filesystem. Creates parent directories if needed.",
  inputSchema: z.object({
    filePath: z.string().describe("Absolute or relative path where the file should be written"),
    content: z.string().describe("Content to write (text or base64-encoded data)"),
    encoding: z.enum(["utf8", "base64", "binary"]).default("utf8").describe("Content encoding format"),
    createDirectories: z.boolean().default(true).describe("Whether to create parent directories if they don't exist"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string(),
    bytesWritten: z.number(),
    message: z.string().optional(),
  }),
  execute: async ({ filePath, content, encoding, createDirectories }) => {
    try {
      // Create parent directories if needed
      if (createDirectories) {
        const dir = dirname(filePath);
        await mkdir(dir, { recursive: true });
      }

      // Convert content based on encoding
      let buffer: Buffer;
      if (encoding === "base64") {
        // Remove data URL prefix if present
        const base64Data = content.replace(/^data:[\w\/]+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      } else if (encoding === "binary") {
        buffer = Buffer.from(content, "binary");
      } else {
        buffer = Buffer.from(content, "utf8");
      }

      // Write the file
      await writeFile(filePath, buffer);

      return {
        success: true,
        filePath,
        bytesWritten: buffer.length,
        message: `Successfully wrote ${buffer.length} bytes to ${filePath}`,
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        bytesWritten: 0,
        message: `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
