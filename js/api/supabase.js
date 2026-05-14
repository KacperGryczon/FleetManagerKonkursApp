const { createClient } = supabase;

const supabaseUrl = "https://ljgaynalrpmhqagqucdb.supabase.co";
const supabaseKey = "sb_publishable_fI4hiqkxxSqxFp0gx9E7OA_GCKQPwPt";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Environment variables not loaded!");
  console.error("Make sure:");
  console.error("1. Your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  console.error('2. You\'re running with "npm run dev" (Vite dev server)');
  console.error("3. Variables have VITE_ prefix");
  throw new Error("Missing Supabase configuration");
}

export const client = createClient(supabaseUrl, supabaseKey);
