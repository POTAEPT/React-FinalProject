// Notice box for an empty or failed list. reason: a failed listParties() reason.
export function FeedMessage({ reason, children }) {
  if (reason === "unconfigured") {
    return (
      <p className="m-4 rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6 text-muted">
        ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
      </p>
    );
  }

  if (reason) {
    return (
      <p role="alert" className="m-4 rounded-3xl border border-line bg-card px-4 py-8 text-center text-sm">
        โหลดรายการตี้ไม่สำเร็จ
      </p>
    );
  }

  return (
    <p className="m-4 rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6 text-muted">
      {children}
    </p>
  );
}
