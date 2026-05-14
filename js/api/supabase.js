const { createClient } = supabase;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Environment variables not loaded!");
  console.error("Make sure:");
  console.error("1. Your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  console.error('2. You\'re running with "npm run dev" (Vite dev server)');
  console.error("3. Variables have VITE_ prefix");
  throw new Error("Missing Supabase configuration");
}

export const client = createClient(supabaseUrl, supabaseKey);
