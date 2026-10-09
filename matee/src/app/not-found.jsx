import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-3 px-4 py-16">
      <h1 className="text-3xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-sm leading-6 text-muted">หน้านี้อาจถูกลบไปแล้ว ลิงก์ไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เปิด</p>
      <Link href="/" className="text-sm font-medium text-accent underline underline-offset-4">
        กลับไปหาตี้
      </Link>
    </main>
  );
}
