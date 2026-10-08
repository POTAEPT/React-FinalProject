import Link from "next/link";

import { mockAdminPartyDetails, USE_ADMIN_MOCK_DATA } from "@/app/test/admin-mock-data";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "รายละเอียดตี้ | ผู้ดูแลระบบ" };

async function loadParty(id) {
  if (USE_ADMIN_MOCK_DATA) return mockAdminPartyDetails;

  const supabase = await createClient();
  const [{ data: party, error: partyError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase
      .from("parties")
      .select("id, title, category, detail, event_date, event_time, location, status, profiles!parties_owner_id_fkey(display_name)")
      .eq("id", id)
      .single(),
    supabase
      .from("party_messages")
      .select("id, body, created_at, profiles!party_messages_sender_id_fkey(display_name)")
      .eq("party_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (partyError || messagesError) throw new Error("โหลดรายละเอียดตี้ไม่สำเร็จ");

  return {
    ...party,
    owner: party.profiles?.display_name ?? "ไม่ทราบชื่อ",
    description: party.detail,
    messages: (messages ?? []).map((message) => ({
      ...message,
      author: message.profiles?.display_name ?? "ไม่ทราบชื่อ",
    })),
  };
}

export default async function AdminPartyDetailPage({ params }) {
  // Temporarily disabled for UI review. Restore before enabling the real admin API.
  // await requireAdmin();
  const { id } = await params;
  const party = await loadParty(id);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link href="/admin/parties" className="text-sm text-accent hover:underline">← กลับรายการตี้</Link>
      <div className="mt-4 rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{party.category} · เจ้าของ {party.owner}</p>
            <h1 className="mt-1 text-3xl font-semibold">{party.title}</h1>
            <p className="mt-3 text-muted">{party.description}</p>
          </div>
          <span className="rounded-full bg-background px-3 py-1 text-sm">{party.status}</span>
        </div>
        <p className="mt-5 text-sm">{party.event_date} เวลา {party.event_time} · {party.location}</p>
      </div>
      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">ประวัติข้อความในแชต</h2>
        <div className="mt-4 grid gap-3">
          {party.messages.map((message) => (
            <article key={message.id} className="rounded-xl bg-background p-4">
              <div className="flex justify-between gap-3 text-sm">
                <strong>{message.author}</strong>
                <time className="text-muted">{new Date(message.created_at).toLocaleString("th-TH")}</time>
              </div>
              <p className="mt-2">{message.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
