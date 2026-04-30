import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client — runs only in Server Components and Route Handlers, never in the browser.
// Uses the service role key to bypass Row Level Security for admin operations.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}
