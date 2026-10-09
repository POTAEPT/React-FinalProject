"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AuthDivider,
  AuthShell,
  authButtonClass,
  authInputClass,
} from "@/components/auth/AuthShell";
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
    <AuthShell title="สร้างบัญชี MaTee">
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
          maxLength={40}
          placeholder="ชื่อที่แสดง"
          aria-label="ชื่อที่แสดง"
          required
          className={authInputClass}
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          placeholder="อีเมล"
          aria-label="Email"
          required
          className={authInputClass}
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          minLength={8}
          placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
          aria-label="Password"
          required
          className={authInputClass}
        />

        {error ? (
          <p role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-xl bg-soft px-3 py-2 text-sm text-soft-foreground">
            {notice}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={`${authButtonClass} mt-1`}>
          {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>
      </form>

      <AuthDivider />

      <Link
        href="/login"
        className="grid h-14 place-items-center rounded-2xl border border-line bg-card text-base font-medium hover:border-accent"
      >
        มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
      </Link>
    </AuthShell>
  );
}
