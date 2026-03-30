import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSupabaseClient } from "../utils/supabase";

/**
 * Tool to upload files to Supabase Storage
 * Uploads to the TerraVow bucket and returns the public URL
 */
export const uploadToSupabaseTool = createTool({
  id: "upload-to-supabase",
  description: "Upload files to Supabase Storage in the TerraVow bucket",
  inputSchema: z.object({
    filePath: z
      .string()
      .describe(
        "Path within the bucket (e.g., 'product-name/timestamp/filename.png')"
      ),
    content: z
      .string()
      .describe("File content as base64 string or Buffer-compatible data"),
    contentType: z
      .string()
      .optional()
      .describe("MIME type of the file (e.g., 'image/png', 'application/json')"),
    isBase64: z
      .boolean()
      .default(true)
      .describe("Whether the content is base64 encoded"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    publicUrl: z.string().optional(),
    storagePath: z.string(),
    message: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ filePath, content, contentType, isBase64 }) => {
    try {
      const supabase = getSupabaseClient();

      // Convert content to Buffer
      let buffer: Buffer;
      if (isBase64) {
        // Remove data URL prefix if present
        const base64Data = content.replace(/^data:[\w\/]+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      } else {
        buffer = Buffer.from(content);
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("TerraVow")
        .upload(filePath, buffer, {
          contentType,
          upsert: true, // Allow overwriting if file exists
        });

      if (error) {
        console.error(`❌ Supabase upload error:`, error);
        return {
          success: false,
          storagePath: filePath,
          error: error.message,
          message: `Failed to upload to Supabase: ${error.message}`,
        };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("TerraVow").getPublicUrl(filePath);

      console.log(`✅ Uploaded to Supabase: ${publicUrl}`);

      return {
        success: true,
        publicUrl,
        storagePath: filePath,
        message: `Successfully uploaded to ${publicUrl}`,
      };
    } catch (error) {
      console.error(`❌ Upload to Supabase failed:`, error);
      return {
        success: false,
        storagePath: filePath,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
