"use server";

import { revalidatePath } from "next/cache";

import { fail } from "@/lib/action-result";
import { loadAccount } from "@/lib/auth/account";
import { partyEndMs } from "@/lib/parties/time";
import { createClient } from "@/lib/supabase/server";

// Moderation for /admin. Every action checks the caller is an admin before it
// touches anything, and RLS checks again (is_admin() policies on parties and
// party_messages). Updates and deletes select the changed rows, so a no-op is
// reported, not ok.

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}

async function currentAdmin() {
  const account = await loadAccount();
  return account?.isAdmin ? account : null;
}

const notAdmin = () => fail("not_admin", "เฉพาะผู้ดูแลระบบเท่านั้น");

function revalidateParty(partyId) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/my-party");
  revalidatePath(`/party/${partyId}`);
  revalidatePath(`/manage/${partyId}`);
  revalidatePath("/admin", "layout");
}

// Cancel an open party that has not ended. Members keep the chat for 7 days,
// the same as when the host cancels.
export async function cancelPartyAsAdmin(partyId) {
  if (!isUuid(partyId)) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  if (!(await currentAdmin())) {
    return notAdmin();
  }

  const supabase = await createClient();
  const { data: party, error: loadError } = await supabase
    .from("parties")
    .select("id, status, event_date, event_time, duration_minutes")
    .eq("id", partyId)
    .maybeSingle();

  if (loadError) {
    console.error("admin load party", loadError.message);
    return fail("unknown", "ยกเลิกตี้ไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!party) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  if (party.status === "cancelled") {
    return fail("cancelled", "ตี้นี้ถูกยกเลิกไปแล้ว");
  }

  if (partyEndMs(party.event_date, party.event_time, party.duration_minutes) <= Date.now()) {
    return fail("ended", "ตี้นี้จบไปแล้ว ยกเลิกไม่ได้ ถ้าต้องการเอาออกให้ลบตี้แทน");
  }

  const { data, error } = await supabase
    .from("parties")
    .update({ status: "cancelled" })
    .eq("id", partyId)
    .eq("status", "open")
    .select("id");

  if (error) {
    console.error("admin cancel party", error.message);
    return fail("unknown", "ยกเลิกตี้ไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!data.length) {
    return fail("not_allowed", "ยกเลิกตี้ไม่สำเร็จ ตี้อาจถูกยกเลิกไปแล้ว");
  }

  revalidateParty(partyId);
  return { ok: true };
}

// Delete a party for good. Members, requests and chat go with it (on delete
// cascade). Cannot be undone.
export async function deletePartyAsAdmin(partyId) {
  if (!isUuid(partyId)) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  if (!(await currentAdmin())) {
    return notAdmin();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parties")
    .delete()
    .eq("id", partyId)
    .select("id");

  if (error) {
    console.error("admin delete party", error.message);
    return fail("unknown", "ลบตี้ไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!data.length) {
    return fail("not_found", "ไม่พบตี้นี้ อาจถูกลบไปแล้ว");
  }

  revalidateParty(partyId);
  return { ok: true };
}

// Delete any chat message. Open chat panels drop it through Realtime.
export async function deleteMessageAsAdmin(messageId) {
  if (!isUuid(messageId)) {
    return fail("not_found", "ไม่พบข้อความนี้");
  }

  if (!(await currentAdmin())) {
    return notAdmin();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("party_messages")
    .delete()
    .eq("id", messageId)
    .select("id, party_id");

  if (error) {
    console.error("admin delete message", error.message);
    return fail("unknown", "ลบข้อความไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!data.length) {
    return fail("not_found", "ไม่พบข้อความนี้ อาจถูกลบไปแล้ว");
  }

  revalidatePath(`/admin/parties/${data[0].party_id}`);
  revalidatePath(`/party/${data[0].party_id}`);
  revalidatePath("/admin");
  return { ok: true };
}
