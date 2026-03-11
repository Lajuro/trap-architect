import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // During SSR prerendering or when env vars are placeholders, use a safe URL
  const isValidUrl = supabaseUrl.startsWith("https://") || supabaseUrl.startsWith("http://");
  const url = isValidUrl ? supabaseUrl : "https://placeholder.supabase.co";
  const key = isValidUrl ? supabaseKey : "placeholder-key";

  _client = createBrowserClient(url, key);
  return _client;
}
