const supabaseUrlKey = "NEXT_PUBLIC_SUPABASE_URL";
const supabaseAnonKeyKey = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export function getSupabaseEnv() {
  const url = process.env[supabaseUrlKey];
  const anonKey = process.env[supabaseAnonKeyKey];

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      `Missing ${supabaseUrlKey} or ${supabaseAnonKeyKey}. Copy matee/.env.example to matee/.env.local.`,
    );
  }

  return env;
}
