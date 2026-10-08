"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUuid(value, fieldName) {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new Error(`${fieldName} ไม่ถูกต้อง`);
  }

  return value;
}

function actionError(error, fallback) {
  console.error(fallback, error);
  return { ok: false, error: fallback };
}

export async function cancelPartyAsAdmin(partyId) {
  await requireAdmin();
  const id = requireUuid(partyId, "รหัสตี้");
  const supabase = await createClient();

  const { error } = await supabase
    .from("parties")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "open");

  if (error) return actionError(error, "ยกเลิกตี้ไม่สำเร็จ");

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/parties");
  revalidatePath(`/party/${id}`);
  revalidatePath("/my-party");
  return { ok: true };
}

export async function deletePartyAsAdmin(partyId) {
  await requireAdmin();
  const id = requireUuid(partyId, "รหัสตี้");
  const supabase = await createClient();

  const { error } = await supabase.from("parties").delete().eq("id", id);

  if (error) return actionError(error, "ลบตี้ไม่สำเร็จ");

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/parties");
  revalidatePath(`/admin/parties/${id}`);
  revalidatePath("/my-party");
  return { ok: true };
}

export async function setUserBannedAsAdmin(userId, banned) {
  await requireAdmin();
  const id = requireUuid(userId, "รหัสผู้ใช้");

  if (typeof banned !== "boolean") {
    throw new Error("สถานะแบนไม่ถูกต้อง");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ banned_at: banned ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return actionError(error, banned ? "แบนผู้ใช้ไม่สำเร็จ" : "ยกเลิกแบนผู้ใช้ไม่สำเร็จ");

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteMessageAsAdmin(messageId, partyId) {
  await requireAdmin();
  const message = requireUuid(messageId, "รหัสข้อความ");
  const party = requireUuid(partyId, "รหัสตี้");
  const supabase = await createClient();

  const { error } = await supabase
    .from("party_messages")
    .delete()
    .eq("id", message)
    .eq("party_id", party);

  if (error) return actionError(error, "ลบข้อความไม่สำเร็จ");

  revalidatePath("/admin");
  revalidatePath(`/admin/parties/${party}`);
  revalidatePath(`/party/${party}`);
  return { ok: true };
}
