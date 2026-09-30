import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const configured = getSupabaseEnv() !== null;

  if (configured) {
    await createClient();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">MaTee</h1>
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        มาตี้กัน — หาตี้ทำกิจกรรมด้วยกัน
      </p>
      <p className="text-sm text-zinc-500">
        {configured
          ? "Supabase client ready"
          : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"}
      </p>
    </main>
  );
}
