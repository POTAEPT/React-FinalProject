import { PartyCard } from "@/components/party-card";
import { findConflict } from "@/lib/parties/my-commitments";
import { listParties } from "@/lib/parties/queries";

export async function PartyFeed({ filters, emptyMessage }) {
  const result = await listParties(filters);

  if (!result.ok && result.reason === "unconfigured") {
    return (
      <p className="m-4 rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6 text-muted">
        ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
      </p>
    );
  }

  if (!result.ok) {
    return (
      <p role="alert" className="m-4 rounded-3xl border border-line bg-card px-4 py-8 text-center text-sm">
        โหลดรายการตี้ไม่สำเร็จ
      </p>
    );
  }

  if (result.parties.length === 0) {
    return (
      <p className="m-4 rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6 text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {result.parties.map((party) => (
          <li key={party.id}>
            <PartyCard
              party={party}
              conflict={findConflict(result.commitments, party.startMs, party.endMs, party.id)}
            />
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-8 text-center text-sm text-muted">
        ดูครบทุกตี้แล้ว
      </p>
    </>
  );
}
