"use client";

import { useRouter } from "next/navigation";

import { DeleteMessageButton } from "@/components/chat/DeleteMessageButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  cancelPartyAsAdmin,
  deleteMessageAsAdmin,
  deletePartyAsAdmin,
  setUserBannedAsAdmin,
} from "@/lib/admin/actions";

const smallClass =
  "rounded-xl border border-line px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-60";
const smallDangerClass =
  "rounded-xl border border-danger-line px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-bg disabled:opacity-60";

// Every control asks first. The actions revalidate the admin pages, so the
// row updates (or disappears) once the dialog closes.

export function AdminCancelPartyButton({ partyId, title }) {
  return (
    <ConfirmDialog
      triggerLabel="ยกเลิก"
      triggerAriaLabel={`ยกเลิกตี้ ${title}`}
      triggerClassName={smallClass}
      title={`ยกเลิกตี้ “${title}”?`}
      description="ยกเลิกแล้วเปิดกลับไม่ได้ ตี้จะหายจากหน้าหาตี้ และไม่มีใครเข้าร่วมเพิ่มได้ สมาชิกยังคุยในแชทได้อีก 7 วัน"
      confirmLabel="ยืนยันยกเลิกตี้"
      pendingLabel="กำลังยกเลิก..."
      cancelLabel="ไม่ยกเลิก"
      onConfirm={() => cancelPartyAsAdmin(partyId)}
    />
  );
}

// redirectTo: where to go after deleting, for the party's own detail page.
export function AdminDeletePartyButton({ partyId, title, redirectTo }) {
  const router = useRouter();

  async function remove() {
    const result = await deletePartyAsAdmin(partyId);

    if (result.ok && redirectTo) {
      router.replace(redirectTo);
    }

    return result;
  }

  return (
    <ConfirmDialog
      triggerLabel="ลบ"
      triggerAriaLabel={`ลบตี้ ${title}`}
      triggerClassName={smallDangerClass}
      title={`ลบตี้ “${title}” ถาวร?`}
      description="สมาชิก คำขอเข้าร่วม และข้อความในแชทของตี้นี้จะถูกลบทั้งหมด กู้คืนไม่ได้"
      confirmLabel="ลบถาวร"
      pendingLabel="กำลังลบ..."
      cancelLabel="ไม่ลบ"
      onConfirm={remove}
    />
  );
}

export function AdminBanButton({ userId, name, banned }) {
  return banned ? (
    <ConfirmDialog
      triggerLabel="ยกเลิกการระงับ"
      triggerAriaLabel={`ยกเลิกการระงับ ${name}`}
      triggerClassName={smallClass}
      title={`ยกเลิกการระงับ ${name}?`}
      description="บัญชีนี้จะกลับมาใช้งานได้ตามปกติ และตี้ของเขาจะกลับไปแสดงในหน้าหาตี้"
      confirmLabel="ยกเลิกการระงับ"
      pendingLabel="กำลังบันทึก..."
      cancelLabel="ไม่ใช่ตอนนี้"
      tone="primary"
      onConfirm={() => setUserBannedAsAdmin(userId, false)}
    />
  ) : (
    <ConfirmDialog
      triggerLabel="ระงับบัญชี"
      triggerAriaLabel={`ระงับบัญชี ${name}`}
      triggerClassName={smallDangerClass}
      title={`ระงับบัญชี ${name}?`}
      description="เขาจะถูกพาไปหน้าบัญชีถูกระงับ ตั้งตี้ เข้าร่วม หรือส่งข้อความไม่ได้ และตี้ที่เขาเป็นเจ้าของจะหายจากหน้าหาตี้ ยกเลิกการระงับได้ภายหลัง"
      confirmLabel="ระงับบัญชี"
      pendingLabel="กำลังระงับ..."
      cancelLabel="ไม่ระงับ"
      onConfirm={() => setUserBannedAsAdmin(userId, true)}
    />
  );
}

export function AdminDeleteMessageButton({ messageId }) {
  return <DeleteMessageButton onDelete={() => deleteMessageAsAdmin(messageId)} />;
}
