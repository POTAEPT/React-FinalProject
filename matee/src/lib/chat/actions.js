"use server";

import { z } from "zod";

import { fail } from "@/lib/action-result";
import { chatState } from "@/lib/chat/expiry";
import { messageColumns, toMessage } from "@/lib/chat/message";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const messageSchema = z
  .string({ error: "พิมพ์ข้อความก่อนส่ง" })
  .trim()
  .min(1, "พิมพ์ข้อความก่อนส่ง")
  .max(500, "ข้อความยาวได้ไม่เกิน 500 ตัวอักษร");

// Sends a message as the signed-in user. Only pending or confirmed members may
// send, and only until the chat expires; the insert policy enforces the same
// rules, this gives clear errors. Returns the stored message so the sender's
// panel can show it before the Realtime event arrives.
export async function sendPartyMessage(partyId, body) {
  if (typeof partyId !== "string" || !uuidPattern.test(partyId)) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return fail("invalid", parsed.error.issues[0]?.message ?? "ข้อความไม่ถูกต้อง");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("unauthenticated", "เข้าสู่ระบบก่อนส่งข้อความ");
  }

  const [partyResult, memberResult] = await Promise.all([
    supabase
      .from("parties")
      .select("id, status, event_date, event_time, duration_minutes, updated_at")
      .eq("id", partyId)
      .maybeSingle(),
    supabase
      .from("party_members")
      .select("status")
      .eq("party_id", partyId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (partyResult.error || memberResult.error) {
    console.error(
      "load party for chat",
      partyResult.error?.message ?? memberResult.error?.message,
    );
    return fail("unknown", "ส่งข้อความไม่สำเร็จ ลองอีกครั้ง");
  }

  const party = partyResult.data;

  if (!party) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  const status = memberResult.data?.status;

  if (status !== "pending" && status !== "confirmed") {
    return fail("not_member", "เข้าร่วมตี้ก่อนจึงจะคุยในแชทได้");
  }

  const state = chatState({
    status: party.status,
    eventDate: party.event_date,
    eventTime: party.event_time,
    durationMinutes: party.duration_minutes,
    updatedAt: party.updated_at,
  });

  if (state.kind === "expired") {
    return fail("expired", "แชทหมดอายุแล้ว");
  }

  const { data, error } = await supabase
    .from("party_messages")
    .insert({ party_id: partyId, user_id: user.id, body: parsed.data })
    .select(messageColumns)
    .single();

  if (error) {
    if (error.code === "42501") {
      // RLS: the membership or the expiry changed after our own check, or banned.
      return fail("not_allowed", "ส่งข้อความในตี้นี้ไม่ได้แล้ว");
    }

    console.error("send party message", error.message);
    return fail("unknown", "ส่งข้อความไม่สำเร็จ ลองอีกครั้ง");
  }

  return { ok: true, message: toMessage(data) };
}

// The host deletes a message in their own party's chat. Everyone with the chat
// open drops it through the Realtime DELETE event. RLS ("owners delete any
// message in their party") checks the same rule; admins delete from /admin.
export async function deletePartyMessage(messageId) {
  if (typeof messageId !== "string" || !uuidPattern.test(messageId)) {
    return fail("not_found", "ไม่พบข้อความนี้");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("unauthenticated", "เข้าสู่ระบบก่อน");
  }

  const { data: message, error: loadError } = await supabase
    .from("party_messages")
    .select("id, party_id, parties(owner_id)")
    .eq("id", messageId)
    .maybeSingle();

  if (loadError) {
    console.error("load message to delete", loadError.message);
    return fail("unknown", "ลบข้อความไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!message) {
    return fail("not_found", "ไม่พบข้อความนี้ อาจถูกลบไปแล้ว");
  }

  if (message.parties?.owner_id !== user.id) {
    return fail("not_host", "เฉพาะเจ้าของตี้เท่านั้นที่ลบข้อความได้");
  }

  const { data, error } = await supabase
    .from("party_messages")
    .delete()
    .eq("id", messageId)
    .select("id");

  if (error) {
    console.error("delete message", error.message);
    return fail("unknown", "ลบข้อความไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!data.length) {
    return fail("not_found", "ไม่พบข้อความนี้ อาจถูกลบไปแล้ว");
  }

  return { ok: true };
}
