import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Storage bucket that generated assets are uploaded to.
 *
 * Set SUPABASE_BUCKET to point at an AtlasAir-named bucket once one exists. The
 * default is the original bucket, so existing uploads and public URLs keep
 * working until that bucket is created.
 */
export const STORAGE_BUCKET = process.env.SUPABASE_BUCKET ?? "TerraVow";

/**
 * Get a Supabase client for server-side operations
 * This is a simple Node.js client that uses the service role key from environment variables
 * The service role key has full privileged access to bypass RLS policies
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
