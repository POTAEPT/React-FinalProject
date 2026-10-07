import { createClient } from "@/lib/supabase/client";

export async function signUp({ displayName, email, password }) {
  const trimmedDisplayName = displayName?.trim();

  if (!trimmedDisplayName || trimmedDisplayName.length < 1) {
    return { error: "ชื่อนี้มีการถูกใช้แล้วกรุณาเลือกชื่ออื่น" };
  }

  if (trimmedDisplayName.length > 40) {
    return { error: "ชื่อที่แสดงต้องมีความยาวไม่เกิน 40 ตัวอักษร" };
  }

  if (!email?.trim()) {
    return { error: "กรุณากรอก Email" };
  }

  if (!password || password.length < 8) {
    return { error: "Password ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: trimmedDisplayName },
    },
  });

  return { error: error?.message || null }
}

// 2. เข้าสู่ระบบ
export async function signIn({ email, password }) {
  const normalizedEmail = email?.trim()

  if (!normalizedEmail || !password) {
    return { error: 'กรุณากรอก Email และ Password' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  return { error: error ? 'Email หรือ Password ไม่ถูกต้อง' : null }
}

  return {
    error: null,
    needsEmailConfirmation: !data.session,
  };
}
