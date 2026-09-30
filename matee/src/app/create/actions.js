"use server";

import { revalidatePath } from "next/cache";

import {
  createPartySchema,
  fieldErrorsFromZod,
} from "@/lib/parties/schema";
import { createClient } from "@/lib/supabase/server";

function messageFromDatabase(error) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  if (text.includes("Time conflict")) {
    return "เวลานี้ชนกับตี้ที่คุณมีอยู่แล้ว";
  }

  if (error.code === "23503") {
    return "บัญชีนี้ยังไม่มีโปรไฟล์";
  }

  if (error.code === "42501" || text.toLowerCase().includes("banned")) {
    return "บัญชีนี้สร้างตี้ไม่ได้";
  }

  return "สร้างตี้ไม่สำเร็จ ลองอีกครั้ง";
}

export async function createParty(input) {
  const parsed = createPartySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFromZod(parsed.error),
      message: "ตรวจข้อมูลในฟอร์มอีกครั้ง",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "เข้าสู่ระบบก่อนตั้งตี้" };
  }

  const party = parsed.data;
  const { data, error } = await supabase
    .from("parties")
    .insert({
      owner_id: user.id,
      title: party.title,
      category: party.category,
      custom_category: party.category === "other" ? party.customCategory : null,
      join_mode: party.joinMode,
      event_date: party.eventDate,
      event_time: party.eventTime,
      duration_minutes: party.durationMinutes,
      location: party.location,
      max_members: party.maxMembers,
      detail: party.detail,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error ? messageFromDatabase(error) : "สร้างตี้ไม่สำเร็จ ลองอีกครั้ง",
    };
  }

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath(`/categories/${party.category}`);

  return { ok: true, id: data.id };
}
