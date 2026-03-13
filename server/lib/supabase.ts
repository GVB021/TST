
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

if (!supabaseConfigured) {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Uploads to Supabase will fail.");
}

export const supabase = createClient(
  supabaseUrl || "https://supabase.invalid",
  supabaseServiceRoleKey || "invalid-service-role-key"
);

export async function uploadFile(bucket: string, path: string, buffer: Buffer, contentType: string) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured");
  }
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}
