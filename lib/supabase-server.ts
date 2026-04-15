import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client — runs only in Server Components and Route Handlers, never in the browser.
// Currently uses the anon key (same as the browser client) because all reads are public.
// If admin/service-role operations are needed in the future, use process.env.SUPABASE_SERVICE_ROLE_KEY
// (no NEXT_PUBLIC_ prefix — keep it server-only and never expose it to the client bundle).
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}
