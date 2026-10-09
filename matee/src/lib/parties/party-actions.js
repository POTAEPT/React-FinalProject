"use server";

import { revalidatePath } from "next/cache";

import { fail } from "@/lib/action-result";
import {
  findConflict,
  getMyCommitments,
  timeConflictResult,
} from "@/lib/parties/my-commitments";
import { createPartySchema, fieldErrorsFromZod } from "@/lib/parties/schema";
import { partyEndMs, partyStartMs } from "@/lib/parties/time";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Host only: edit a party before it starts.
//   - title, category, location, detail, capacity and join mode can change
//   - capacity cannot go below the people already confirmed
//   - date, time and duration can change only while nobody else has joined or
//     asked to join, and the new time is checked against the host's other
//     parties (the parties table only checks conflicts on insert)
//   - switching approve -> public leaves pending requests for the host to decide
// Called from PartyForm as updateParty.bind(null, partyId).
export async function updateParty(partyId, input) {
  if (typeof partyId !== "string" || !uuidPattern.test(partyId)) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  const parsed = createPartySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid",
      fieldErrors: fieldErrorsFromZod(parsed.error),
      message: "ตรวจข้อมูลในฟอร์มอีกครั้ง",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("unauthenticated", "เข้าสู่ระบบก่อน");
  }

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("id, owner_id, status, event_date, event_time, duration_minutes, confirmed_count")
    .eq("id", partyId)
    .maybeSingle();

  if (partyError) {
    console.error("load party for update", partyError.message);
    return fail("unknown", "บันทึกไม่สำเร็จ ลองอีกครั้ง");
  }

  if (!party) {
    return fail("not_found", "ไม่พบตี้นี้");
  }

  if (party.owner_id !== user.id) {
    return fail("not_host", "เฉพาะเจ้าของตี้เท่านั้น");
  }

  if (party.status === "cancelled") {
    return fail("cancelled", "ตี้นี้ถูกยกเลิกแล้ว แก้ไขไม่ได้");
  }

  if (partyStartMs(party.event_date, party.event_time) <= Date.now()) {
    return fail("started", "ตี้เริ่มไปแล้ว แก้ไขไม่ได้");
  }

  const values = parsed.data;

  if (values.maxMembers < party.confirmed_count) {
    return {
      ok: false,
      code: "invalid",
      fieldErrors: {
        maxMembers: `ตอนนี้มีสมาชิก ${party.confirmed_count} คน ตั้งต่ำกว่านี้ไม่ได้`,
      },
      message: "ตรวจข้อมูลในฟอร์มอีกครั้ง",
    };
  }

  const scheduleChanged =
    values.eventDate !== party.event_date ||
    values.eventTime !== String(party.event_time).slice(0, 5) ||
    values.durationMinutes !== party.duration_minutes;

  if (scheduleChanged) {
    const { count, error: countError } = await supabase
      .from("party_members")
      .select("id", { count: "exact", head: true })
      .eq("party_id", party.id)
      .neq("user_id", user.id)
      .in("status", ["pending", "confirmed"]);

    if (countError) {
      console.error("count members for update", countError.message);
      return fail("unknown", "บันทึกไม่สำเร็จ ลองอีกครั้ง");
    }

    if (count > 0) {
      return fail(
        "schedule_locked",
        "มีคนเข้าร่วมหรือขอเข้าร่วมแล้ว จึงเปลี่ยนวันเวลาไม่ได้",
      );
    }

    const conflict = findConflict(
      await getMyCommitments(supabase, user.id),
      partyStartMs(values.eventDate, values.eventTime),
      partyEndMs(values.eventDate, values.eventTime, values.durationMinutes),
      party.id,
    );

    if (conflict) {
      return timeConflictResult(conflict);
    }
  }

  const update = {
    title: values.title,
    category: values.category,
    custom_category: values.category === "other" ? values.customCategory : null,
    location: values.location,
    detail: values.detail,
    max_members: values.maxMembers,
    join_mode: values.joinMode,
    ...(scheduleChanged
      ? {
          event_date: values.eventDate,
          event_time: values.eventTime,
          duration_minutes: values.durationMinutes,
        }
      : {}),
  };

  const { error } = await supabase.from("parties").update(update).eq("id", party.id);

  if (error) {
    if (error.code === "42501") {
      return fail("not_allowed", "บัญชีนี้แก้ไขตี้ไม่ได้");
    }

    console.error("update party", error.message);
    return fail("unknown", "บันทึกไม่สำเร็จ ลองอีกครั้ง");
  }

  revalidatePath("/");
  revalidatePath(`/party/${party.id}`);
  revalidatePath(`/manage/${party.id}`);
  revalidatePath("/my-party");

  return { ok: true, id: party.id };
}
