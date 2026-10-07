"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signUp } from "@/lib/auth/actions";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const result = await signUp(form);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      setNotice("สมัครสำเร็จ กรุณาตรวจสอบ Email เพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ");
      setLoading(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">สมัครสมาชิก</h1>
        <p className="mt-2 text-sm text-muted">
          สร้างบัญชีเพื่อเริ่มใช้งาน MaTee
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            ชื่อที่แสดง
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              maxLength={40}
              required
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-sm text-accent">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-accent underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </section>
    </main>
  );
}
