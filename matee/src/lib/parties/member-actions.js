"use server";

import { revalidatePath } from "next/cache";

import {
  findConflict,
  getMyCommitments,
  timeConflictResult,
} from "@/lib/parties/my-commitments";
import { partyEndMs, partyStartMs } from "@/lib/parties/time";
import { createClient } from "@/lib/supabase/server";

const partyIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(code, message) {
  return { ok: false, code, message };
}

function revalidateParty(partyId) {
  revalidatePath("/");
  revalidatePath(`/party/${partyId}`);
  revalidatePath("/my-party");
}

// The signed-in user and the party they are acting on, or a failure result.
async function loadContext(partyId) {
  if (typeof partyId !== "string" || !partyIdPattern.test(partyId)) {
    return { error: fail("not_found", "ไม่พบตี้นี้") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: fail("unauthenticated", "เข้าสู่ระบบก่อน") };
  }

  const { data: party, error } = await supabase
    .from("parties")
    .select(
      "id, owner_id, title, join_mode, event_date, event_time, duration_minutes, max_members, confirmed_count, status",
    )
    .eq("id", partyId)
    .maybeSingle();

  if (error) {
    console.error("load party for member action", error.message);
    return { error: fail("unknown", "ทำรายการไม่สำเร็จ ลองอีกครั้ง") };
  }

  if (!party) {
    return { error: fail("not_found", "ไม่พบตี้นี้") };
  }

  return { supabase, user, party };
}

async function conflictFor(supabase, userId, party) {
  const commitments = await getMyCommitments(supabase, userId);

  return findConflict(
    commitments,
    partyStartMs(party.event_date, party.event_time),
    partyEndMs(party.event_date, party.event_time, party.duration_minutes),
    party.id,
  );
}

async function joinErrorFromDatabase(error, supabase, userId, party) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  if (text.includes("Time conflict")) {
    // A race: the commitment appeared after our own check. Name it if we can.
    return timeConflictResult(await conflictFor(supabase, userId, party));
  }

  if (text.includes("Party is full")) {
    return fail("full", "ตี้นี้เต็มแล้ว");
  }

  if (error.code === "42501") {
    // RLS: banned, started, or no longer open by the time the row was written.
    return fail("not_allowed", "เข้าร่วมตี้นี้ไม่ได้");
  }

  console.error("join party", error.message);
  return fail("unknown", "เข้าร่วมไม่สำเร็จ ลองอีกครั้ง");
}

// Public party: the member is confirmed at once. Approve party: pending until the
// host decides. Someone who left before gets their old row back; a rejected row
// stays closed until the host changes it. The database repeats every check here
// (join policies, capacity and time-conflict triggers); this gives clear errors.
export async function joinParty(partyId) {
  const context = await loadContext(partyId);

  if (context.error) {
    return context.error;
  }

  const { supabase, user, party } = context;

  if (party.owner_id === user.id) {
    return fail("host", "คุณเป็นเจ้าของตี้นี้อยู่แล้ว");
  }

  if (party.status === "cancelled") {
    return fail("cancelled", "เจ้าของตี้ยกเลิกตี้นี้แล้ว");
  }

  if (partyStartMs(party.event_date, party.event_time) <= Date.now()) {
    return fail("started", "ตี้นี้เริ่มไปแล้ว");
  }

  if (party.confirmed_count >= party.max_members) {
    return fail("full", "ตี้นี้เต็มแล้ว");
  }

  const { data: existing, error: existingError } = await supabase
    .from("party_members")
    .select("id, status")
    .eq("party_id", party.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("load own member row", existingError.message);
    return fail("unknown", "เข้าร่วมไม่สำเร็จ ลองอีกครั้ง");
  }

  if (existing?.status === "rejected") {
    return fail("rejected", "เจ้าของตี้ปฏิเสธคำขอของคุณแล้ว");
  }

  if (existing?.status === "pending" || existing?.status === "confirmed") {
    return { ok: true, status: existing.status };
  }

  const conflict = await conflictFor(supabase, user.id, party);

  if (conflict) {
    return timeConflictResult(conflict);
  }

  const status = party.join_mode === "public" ? "confirmed" : "pending";
  const { error } = existing
    ? await supabase.from("party_members").update({ status }).eq("id", existing.id)
    : await supabase
        .from("party_members")
        .insert({ party_id: party.id, user_id: user.id, status });

  if (error) {
    return joinErrorFromDatabase(error, supabase, user.id, party);
  }

  revalidateParty(party.id);

  return { ok: true, status };
}

// Leaving sets the user's own row to cancelled, for a pending request and a
// confirmed member alike. The host cannot leave; they cancel the party instead.
export async function leaveParty(partyId) {
  const context = await loadContext(partyId);

  if (context.error) {
    return context.error;
  }

  const { supabase, user, party } = context;

  if (party.owner_id === user.id) {
    return fail("host", "เจ้าของตี้ออกจากตี้ไม่ได้ ใช้การยกเลิกตี้แทน");
  }

  const { data, error } = await supabase
    .from("party_members")
    .update({ status: "cancelled" })
    .eq("party_id", party.id)
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"])
    .select("id");

  if (error) {
    console.error("leave party", error.message);
    return fail("unknown", "ออกจากตี้ไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!data?.length) {
    return fail("not_member", "คุณไม่ได้อยู่ในตี้นี้");
  }

  revalidateParty(party.id);

  return { ok: true, status: "cancelled" };
}
