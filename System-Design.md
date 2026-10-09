# MaTee System Design

> เอกสารออกแบบระบบของ MaTee (มาตี้กัน) สำหรับทุกคนในทีมและ AI agent ที่เขียนโค้ดในโปรเจกต์นี้
> เป้าหมายคือให้ทุกคนเขียนโค้ดไปในทางเดียวกัน: โครงสร้างไฟล์, รูปแบบ Server Action, การเช็คสิทธิ์, ข้อความ UI และวิธีทดสอบ
>
> **อัปเดตล่าสุด:** 2026-10-09 · อ้างอิงโค้ดบน branch `development` (มีงาน #3, #5, #6 และ PR #49 "Restyle the app like Threads") และงาน admin บน branch `22-sub-issue-1-admin-access-and-dashboard`

## สารบัญ
1. [วิธีใช้เอกสารนี้](#1-วิธีใช้เอกสารนี้)
2. [ภาพรวมระบบ](#2-ภาพรวมระบบ)
3. [Tech stack](#3-tech-stack)
4. [สถาปัตยกรรม](#4-สถาปัตยกรรม)
5. [โครงสร้างโฟลเดอร์และชั้นของโค้ด](#5-โครงสร้างโฟลเดอร์และชั้นของโค้ด)
6. [Routes](#6-routes)
7. [Authentication และ Session](#7-authentication-และ-session)
8. [Authorization: ใครทำอะไรได้](#8-authorization-ใครทำอะไรได้)
9. [Data model](#9-data-model)
10. [กติกาของโดเมน](#10-กติกาของโดเมน)
11. [Server Actions: สัญญาที่ทุกตัวต้องทำตาม](#11-server-actions-สัญญาที่ทุกตัวต้องทำตาม)
12. [การอ่านข้อมูล (queries)](#12-การอ่านข้อมูล-queries)
13. [Realtime](#13-realtime)
14. [UI conventions](#14-ui-conventions)
15. [Code conventions](#15-code-conventions)
16. [Git workflow](#16-git-workflow)
17. [การทดสอบ](#17-การทดสอบ)
18. [Environment และการตั้งค่า](#18-environment-และการตั้งค่า)
19. [สถานะงานและ Known issues](#19-สถานะงานและ-known-issues)
20. [Checklist สำหรับ AI agent](#20-checklist-สำหรับ-ai-agent)

---

## 1. วิธีใช้เอกสารนี้

**ลำดับความน่าเชื่อถือ** เมื่อข้อมูลขัดกัน ให้เชื่อตามลำดับนี้
1. **Schema ในฐานข้อมูล** (`supabase/migrations/*.sql`): RLS และ trigger คือกติกาจริงของระบบ
2. **โค้ด** บน branch ล่าสุด
3. **เอกสารนี้**
4. `README.md`: proposal ตอนเริ่มโปรเจกต์ บางส่วนเปลี่ยนไปแล้ว เช่น `/categories`

**เมื่อแก้โค้ดที่ทำให้เอกสารนี้ไม่ตรง ให้แก้เอกสารนี้ใน PR เดียวกัน**

สำหรับ AI agent: อ่านหัวข้อ [20. Checklist](#20-checklist-สำหรับ-ai-agent) ก่อนเริ่มทุกครั้ง และอ่าน `matee/AGENTS.md` เพราะ Next.js 16 ต่างจากเวอร์ชันที่โมเดลส่วนใหญ่รู้จัก

---

## 2. ภาพรวมระบบ

MaTee คือเว็บหาตี้ทำกิจกรรมสำหรับนักศึกษา มช./CAMT เช่น ตีแบด, บอร์ดเกม, ติวสอบ, คาเฟ่

| ผู้ใช้ | คือใคร | ทำอะไรได้ |
|---|---|---|
| **Guest** | ยังไม่ล็อกอิน | ดู feed และรายละเอียดตี้ |
| **User** | ล็อกอินแล้ว | ตั้งตี้, เข้าร่วม/ขอเข้าร่วม, ออก, ดู `/my-party` |
| **Member** | User ที่มีแถวใน `party_members` เป็น `pending` หรือ `confirmed` ของตี้นั้น | คุยในแชทของตี้ |
| **Host** | เจ้าของตี้ (`parties.owner_id`) เป็น member `confirmed` เสมอ | อนุมัติ/ปฏิเสธคำขอ, ยกเลิกตี้, ลบข้อความในตี้ตัวเอง (#24) |
| **Admin** | `profiles.role = 'admin'` ตั้งด้วยมือใน Supabase | ดูแลทุกตี้, แบนผู้ใช้, ลบข้อความใดก็ได้ |
| **Banned** | `profiles.banned_at` ไม่เป็น null | ถูกส่งไป `/banned` และเขียนข้อมูลใดๆ ไม่ได้ |

**Flow หลัก**
```
ตั้งตี้ (/create) ─► ตี้อยู่ใน feed (/) ─► คนอื่นเข้าร่วม
                                          ├─ public:  confirmed ทันที
                                          └─ approve: pending ─► host ยืนยัน/ปฏิเสธ (/manage/[id])
สมาชิกคุยในแชท (/party/[id]#chat) ─► ตี้เริ่ม (ออกจาก feed) ─► ตี้จบ ─► แชทอยู่ต่อ 7 วัน ─► ลบอัตโนมัติ
```

---

## 3. Tech stack

| ส่วน | ใช้อะไร | หมายเหตุ |
|---|---|---|
| Framework | **Next.js 16.3** (App Router, Turbopack) | ⚠️ ต่างจาก Next 13–15 หลายจุด ดู [15. Code conventions](#15-code-conventions) |
| UI | **React 19.2** + **React Compiler** (`reactCompiler: true`) | ไม่ต้องเขียน `useMemo`/`useCallback` เอง |
| ภาษา | **JavaScript** (ไม่มี TypeScript) | path alias `@/*` → `matee/src/*` |
| Style | **Tailwind CSS 4** + design tokens ใน `globals.css` | |
| Form | **react-hook-form** + **zod 4** | |
| Backend | **Supabase**: Auth, Postgres (RLS + triggers), Realtime, Storage, pg_cron | ไม่มี backend server แยก |
| Supabase client | `@supabase/ssr` + `@supabase/supabase-js` | |
| JWT | `jose` | ใช้ใน `getSession()` ตรวจลายเซ็นกับ JWKS |
| Hosting | **Vercel** (#9 ยังไม่ deploy) | |

---

## 4. สถาปัตยกรรม

```
┌───────────────────────────── Browser ─────────────────────────────┐
│  Client Components ("use client")                                  │
│   • ฟอร์ม, ปุ่ม (JoinButton, ManageControls, ...)                    │
│   • PartyChat ── WebSocket ─────────────────────────────┐          │
│   • LoginForm/RegisterForm ── Supabase Auth (ตรง) ──────┤          │
└──────────────┬──────────────────────────────────────────┼──────────┘
               │ HTTP: หน้าเว็บ + Server Actions (POST)     │
┌──────────────▼────────── Next.js (Vercel) ──────────────┼──────────┐
│  middleware.js   refresh session, กัน route, ส่งคนถูกแบน  │          │
│  Server Components (page.jsx)  อ่านข้อมูลด้วย session ผู้ใช้│          │
│  Server Actions (lib/*/actions.js)  เขียนข้อมูล + revalidate │          │
└──────────────┬──────────────────────────────────────────┼──────────┘
               │ PostgREST / Auth / Storage (JWT ของผู้ใช้)  │
┌──────────────▼──────────────── Supabase ────────────────▼──────────┐
│  Auth (auth.users) ─ trigger handle_new_user ─► profiles            │
│  Postgres: tables + RLS + triggers (กติกาจริงอยู่ที่นี่)                │
│  Realtime: publication parties, party_messages                      │
│  Storage: bucket avatars                                            │
│  pg_cron: purge-expired-chats ทุกวัน 03:00 (Asia/Bangkok)            │
└─────────────────────────────────────────────────────────────────────┘
```

**หลักการสำคัญ**
1. **ทุก query ใช้ JWT ของผู้ใช้** (anon key + session cookie) ไม่มี service role key ในแอป จึงให้ **RLS เป็นด่านสุดท้ายเสมอ**
2. **อ่านข้อมูลใน Server Component, เขียนผ่าน Server Action** โดย Client Component ไม่ query DB เอง ยกเว้น 2 อย่าง
   - login/register/sign out ผ่าน browser client
   - แชท: subscribe Realtime, โหลดข้อความซ้ำหลัง subscribe และดึง profile ผู้ส่ง
3. **กติกาเขียนซ้ำ 2 ชั้น:** Server Action เช็คก่อนเพื่อให้ error ชัดเจนเป็นภาษาไทย ส่วน DB (RLS/trigger) เช็คอีกรอบเพื่อความถูกต้อง เช่นกรณีกดพร้อมกัน
4. **เวลาที่คำนวณได้ไม่เก็บลง DB** เช่น "เต็ม", "เริ่มแล้ว", "จบแล้ว" และ "แชทหมดอายุ" ให้คำนวณจากเวลาและจำนวนคนเสมอ

---

## 5. โครงสร้างโฟลเดอร์และชั้นของโค้ด

```
React-FinalProject/
├── README.md                 proposal ของโปรเจกต์
├── System-Design.md          เอกสารนี้
├── supabase/
│   ├── migrations/20260930171052_matee_initial_schema.sql   ← schema หลัก
│   ├── schema.sql            สำเนาเก่า (ต่างจาก migration ตรง bucket avatars)
│   └── config.toml           สำหรับ supabase local
└── matee/                    แอป Next.js
    ├── AGENTS.md / CLAUDE.md คำเตือนเรื่อง Next 16 สำหรับ agent
    ├── next.config.mjs       reactCompiler, images.remotePatterns (Supabase storage)
    ├── public/brand/         โลโก้ MaTee (mark / lockup / tile) แบบ light และ dark
    └── src/
        ├── middleware.js     ← จะเปลี่ยนเป็น proxy.js (ดู Known issues)
        ├── app/              routes (หัวข้อ 6)
        │   ├── layout.jsx    html + ธีม + BootSplash + AppShell + slot `modal`
        │   ├── @modal/       parallel route ของ modal (ตั้งตี้, แก้ไขโปรไฟล์) ดูหัวข้อ 14
        │   └── icon.png      favicon
        ├── components/
        │   ├── app-shell.jsx      กรอบทุกหน้า: sidebar/แถบมือถือ, คอลัมน์กลาง, ปุ่ม + ลอย, กล่อง guest
        │   ├── site-header.jsx    sidebar (desktop), แถบบน + แถบล่าง (มือถือ), เมนูธีม/บัญชี
        │   ├── boot-splash.jsx    โลโก้หมุนตอนโหลดหน้าครั้งแรก
        │   ├── brand-logo.jsx     โลโก้ light/dark ตามธีม
        │   ├── party-composer.jsx แถว "ตั้งตี้ใหม่…" บน feed (ลิงก์ไป /create)
        │   ├── party-search.jsx   ช่องค้นหา + ตัวกรองวันที่/host ของ /search
        │   ├── party-filters.jsx  chip เปิดรับ/หมวดหมู่ของ /search
        │   ├── party-card.jsx, party-feed.jsx
        │   ├── ui/           Button, FormField, AlertMessage, ConfirmDialog, TimeSelect, modal (Modal)
        │   ├── auth/         AuthShell, LoginForm, RegisterForm
        │   ├── account/      AvatarUploader, EditProfileForm, edit-profile (server), ProfileCard, ClaimsPanel, SignOutButton
        │   ├── party/        JoinButton, ManageControls, PartyForm (สร้าง + แก้ไข), create-party (server)
        │   └── chat/         PartyChat (client), PartyChatSection (server)
        └── lib/
            ├── supabase/     server.js · client.js · middleware.js · env.js
            ├── auth/         actions.js (browser) · get-session.js · account.js (loadAccount, cache ต่อ request)
            │                 profile-actions.js (updateDisplayName) · next-path.js · redirect-signed-in.js
            ├── theme.js      ค่าธีมและชื่อ cookie
            ├── avatar/       actions.js
            ├── parties/      queries · member-actions · my-commitments · member-state
            │                 my-party · schema · time · categories · filters
            ├── chat/         queries · actions · message · expiry · access
            └── admin/        (branch 22) require-admin · actions
```

### ชั้นของโค้ดใน `lib/<domain>/`
| ไฟล์ | ชั้น | กฎ |
|---|---|---|
| `queries.js` | **อ่าน** (server) | import `@/lib/supabase/server` ใช้ใน Server Component เท่านั้น ห้าม import จาก client |
| `actions.js` / `*-actions.js` | **เขียน** (Server Action) | ขึ้นต้นด้วย `"use server"` ทุก export เป็น async function ที่ client เรียกได้ |
| ไฟล์ logic ล้วน เช่น `time.js`, `expiry.js`, `access.js`, `member-state.js`, `my-commitments.js` (`findConflict`), `my-party.js`, `message.js` | **pure** | ห้าม import server-only module เพื่อให้ใช้ได้ทั้ง server, client และทดสอบด้วย node ตรงๆ |
| `schema.js` | validation | zod schema ที่ใช้ร่วมกันทั้งฟอร์ม (client) และ action (server) |

### Supabase client: ใช้ตัวไหนเมื่อไหร่
| ไฟล์ | ใช้ที่ | หมายเหตุ |
|---|---|---|
| `lib/supabase/server.js` → `await createClient()` | Server Component, Server Action | อ่าน cookie จาก `next/headers` ส่วนการเขียน cookie ใน Server Component จะถูกเงียบไว้ |
| `lib/supabase/client.js` → `createClient()` | Client Component | browser client (singleton) ใช้สำหรับ auth และ Realtime |
| `lib/supabase/middleware.js` → `updateSession(request)` | `middleware.js` เท่านั้น | refresh token และส่ง cookie ใหม่กลับไปกับ response |
| `lib/supabase/env.js` | ทุกที่ | `getSupabaseEnv()` คืน `null` ถ้ายังไม่ตั้ง env (หน้าเว็บแสดงข้อความแนะนำแทน crash) |

---

## 6. Routes

สถานะ: ✅ มีแล้ว · 🌿 อยู่บน branch อื่นที่ยังไม่ merge · ⏳ ยังไม่ทำ

| Route | สิทธิ์ | Render | ทำอะไร | สถานะ |
|---|---|---|---|---|
| `/` | ทุกคน | Server | แถว composer "ตั้งตี้ใหม่…" + feed ตี้ที่ open, ยังไม่เต็ม, ยังไม่เริ่ม (การ์ดแบบโพสต์ Threads พร้อมแถบที่นั่งและสถานะชนเวลา) ตัวกรองย้ายไป `/search` แล้ว | ✅ (live slot count ⏳ #8) |
| `/search` | ทุกคน | Server + client ค้นหา/chip | ค้นหา `?q=` (ชื่อ/สถานที่), chip `?availability=open` และ `?category=`, ตัวกรอง `?after=` `?before=` (วันที่) `?host=` (ชื่อ host) ค่าเริ่มต้นแสดงทุกตี้ที่ไม่ถูกยกเลิก ถ้ายังไม่ค้นจะแสดง "ตี้แนะนำ" (เปิดรับ) | ✅ |
| `/party/[id]` | ทุกคน | Server + client ปุ่ม/แชท | รายละเอียด, ปุ่มตามสถานะ (`memberActionState`), แชท `#chat` (`chatAccess`) | ✅ |
| `/create` | User | Modal บน feed | ฟอร์มตั้งตี้ (`PartyForm`) + เช็คเวลาชน เปิดเป็น modal ทับหน้าเดิมเมื่อกดจากในแอป และเปิดทับ feed เมื่อเข้า URL ตรง (ปิดแล้วไป `/`) | ✅ |
| `/my-party` | User | Server | agenda จัดกลุ่มตามวัน, ส่วน "ที่ผ่านมา", ปุ่มแชท, เฟือง + badge pending | ✅ |
| `/manage/[id]` | Host (คนอื่นได้ 404) | Server + client ปุ่ม/ฟอร์ม | ยืนยัน/ปฏิเสธคำขอ (ปฏิเสธมี dialog), รายชื่อสมาชิก, รายการ "ปฏิเสธแล้ว" ให้เปลี่ยนใจยืนยันได้, แก้ไขรายละเอียดตี้ (ก่อนตี้เริ่ม), ยกเลิกตี้ (dialog) | ✅ |
| `/login` | Guest | Client form | ล็อกอินแล้วกลับไปที่ `?next=` | ✅ |
| `/register` | Guest | Client form | สมัคร (display name, email, password) | ✅ |
| `/account` | User | Server | โปรไฟล์ (ชื่อ, อีเมล, role, avatar), จำนวนตี้ที่ตั้ง/เข้าร่วม, แท็บ `?tab=joined`, ปุ่มแก้ไขโปรไฟล์และออกจากระบบ | ✅ |
| `/account/edit` | User | Modal บนโปรไฟล์ | แก้ชื่อที่แสดง (`updateDisplayName`) และเปลี่ยนรูป (`uploadAvatar`) เข้า URL ตรงแล้วปิดจะไป `/account` | ✅ |
| `/banned` | ทุกคน | Server | หน้าแจ้งว่าถูกแบน | ✅ |
| `/categories`, `/discover` | ทุกคน | Server | กริดหมวด / redirect ไป `/` (หน้าที่ซ้ำกับ `/search` แล้ว ควรตัดสินใจก่อน merge) | 🌿 branch 22 |
| `/admin`, `/admin/parties`, `/admin/users`, `/admin/parties/[id]` | Admin (คนอื่นได้ 404) | Server + client ปุ่ม | dashboard, จัดการตี้, แบนผู้ใช้, ดูแลแชท | 🌿 branch 22 (#7, #24) |

**หน้าที่ไม่มีกรอบแอป:** `/login`, `/register`, `/banned` (`BARE_PATHS` ใน `app-shell.jsx`) แสดงเต็มจอโดยไม่มี sidebar

**Route ที่ middleware บังคับล็อกอิน:** `/create`, `/my-party`, `/manage`, `/account` (รวม `/account/edit`) ถ้ายังไม่ล็อกอินจะ redirect ไป `/login?next=<path>` เมื่อเพิ่มหน้าที่ต้องล็อกอิน**ต้องเพิ่มใน `protectedPaths`** และหน้านั้นต้องเช็ค user เองซ้ำด้วย (เผื่อ middleware ไม่ทำงาน)

**รูปแบบ id ใน URL:** ทุกหน้าที่รับ `[id]` ต้องเช็ค UUID ด้วย regex ก่อน query ถ้าไม่ผ่านให้เรียก `notFound()`
```js
const partyIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
```

---

## 7. Authentication และ Session

### Register / Login (ทำใน browser)
```
LoginForm ─► lib/auth/actions.js signIn() ─► supabase.auth.signInWithPassword (browser client)
         ◄─ Supabase ส่ง session กลับ ─► @supabase/ssr เขียน cookie  sb-<project>-auth-token
         ─► router.push(next) + router.refresh()
```
- `lib/auth/actions.js` **ไม่ใช่ Server Action** (ไม่มี `"use server"`) เพราะใช้ browser client
- สมัคร: `signUp({ displayName, email, password })` ส่ง `options.data.display_name` ให้ trigger `handle_new_user` สร้างแถวใน `profiles`
- ไม่มี route API สำหรับล็อกอิน การทดสอบอัตโนมัติจึงต้องล็อกอินผ่าน Supabase Auth แล้วนำ cookie มาใช้ (ดูหัวข้อ 17)
- คนที่ล็อกอินอยู่แล้วเปิด `/login` หรือ `/register` จะถูก redirect ไป `?next=` หรือ `/` (`lib/auth/redirect-signed-in.js` เรียกในตัว page ไม่ได้ทำใน middleware)
- ทุกที่ที่ redirect ตาม `?next=` ต้องผ่าน `safeNextPath()` (`lib/auth/next-path.js`) ซึ่งรับเฉพาะ path ในเว็บ (`/…` แต่ไม่ใช่ `//…`) กัน open redirect

### Session ฝั่ง server
| ต้องการ | ใช้ | เหตุผล |
|---|---|---|
| รู้ว่าใครเรียก ใน Server Action หรือ Server Component | `const { data: { user } } = await supabase.auth.getUser()` | ตรวจ token กับ Supabase Auth จึงเชื่อถือได้ ใช้เป็นมาตรฐาน |
| ต้องการ claims ของ JWT + profile (`/account`, `/account/edit`) | `getSession()` จาก `lib/auth/get-session.js` | ตรวจลายเซ็น JWT กับ JWKS ด้วย `jose` แล้วโหลด profile (ต้องตั้ง JWT Signing Keys เป็นแบบ asymmetric) |
| ชื่อ + avatar ของคนที่ล็อกอิน (shell, composer, ฟอร์มตั้งตี้) | `loadAccount()` จาก `lib/auth/account.js` | ห่อด้วย `cache()` ของ React layout และ page ใน request เดียวกันจึงเรียก Supabase ครั้งเดียว คืน `null` สำหรับ guest |
| **ห้ามใช้** | `supabase.auth.getSession()` เพื่อตัดสินสิทธิ์ | อ่าน cookie ตรงๆ โดยไม่ตรวจ ปลอมได้ |

### middleware.js (ทุก request ยกเว้นไฟล์ static)
1. `updateSession()` refresh token ที่ใกล้หมดอายุ แล้วแนบ cookie ใหม่ไปกับ response
2. ยังไม่ล็อกอินแต่เข้า protected path → redirect ไป `/login?next=...`
3. ล็อกอินแล้วแต่ `profiles.banned_at` ไม่เป็น null → redirect ไป `/banned`
4. ตอน redirect ต้องคัด cookie จาก `supabaseResponse` ไปด้วย (`redirectWithSession`) ไม่อย่างนั้น session ที่เพิ่ง refresh จะหาย

---

## 8. Authorization: ใครทำอะไรได้

ระบบเช็คสิทธิ์ **3 ชั้น** ทุก feature ต้องมีครบ

| ชั้น | อยู่ที่ | หน้าที่ |
|---|---|---|
| 1. Route | `middleware.js` + ต้นไฟล์ `page` | กัน guest ออกจากหน้าที่ต้องล็อกอิน ถ้าไม่ใช่เจ้าของหรือไม่ใช่ admin ให้ `notFound()` (ไม่บอกว่ามีหน้านี้) |
| 2. Server Action | ต้นทุก action | ตรวจ input → ตรวจ `getUser()` → ตรวจสิทธิ์ (host? member?) → ตรวจกติกา แล้วคืน `code` ที่ชัดเจน |
| 3. Database | RLS + triggers | ด่านสุดท้าย ป้องกันกรณีเรียก action ตรงหรือกดพร้อมกัน **ห้ามคิดว่าชั้น 1–2 พอแล้ว** |

> Server Action เรียกได้ด้วย POST ตรงๆ โดยไม่ต้องผ่าน UI จึงต้องเช็คสิทธิ์ในตัว action เองทุกครั้ง

### ตารางสิทธิ์ (ตาม RLS ใน schema)
| ตาราง | อ่าน | เพิ่ม | แก้ | ลบ |
|---|---|---|---|---|
| `profiles` | ทุกคน | trigger ตอนสมัคร | ตัวเอง (ห้ามแก้ `role`; `banned_at` แก้ได้เฉพาะ admin) | – |
| `parties` | ทุกคน | ตัวเอง, ไม่ถูกแบน | owner / admin (ยกเลิกแล้วเปิดกลับไม่ได้; `confirmed_count` แก้ได้เฉพาะ trigger) | owner / admin |
| `party_members` | แถว confirmed: ทุกคน · แถวตัวเอง · owner เห็นทุกแถวของตี้ตัวเอง · admin | ตัวเอง ตาม `join_allowed()` | owner: เปลี่ยนเป็น confirmed/rejected · ตัวเอง: pending/confirmed → cancelled · ตัวเอง: cancelled → join ใหม่ | – (cascade) |
| `party_messages` | member (pending/confirmed) + admin | member, ไม่ถูกแบน, ก่อนแชทหมดอายุ | – | เจ้าของข้อความ (ขณะยังเป็น member) / host / admin |
| `storage.objects` (avatars) | ทุกคน | โฟลเดอร์ `<userId>/` ของตัวเอง | ของตัวเอง | ของตัวเอง |

ทุก policy การเขียนของผู้ใช้ทั่วไปมี `not public.is_banned()` แล้ว ผู้ใช้ที่ถูกแบนจึงเขียนไม่ได้แม้ session ยังไม่หมดอายุ

---

## 9. Data model

ไฟล์: `supabase/migrations/20260930171052_matee_initial_schema.sql`

### Enums
| Enum | ค่า |
|---|---|
| `party_category` | `sport` กีฬา · `board_game` บอร์ดเกม · `study` ติวสอบ · `cafe` คาเฟ่ · `other` อื่นๆ (ใช้คู่กับ `custom_category`) |
| `party_status` | `open` · `cancelled` (เปลี่ยนได้ทางเดียว) |
| `party_join_mode` | `public` (เข้าได้ทันที) · `approve` (รอ host ยืนยัน) |
| `member_status` | `pending` · `confirmed` · `rejected` · `cancelled` (ออกเอง) |
| `user_role` | `user` · `admin` |

### Tables
```
profiles (id = auth.users.id, display_name 1–40, avatar_url, role, banned_at, created_at, updated_at)
   ▲ 1
   │ owner_id                                    user_id
parties (id, owner_id, title 1–80, category, custom_category 1–30,
         join_mode, event_date, event_time, duration_minutes 30–480 step 30,
         location 1–120, max_members 2–30, confirmed_count (trigger),
         detail ≤1000, status, created_at, updated_at)
   │ 1                          │ 1
   ▼ n                          ▼ n
party_members                 party_messages
(id, party_id, user_id,       (id, party_id, user_id,
 status, created_at,           body 1–500, created_at)
 updated_at)
 UNIQUE(party_id, user_id)
```
- ลบตี้ → `party_members` และ `party_messages` ถูกลบตามแบบ cascade
- `party_members` มี**แถวเดียวต่อคนต่อตี้** การ join ใหม่หลังออกจึงต้อง **update แถวเดิม** ห้าม insert ใหม่
- host ถูกเพิ่มเป็น `confirmed` อัตโนมัติด้วย trigger `parties_add_owner`

### Functions / Triggers / Views ที่โค้ดพึ่งพา
| ชื่อ | ทำอะไร |
|---|---|
| `party_start_at(date, time)` / `party_end_at(date, time, minutes)` | แปลงเวลาไทย (Asia/Bangkok) เป็น timestamptz |
| `has_time_conflict(user, party)` / `(user, start, end, exclude)` | เช็คช่วงเวลาซ้อน (ใช้ใน trigger และเรียกผ่าน RPC ได้) |
| `join_allowed(party, status)` | ไม่ใช่ host, ตี้ open, ยังไม่เริ่ม และ status ตรงกับ join mode |
| `is_active_member(party)` | ผู้เรียกเป็น pending/confirmed ใช้ตรวจสิทธิ์แชท |
| `is_admin()` / `is_banned()` | ใช้ใน policy |
| `chat_expires_at(party)` | จบ + 7 วัน หรือถ้าถูกยกเลิกใช้ `updated_at` + 7 วัน |
| `purge_expired_chats()` | ลบข้อความที่หมดอายุ (pg_cron ทุกวัน 20:00 UTC) |
| trigger `enforce_party_capacity` | raise `'Party is full'` / `'The host stays confirmed'` |
| trigger `enforce_member_time_conflict` / `enforce_party_time_conflict` | raise `'Time conflict'` |
| trigger `refresh_party_confirmed_count` | อัปเดต `parties.confirmed_count` โดยไม่แตะ `updated_at` |
| trigger `protect_party_row` / `protect_profile_moderation_columns` | กันแก้ `confirmed_count`, กันเปิดตี้ที่ยกเลิกแล้ว, กันแก้ role/ban |
| view `party_counts` (security_invoker) | `pending_count` ฯลฯ ใช้กับ badge บน `/my-party` (นับครบเฉพาะเมื่อผู้เรียกเป็น owner) |

> **`parties.updated_at` หมายถึง "host หรือ admin แก้ตี้ล่าสุดเมื่อไหร่"** ใช้คำนวณวันหมดอายุแชทของตี้ที่ถูกยกเลิก trigger จึงไม่ bump ค่านี้ตอนจำนวนคนเปลี่ยน ห้ามเขียน logic ที่ทำให้ค่านี้เปลี่ยนโดยไม่ตั้งใจ

---

## 10. กติกาของโดเมน

### 10.1 เวลา
- `event_date` + `event_time` คือ**เวลาไทย** เสมอ ใช้ helper ใน `lib/parties/time.js` ห้ามใช้ `new Date(date + time)` ตรงๆ เพราะจะอ่านตาม timezone ของเครื่อง

| Helper | ใช้ทำอะไร |
|---|---|
| `partyStartMs(date, time)`, `partyEndMs(date, time, minutes)` | ได้ epoch ms (`+07:00`) |
| `formatEventDate`, `formatTimeRange`, `formatDuration`, `bangkokToday`, `addDays` | แสดงผลภาษาไทย |

- ข้อมูลตี้ที่ได้จาก `getParty`/`listParties` มี `startMs`, `endMs`, `started`, `ended`, `full` คำนวณไว้แล้ว

### 10.2 สถานะของตี้
```
           host ยกเลิก (ทางเดียว)
  open ─────────────────────────► cancelled
   │
   ├─ full     = confirmed_count >= max_members   (คำนวณ ไม่เก็บ)
   ├─ started  = start <= now  → ออกจาก feed, join ไม่ได้
   └─ ended    = end   <= now  → "จบแล้ว", ย้ายไป "ที่ผ่านมา", แชทนับถอยหลัง 7 วัน
```

### 10.3 สถานะของสมาชิก (`party_members.status`)
```
             join (public)
  (ไม่มีแถว) ───────────────► confirmed ──leave──► cancelled ──join ใหม่──► confirmed/pending
      │                          ▲                                         (update แถวเดิม)
      │ join (approve)            │ host ยืนยัน
      └──────────────► pending ───┤
                          │       └ host ปฏิเสธ ──► rejected  (ขอใหม่เองไม่ได้ · host เปลี่ยนใจกดยืนยันได้ใน /manage → confirmed)
                          └─leave/ยกเลิกคำขอ──► cancelled
```
- **join ได้เมื่อ:** ไม่ใช่ host, ตี้ open, ยังไม่เริ่ม, ยังไม่เต็ม, ไม่เคยถูก reject และเวลาไม่ชน
- **host ออกไม่ได้** ต้องยกเลิกทั้งตี้แทน
- **ยืนยันคำขอ** ยังต้องผ่าน trigger capacity: ถ้าตี้เต็มจะยืนยันไม่ได้

### 10.3.1 การแก้ไขตี้ (host, หน้า `/manage/[id]`)
- แก้ได้เฉพาะตี้ที่ open และ**ยังไม่เริ่ม**
- แก้ได้: ชื่อ, หมวด, สถานที่, รายละเอียด, จำนวนที่รับ (ห้ามต่ำกว่า `confirmed_count`), วิธีเข้าร่วม
- วันที่/เวลา/ระยะเวลา: แก้ได้**เฉพาะตอนยังไม่มีคนอื่น** pending/confirmed และต้องไม่ชนกับตี้อื่นของ host (เช็คในแอป เพราะ trigger ของ `parties` เช็คเวลาชนเฉพาะตอน insert)
- สลับ approve → public: คำขอที่ค้างยังเป็น pending รอ host ตัดสิน

### 10.4 เวลาชน (time conflict)
- **Commitment** = แถวที่ pending/confirmed บนตี้ที่ open และยังไม่จบ (นับรวมตี้ที่เป็น host)
- **ชน** เมื่อ `a.start < b.end && b.start < a.end` ส่วนตี้ที่เวลาแค่ชนขอบ (จบ 18:00 กับเริ่ม 18:00) **ไม่ชน**
- ฝั่งแอปใช้ `lib/parties/my-commitments.js`: `getMyCommitments()` และ `findConflict()` ฝั่ง DB ใช้ trigger และ `has_time_conflict()` (สูตรเดียวกัน)
- ใช้ใน 3 ที่: join, สร้างตี้ และแสดงผลบน feed/หน้าตี้ ("ชนเวลากับ “ชื่อตี้”" + ลิงก์)

### 10.5 แชท
| สถานะ (`chatState`) | เงื่อนไข | UI |
|---|---|---|
| `open` | ตี้ยังไม่จบและไม่ถูกยกเลิก | แผงแชทปกติ |
| `closing` | จบแล้วหรือถูกยกเลิก และยังไม่ครบ 7 วัน | แผงแชท + "แชทจะหายไปใน N วัน" (N ปัดขึ้น) |
| `expired` | `now >= chat_expires_at` | "แชทหมดอายุแล้ว" ไม่มี transcript และไม่มีช่องพิมพ์ (ทุกคน) |

ผลของ `chatAccess` (ใครเห็นอะไร ตามลำดับ): `expired` → `guest` (ลิงก์ล็อกอิน) → `member` (แผงแชท) → `left` ("คุณออกจากตี้แล้ว") → `not_member` (ชวนเข้าร่วม / rejected: "แชทเปิดให้เฉพาะสมาชิกของตี้")

### 10.6 ข้อความ UI ที่ต้องใช้ให้ตรงกัน
| สถานการณ์ | ข้อความ |
|---|---|
| ชนเวลา | `ชนเวลากับ “<ชื่อตี้>”` (ใช้เครื่องหมายคำพูดโค้ง “ ”) |
| ตี้ถูกยกเลิก (แบนเนอร์) | `เจ้าของตี้ยกเลิกตี้นี้แล้ว` |
| ปุ่มบนตี้ที่ยกเลิก | `ปิดรับแล้ว` |
| แชทใกล้หมดอายุ | `แชทจะหายไปใน N วัน` |
| แชทหมดอายุ | `แชทหมดอายุแล้ว` |
| ส่วนพับใน `/my-party` | `ที่ผ่านมา` |

---

## 11. Server Actions: สัญญาที่ทุกตัวต้องทำตาม

### 11.1 รูปแบบผลลัพธ์ (มาตรฐาน)
```js
// สำเร็จ
{ ok: true, ...ข้อมูลเพิ่ม }                 // เช่น { ok: true, id }, { ok: true, status: "pending" }, { ok: true, message }
// ไม่สำเร็จ
{ ok: false, code: "<snake_case>", message: "<ข้อความไทยที่แสดงผู้ใช้ได้เลย>" }
// เวลาชน (รูปแบบพิเศษ ใช้ timeConflictResult())
{ ok: false, code: "time_conflict", conflictingPartyId, conflictingTitle, message }
// ฟอร์มที่มี validation รายช่อง
{ ok: false, fieldErrors: { title: "..." }, message: "ตรวจข้อมูลในฟอร์มอีกครั้ง" }
```
- **ห้าม throw** ให้ client ต้อง catch เอง ยกเว้นกรณีโปรแกรมผิดจริงๆ
- `message` ต้องเป็นภาษาไทย และไม่ส่ง error ดิบจาก DB ให้ผู้ใช้ (ให้ `console.error` ไว้ฝั่ง server)

### 11.2 `code` ที่ใช้อยู่ (ใช้ซ้ำ อย่าตั้งชื่อใหม่ที่ความหมายเดียวกัน)
| code | ความหมาย |
|---|---|
| `unauthenticated` | ยังไม่ล็อกอิน |
| `not_found` | id ผิดรูปแบบหรือไม่มีข้อมูล |
| `invalid` | input ไม่ผ่าน validation |
| `host` | host ทำสิ่งที่ host ทำไม่ได้ (join/leave ตี้ตัวเอง) |
| `not_host` | ไม่ใช่ host แต่พยายามทำสิ่งที่ host ทำ |
| `not_member` | ไม่ได้เป็นสมาชิก (ส่งแชท, leave) |
| `cancelled` / `started` / `full` | สถานะของตี้ไม่อนุญาต |
| `rejected` | ถูกปฏิเสธแล้ว |
| `left` | คนนั้นยกเลิกคำขอ/ออกจากตี้ไปแล้ว (ตอน host ตัดสินคำขอ) |
| `decided` | คำขอถูกตัดสินไปแล้ว (หน้าของ host ไม่อัปเดต) |
| `schedule_locked` | แก้วันเวลาตี้ไม่ได้ เพราะมีคนเข้าร่วมหรือขอเข้าร่วมแล้ว |
| `time_conflict` | เวลาชน |
| `expired` | แชทหมดอายุ |
| `not_allowed` | RLS ปฏิเสธ (`42501`) โดยไม่รู้สาเหตุแน่ชัด |
| `unknown` | error อื่น |

### 11.3 ลำดับขั้นในทุก action
```js
"use server";
export async function doSomething(partyId, input) {
  // 1. ตรวจ input ด้วย regex/zod → { ok:false, code:"not_found" | "invalid" }
  // 2. const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  //    ไม่มี user → code:"unauthenticated"
  // 3. โหลดข้อมูลที่ต้องใช้ตัดสิน (ตี้, แถวสมาชิก)
  // 4. ตรวจสิทธิ์และกติกาเรียงจากเหตุผลที่ชัดที่สุด → code เฉพาะ
  // 5. เขียน DB แล้วแปลง error จาก trigger/RLS เป็น code เดียวกับข้อ 4
  // 6. revalidatePath(...) ทุกหน้าที่แสดงข้อมูลนี้
  // 7. return { ok: true, ... }
}
```

### 11.4 แปลง error จาก DB
| สิ่งที่เจอใน `error.message`/`code` | แปลงเป็น |
|---|---|
| `Time conflict` | `timeConflictResult(await conflictFor(...))` |
| `Party is full` | `full` |
| `42501` (RLS) | `not_allowed` หรือ code ที่เจาะจงกว่าถ้ารู้สาเหตุ |
| `23505` (unique) | แล้วแต่กรณี |
| `23503` (FK) | ข้อมูลอ้างอิงไม่มี เช่นยังไม่มี profile |

### 11.5 Action ที่มีอยู่ และหน้าที่ต้อง revalidate
| Action | ไฟล์ | revalidate |
|---|---|---|
| `createParty(input)` | `app/create/actions.js` | `/` |
| `joinParty(id)`, `leaveParty(id)` | `lib/parties/member-actions.js` | `/`, `/party/[id]`, `/my-party` |
| `decideRequest(memberId, 'confirmed'\|'rejected')`, `cancelParty(id)` | `lib/parties/member-actions.js` | ข้างบน + `/manage/[id]` |
| `updateParty(partyId, input)` (ส่งเข้า PartyForm ด้วย `.bind(null, partyId)`) | `lib/parties/party-actions.js` | `/`, `/party/[id]`, `/manage/[id]`, `/my-party` |
| `sendPartyMessage(id, body)` | `lib/chat/actions.js` | – (อัปเดตผ่าน Realtime) |
| `uploadAvatar({ userId, file })` | `lib/avatar/actions.js` | – |
| `updateDisplayName(name)` | `lib/auth/profile-actions.js` | `/` (layout) ⚠️ คืน `{ ok, error }` ไม่ตรงมาตรฐาน |
| admin: `cancelPartyAsAdmin`, `deletePartyAsAdmin`, `setUserBannedAsAdmin`, `deleteMessageAsAdmin` | `lib/admin/actions.js` (branch 22) | `/`, `/admin/*`, `/party/[id]` |

> ⚠️ `lib/admin/actions.js` และ `lib/avatar/actions.js` ยังคืน `{ ok:false, error }` หรือ `{ error }` ซึ่งไม่ตรงมาตรฐาน 11.1 ควรปรับให้ตรงเมื่อแก้ไฟล์นั้นครั้งถัดไป

---

## 12. การอ่านข้อมูล (queries)

| ฟังก์ชัน | ไฟล์ | คืนอะไร |
|---|---|---|
| `listParties({ q, category, availability, after, before, host })` | `lib/parties/queries.js` | `{ ok, parties, commitments }` ตัดตี้ของ host ที่ถูกแบน · `after`/`before` กรองวันที่ใน DB, `q`/`host` กรองหลัง query · ค่า filter อ่านจาก URL ด้วย `readFeedFilters(searchParams, defaultAvailability)` (`/` ใช้ `open`, `/search` ใช้ `all`) |
| `getParty(id)` | 〃 | `{ ok, party }` (`null` ถ้าไม่มีหรือ host ถูกแบน) |
| `getViewerMembership(partyId)` | 〃 | `{ user, membership, commitments }` |
| `listPartyMembers(partyId)` | 〃 | `{ ok, members }` พร้อม `displayName`, `avatarUrl` |
| `listMyMemberships(supabase, userId)` | `lib/parties/my-commitments.js` | ทุกแถวของผู้ใช้พร้อมข้อมูลตี้ (ใช้ใน `/my-party`) |
| `getMyCommitments(supabase, userId)` | 〃 | commitments สำหรับเช็คเวลาชน |
| `listPartyMessages(partyId)` | `lib/chat/queries.js` | 50 ข้อความล่าสุด เรียงเก่า → ใหม่ |

**กฎ**
- ข้อมูลที่ส่งให้ component ใช้ **camelCase** (`toParty`, `toMessage`) ส่วน snake_case ใช้เฉพาะใน query
- ข้อมูลหลายชุดที่ไม่ขึ้นต่อกันให้ใช้ `Promise.all` เช่น `getParty` + `getViewerMembership`
- คืน `{ ok: false, reason: "unconfigured" | "query" }` แทนการ throw หน้าเว็บจะแสดงข้อความแทน crash
- join ข้ามตารางใช้ PostgREST embed เช่น `parties!inner(...)` และ `profiles(display_name, avatar_url)`

---

## 13. Realtime

| Publication | ใช้ที่ | ทำอะไร |
|---|---|---|
| `party_messages` | `components/chat/PartyChat.jsx` | INSERT (filter `party_id`) และ DELETE (filter ไม่ได้ จึงเอาออกตาม id) |
| `parties` | ⏳ #8 | จำนวนคนบนการ์ดแบบ live / การ์ดหายเมื่อเต็มหรือถูกยกเลิก |
| `party_members` | **ไม่เปิด** | – |

**แพทเทิร์น (ให้ใช้แบบเดียวกันเมื่อทำ #8)**
1. Server Component โหลดข้อมูลชุดแรก แล้วส่งเป็น props ให้ Client Component
2. Client subscribe ใน `useEffect` ด้วย browser client จาก `lib/supabase/client.js` ชื่อช่อง `<feature>:<id>`
3. **ประมาณ 3 วินาทีหลัง `SUBSCRIBED` ให้โหลดข้อมูลซ้ำ 1 ครั้ง** เพราะ Realtime ส่ง `SUBSCRIBED` ก่อนจะเริ่มส่ง `postgres_changes` จริงประมาณ 2–3 วินาที
4. merge ข้อมูลตาม `id` ไม่ให้ซ้ำ
5. cleanup: `supabase.removeChannel(channel)` และ `clearTimeout` เมื่อ unmount
6. Realtime ใช้ select policy (RLS) กรอง INSERT/UPDATE ให้แต่ละผู้ subscribe เอง ไม่ต้องกรองซ้ำฝั่ง client ส่วน **DELETE ไม่ผ่าน RLS** (ได้แค่ primary key)

**Usage:** WebSocket ต่อจาก browser ไป Supabase โดยตรง ไม่ผ่าน Vercel Free plan ของ Supabase มีโควตาประมาณ 200 concurrent connections และ 2 ล้าน messages ต่อเดือน (ตรวจตัวเลขล่าสุดจากหน้า pricing ของ Supabase)

---

## 14. UI conventions

### ภาษาและข้อความ
- UI เป็น**ภาษาไทยทั้งหมด** ส่วนชื่อแบรนด์ใช้ "MaTee" / "มาตี้กัน"
- ใช้คำว่า "ตี้" (ไม่ใช้ "ปาร์ตี้") และ "เจ้าของตี้" (ไม่ใช้ "โฮสต์") ให้สม่ำเสมอ
- title ของหน้า: `"<ชื่อหน้า> | MaTee"`

### Color theme: "Lagoon Sunset"
พาเลตหลักจาก [Color Hunt](https://colorhunt.co/palette/8ad6d1359fa0fff0c5ff8c52) 4 สี: **Mint** `#8AD6D1` · **Teal** `#359FA0` · **Cream** `#FFF0C5` · **Orange** `#FF8C52`

สีดิบของ Color Hunt ใช้เป็นตัวอักษรบนพื้นหลังอีกสีตรงๆ ไม่ได้ทุกคู่ (เช่น ขาวบน `#359FA0` ได้แค่ 3.17:1 ต่ำกว่า 4.5:1 ของ WCAG AA) จึงเพิ่มสีช่วย 3 ตัวที่ปรับเฉดจากพาเลตเดิม: **Ink** `#17383A` (ตัวอักษร), **Deep Teal** `#1F7173` (ปุ่ม/ลิงก์บนพื้นสว่าง), **Card** `#FFF9E3` (cream อ่อนลง)

| บทบาท | สีดิบจาก Color Hunt | ใช้ที่ไหน |
|---|---|---|
| Mint | `#8AD6D1` | chip, พื้น badge, accent ใน dark mode |
| Teal | `#359FA0` | โลโก้, ไอคอน, ลวดลายตกแต่ง (ไม่ใช้เป็นสีตัวอักษรหรือ focus ring) |
| Cream | `#FFF0C5` | สีพื้นของ hover/ปุ่มที่เลือก (light), ตัวอักษรหลัก (dark) |
| Orange | `#FF8C52` | ปุ่ม CTA รอง, badge pending, จุดเน้น (ตัวอักษรบนส้มต้องใช้ Ink) |

### Design tokens (`src/app/globals.css`)
| Token (Tailwind) | Light | Dark | ใช้กับ |
|---|---|---|---|
| `background` | `#FFF0C5` | `#0F2627` | พื้นของ hover, รายการที่เลือก, ช่องกรอก, ฟองแชทของคนอื่น (เข้มกว่า `card` เล็กน้อย) |
| `card` | `#FFF9E3` | `#163535` | **พื้นหลังหน้า** (`body`) และคอลัมน์เนื้อหา, การ์ด, modal |
| `foreground` | `#17383A` | `#FFF0C5` | ตัวอักษรหลัก |
| `muted` | `#4A6B6C` | `#9FBFBD` | ตัวอักษรรอง |
| `line` | `#E6D5A3` | `#2A4F4F` | เส้นขอบ |
| `accent` + `accent-foreground` | `#1F7173` + `#FFFFFF` | `#8AD6D1` + `#0F2627` | ปุ่มหลัก, ลิงก์เด่น |
| `brand` | `#359FA0` | `#359FA0` | ไอคอน, ลวดลายตกแต่ง (ห้ามใช้เป็นสีตัวอักษร) โลโก้ใช้ไฟล์รูปใน `public/brand/` |
| `soft` + `soft-foreground` | `#8AD6D1` + `#17383A` | `#1F4F4F` + `#8AD6D1` | chip, หมวดหมู่, badge ทั่วไป |
| `highlight` + `highlight-foreground` | `#FF8C52` + `#17383A` | `#FF8C52` + `#0F2627` | CTA รอง, badge pending, จุดเน้น |
| `danger` / `danger-bg` / `danger-line` | `#9A2B1C` / `#FDE9E2` / `#F2B8A5` | `#FFB4A2` / `#3A1E1A` / `#7A3A2E` | error / แบนเนอร์ยกเลิก |
| `danger-foreground` | `#FFFFFF` | `#0F2627` | ตัวอักษรบนปุ่ม `bg-danger` (เช่น ยกเลิกตี้) contrast 7.67 / 9.27 |

ค่า contrast ที่คำนวณแล้ว (เกณฑ์ WCAG AA: ตัวอักษรปกติ ≥ 4.5, ข้อความใหญ่/ไอคอน ≥ 3)

| คู่สี | อัตราส่วน |
|---|---|
| foreground บน card (light, พื้นหน้าปัจจุบัน) | 11.97 |
| foreground บน background (light) | 11.14 |
| muted บน card (light) | 5.51 |
| accent-foreground บน accent (light) | 5.73 |
| ตัวอักษร Ink บน highlight | 5.49 |
| ตัวอักษร Ink บน soft | 7.59 |
| danger บน card (light) | 7.28 |
| foreground บน card (dark, พื้นหน้าปัจจุบัน) | 11.61 |
| foreground บน background (dark) | 13.96 |
| background บน foreground (ปุ่ม `bg-foreground text-background`) | 11.14 / 13.96 |
| muted บน card (dark) | 6.69 |
| accent-foreground บน accent (dark) | 9.51 |
| ตัวอักษร `#0F2627` บน highlight (dark) | 6.88 |

ตัวอย่างการประกาศ (Tailwind 4)
```css
:root {
  --background: #fff0c5;  --card: #fff9e3;  --foreground: #17383a;
  --muted: #4a6b6c;       --line: #e6d5a3;
  --accent: #1f7173;      --accent-foreground: #ffffff;
  --brand: #359fa0;
  --soft: #8ad6d1;        --soft-foreground: #17383a;
  --highlight: #ff8c52;   --highlight-foreground: #17383a;
  --danger: #9a2b1c;      --danger-bg: #fde9e2;  --danger-line: #f2b8a5;
  --danger-foreground: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f2627; --card: #163535;     --foreground: #fff0c5;
    --muted: #9fbfbd;      --line: #2a4f4f;
    --accent: #8ad6d1;     --accent-foreground: #0f2627;
    --soft: #1f4f4f;       --soft-foreground: #8ad6d1;
    --highlight-foreground: #0f2627;
    --danger: #ffb4a2;     --danger-bg: #3a1e1a; --danger-line: #7a3a2e;
    --danger-foreground: #0f2627;
  }
}
@theme inline {
  --color-background: var(--background);  --color-card: var(--card);
  --color-foreground: var(--foreground);  --color-muted: var(--muted);
  --color-line: var(--line);              --color-brand: var(--brand);
  --color-accent: var(--accent);          --color-accent-foreground: var(--accent-foreground);
  --color-soft: var(--soft);              --color-soft-foreground: var(--soft-foreground);
  --color-highlight: var(--highlight);    --color-highlight-foreground: var(--highlight-foreground);
  --color-danger: var(--danger);          --color-danger-bg: var(--danger-bg);
  --color-danger-foreground: var(--danger-foreground);
  --color-danger-line: var(--danger-line);
}
```

**กฎการใช้สี**
- **ปุ่มมี 2 ระดับหลัก (ตั้งแต่ PR #49):**
  - **ปุ่มหลักของกรอบแอปและ sheet** แบบ Threads = `bg-foreground text-background` (ปุ่มดำ/ครีมทึบ) เช่น "ตั้งตี้" ในฟอร์ม, "เสร็จสิ้น" ในแก้ไขโปรไฟล์, "เข้าสู่ระบบ" ในกล่อง guest และ chip ที่ถูกเลือกใน `/search` (contrast 11.14 light / 13.96 dark)
  - **ปุ่มการกระทำในเนื้อหา** = `bg-accent text-accent-foreground` เช่น เข้าร่วม, ยืนยันคำขอ, ปุ่มในหน้า login/register
- ปุ่มรอง = `border border-line` (มักเป็น `rounded-full`) · ปุ่ม CTA รอง/สถานะรอ = `bg-highlight text-highlight-foreground` · chip หมวด = `bg-soft text-soft-foreground`
- error/แบนเนอร์ยกเลิกใช้ token `danger*` แทน `text-red-700 dark:text-red-300` เดิม
- `brand` (`#359FA0`) ใช้กับพื้นผิวและไอคอนเท่านั้น เพราะเป็นตัวอักษรบน cream ได้แค่ 2.8:1 หากต้องการลิงก์สีเขียวน้ำทะเลให้ใช้ `accent`
- **focus ring ใช้ `accent`** (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`) เพราะ `brand` บน cream ได้ 2.8:1 ต่ำกว่าเกณฑ์ 3:1 ของ outline ส่วน accent ได้ 5.05 (light) / 9.51 (dark)
- ห้ามวางตัวอักษรบนพื้น `brand` (Ink บน brand ได้ 3.98, ขาวได้ 3.17 ต่ำกว่า 4.5)
- ปุ่มอันตราย (ยกเลิกตี้) = `bg-danger text-danger-foreground` · badge สถานะใน `/my-party`: ยกเลิก = `danger*`, รออนุมัติ = `highlight`, ออกแล้ว = `border-line text-muted`
- ห้ามใช้ส้มเป็นสีตัวอักษรบนพื้น cream (contrast ต่ำ) ใช้เป็นพื้นของ badge/ปุ่มเท่านั้น

- **ธีม 3 แบบ (ตามระบบ / สว่าง / มืด):** ค่าเก็บใน cookie `matee-theme` (`lib/theme.js`) `app/layout.jsx` อ่านแล้วใส่ `data-theme="light|dark"` บน `<html>` (ไม่ใส่เมื่อตามระบบ) ส่วน `globals.css` ใช้ token มืดเมื่อ `[data-theme="dark"]` หรือเมื่อระบบเป็นมืดและไม่ได้บังคับ light ผลคือไม่กะพริบตอนโหลด ปุ่มเลือกธีมอยู่ในเมนู "≡" (หัวข้อถัดไป)
- **ใช้ token เสมอ** ห้าม hard-code สีอย่าง `bg-white` หรือ `text-zinc-900` ถ้าแก้ token มืด ต้องแก้ทั้ง 2 block ใน `globals.css` ให้เหมือนกัน (`.brand-light` / `.brand-dark` ของโลโก้ก็มี 2 block เช่นกัน)
- `@media (prefers-contrast: more)` เปลี่ยน `--line` เป็นสี `muted` ให้เส้นขอบชัดขึ้น

### กรอบแอป (App shell) แบบ Threads
ทุกหน้า ยกเว้น `/login`, `/register`, `/banned` (`BARE_PATHS`) ถูกห่อด้วย `AppShell` (`components/app-shell.jsx`) + `SiteHeader` (`components/site-header.jsx`)

| ขนาดจอ | ส่วนนำทาง | เนื้อหา |
|---|---|---|
| ≥ 72rem | **sidebar ซ้าย** (กว้าง 15rem) โลโก้เต็ม + ปุ่ม ≡, เมนู หาตี้ / ค้นหา / ตั้งตี้ / ตี้ของฉัน (+ โปรไฟล์ เมื่อล็อกอิน) guest มีปุ่มเข้าสู่ระบบ/สมัครด้านล่าง | คอลัมน์กลาง `md:max-w-2xl` เป็นการ์ด `rounded-3xl border` ชื่อหน้าอยู่เหนือการ์ด (`TITLES` ใน `app-shell.jsx`) และ footer © ใต้การ์ด จอ ≥ `xl` guest มีกล่อง "เข้าสู่ระบบหรือสมัครสมาชิก" ทางขวา |
| `md` – 72rem | sidebar หดเหลือ **icon rail** (4.5rem) ปุ่ม ≡ ย้ายไปล่าง | เหมือนด้านบน |
| < `md` (มือถือ) | **แถบบน** (เฉพาะหน้า `/` มีโลโก้ + ค้นหา + เข้าสู่ระบบ; หน้า `/account` มีค้นหา + เฟือง) และ**แถบล่างแบบไอคอน** (ตี้ของฉัน / หน้าหลัก / โปรไฟล์) | เต็มจอ ไม่มีกรอบการ์ด `body` มี `pb-20 md:pb-0` กันแถบล่างบัง |

- **ปุ่ม + ลอย** (`ตั้งตี้ใหม่`) มุมขวาล่างทุกหน้า ยกเว้น `/create`
- **เมนู ≡** (`Dropdown` ใน `site-header.jsx`): แถว "ธีม" (กดเข้าไปเลือก 3 แบบ) และเมื่อล็อกอินมี "ตั้งค่าโปรไฟล์" (`/account/edit`) กับ "ออกจากระบบ" (สีแดง) ปิดด้วย Esc หรือคลิกข้างนอก
- **หน้าที่มีหัวเรื่องของตัวเอง** (เช่น `/party/[id]`) ใช้แถบ `glass-card sticky top-0` ในการ์ด พร้อมปุ่มย้อนกลับ
- หน้าจอ auth ใช้ `AuthShell` (`components/auth/AuthShell.jsx`) แสดงเต็มจอ ช่องกรอกและปุ่มสูง `h-14 rounded-2xl`
- **โลโก้:** `BrandLogo` (`variant="full" | "icon"`) render รูปทั้ง light และ dark แล้วให้ CSS เลือกแสดงตามธีม จึงไม่กะพริบ

### Modal (intercepting route)
`/create` และ `/account/edit` เปิดเป็น sheet ทับหน้าเดิม โดยใช้ parallel route `app/@modal` + `layout.jsx` render `{modal}`:

| ไฟล์ | ใช้เมื่อ |
|---|---|
| `@modal/(.)create/page.jsx`, `@modal/(.)account/edit/page.jsx` | กดลิงก์จากในแอป (soft navigation) ปิดแล้ว `router.back()` |
| `@modal/create/page.jsx`, `@modal/account/edit/page.jsx` | เข้า URL ตรงหรือ refresh ปิดแล้วไป `closeHref` (`/` หรือ `/account`) |
| `app/create/page.jsx`, `app/account/edit/page.jsx` | หน้าข้างหลัง modal (re-export ของ `/` และ `/account`) |
| `@modal/page.jsx`, `@modal/default.jsx`, `@modal/[...catchAll]/page.jsx` | คืน `null` เพื่อปิด modal เมื่อไปหน้าอื่น |

- ตัวฟอร์มอยู่ใน server component ชิ้นเดียว (`components/party/create-party.jsx`, `components/account/edit-profile.jsx`) ที่ทั้ง 2 แบบเรียกใช้ จึงมีฟอร์มเดียวให้ดูแล
- `Modal` (`components/ui/modal.jsx`): `role="dialog" aria-modal="true"`, ปิดได้ด้วย Esc, คลิกฉากหลัง และปุ่ม ✕ ล็อก scroll ของ body และคืน focus เมื่อปิด มือถือเต็มจอ ส่วน `md` ขึ้นไปเป็นกล่อง `max-w-xl rounded-3xl`
- **เพิ่ม modal ใหม่ต้องทำครบ 4 ไฟล์** ตามตารางด้านบน และฟอร์มที่ปิด modal เองหลังบันทึกต้องใช้ `closeHref` เดียวกับ `Modal` ห้ามใช้ `router.back()` อย่างเดียว (ดู Known issue)

### Motion และวัสดุ
| Class / ตัวแปร | ใช้ทำอะไร |
|---|---|
| `.press` | ปุ่ม/ลิงก์ย่อลง `scale(0.985)` ตอนกด (transform เท่านั้น) |
| `--ease-settle` | easing แบบสปริงไม่เด้งเกิน ใช้กับ `.press` และ modal |
| `.glass-card` | แถบลอย/ปุ่มลอยแบบโปร่งแสง (`backdrop-filter`) |
| `.modal-backdrop`, `.modal-panel` | animation เปิด modal |
| `.brand-spin` | โลโก้หมุนตอนโหลด |

ทุกตัวมีทางเลือกเมื่อผู้ใช้ตั้ง `prefers-reduced-motion` (ไม่ย่อ/ไม่หมุน เหลือแค่ fade/pulse) และ `prefers-reduced-transparency` (`.glass-card` เป็นสีทึบ) ของใหม่ต้องทำตามแบบนี้

### Boot splash
`BootSplash` (`components/boot-splash.jsx`) คลุมทั้งจอด้วยโลโก้หมุนตั้งแต่ HTML แรก แล้วหายไปหลัง React ทำงานอย่างน้อย 400ms (+ fade 300ms) ถ้าปิด JavaScript `<noscript>` ใน layout จะซ่อนให้ ⚠️ ทำให้เนื้อหาที่ server render มาแล้วถูกบังจนกว่า JavaScript จะโหลด (Known issue)

### รูปทรงและ layout
- การ์ด/กล่องหลัก `rounded-3xl border border-line bg-card` · รายการใน feed คั่นด้วย `divide-y divide-line` ไม่ใช่การ์ดแยกใบ
- ปุ่ม `rounded-full` (pill) หรือ `rounded-2xl`, chip `rounded-full`
- การ์ดตี้เป็นแบบโพสต์: avatar host ซ้าย, ชื่อ host + วิธีเข้าร่วม, ชื่อตี้, วันเวลา, สถานที่, แถบที่นั่ง, สถานะ (จบแล้ว/เต็มแล้ว/เริ่มแล้ว) และแถบ "ชนเวลากับ …" ใต้ลิงก์
- `<main className="flex w-full flex-1 flex-col">` ภายในคอลัมน์ของ `AppShell` (ไม่ต้องใส่ `max-w` เอง) ใส่ `<h1 className="sr-only">` เมื่อชื่อหน้าแสดงโดย shell แล้ว

### Component
- **Server Component เป็นค่าเริ่มต้น** ใส่ `"use client"` เฉพาะ component ที่มี state, event หรือ Realtime และทำให้เล็กที่สุด
- ปุ่มที่เรียก Server Action ใช้ `useTransition` แสดงข้อความระหว่างทำ (`"กำลัง..."`), `disabled={isPending}` และแสดง `result.message` ใน `role="alert"`
- ไม่ต้องเรียก `router.refresh()` หลัง action เพราะ `revalidatePath` ส่ง UI ใหม่มาพร้อม response แล้ว
- การ์ดที่คลิกได้ทั้งใบ **ห้ามวางปุ่มซ้อนใน `<Link>`** ให้แยกแถวปุ่มไว้นอกลิงก์ (ดู `party-card.jsx`)
- ฟอร์ม: react-hook-form + `zodResolver` จาก `lib/parties/schema.js` และใช้ schema เดียวกันใน action
- รูป avatar ใช้ `next/image` (`remotePatterns` ตั้งไว้แล้ว)
- Accessibility: `aria-label` บนปุ่มไอคอน, `aria-invalid` บนช่องที่ผิด, `role="status"` สำหรับประกาศ, ตัวเลือกที่ "กดไม่ได้" ใช้ `disabled` หรือ `aria-disabled`
- การกระทำที่ย้อนไม่ได้หรือกระทบคนอื่น (ออกจากตี้, ยกเลิกคำขอ, ปฏิเสธคำขอ, ยกเลิกตี้) ต้องผ่าน `ConfirmDialog` (`components/ui/ConfirmDialog.jsx`) ส่วนการกระทำที่ย้อนได้ (เข้าร่วม, ยืนยันคำขอ) กดได้ทันที
- action ที่เจอข้อมูลบนจอเก่ากว่า DB (คำขอถูกยกเลิกไปแล้ว, ตี้เต็มแล้ว) ให้เรียก `revalidatePath` ก่อนคืน error เพื่อให้หน้าเปลี่ยนเป็นสถานะจริงทันที (ดู `stale()` ใน `member-actions.js`)
- ช่องเวลาใช้ `TimeSelect` (24 ชั่วโมง ทีละ 15 นาที) ห้ามใช้ `<input type="time">` เพราะแสดง AM/PM ตาม locale ของ browser

---

## 15. Code conventions

### Next.js 16: จุดที่ต่างจากที่หลายคนคุ้น
- **อ่าน `matee/node_modules/next/dist/docs/` ก่อนใช้ API ที่ไม่แน่ใจ** (ตามที่ `matee/AGENTS.md` กำหนด)
- `params` และ `searchParams` ของ page เป็น **Promise** ต้อง `const { id } = await params`
- `cookies()` เป็น async: `const store = await cookies()`
- `middleware.js` **deprecated** แล้ว ชื่อใหม่คือ `proxy.js` และ export ชื่อ `proxy` (branch 22 เปลี่ยนแล้ว)
- เปิด React Compiler อยู่ จึงไม่ต้องใช้ `useMemo`/`useCallback` และห้ามแก้ค่า `ref.current` ระหว่าง render

### สไตล์โค้ด
- ภาษา **JavaScript**, ES modules, import ด้วย `@/` เสมอ (ไม่ใช้ `../../`)
- **นามสกุลไฟล์:** component และ page ใช้ `.jsx`, ไฟล์ logic, query และ action ใช้ `.js`
- **ชื่อ:** component เป็น `PascalCase` และ export แบบ named (`export function PartyCard`) · ฟังก์ชันเป็น `camelCase` · ไฟล์ใน `lib/` เป็น `kebab-case.js`
- comment อธิบาย**ทำไม** ไม่ใช่ทำอะไร เขียนภาษาอังกฤษหรือไทยก็ได้ แต่ให้สอดคล้องกันในแต่ละไฟล์
- ห้ามเพิ่ม dependency ใหม่โดยไม่ตกลงกับทีมก่อน
- `npm run lint` ต้องผ่านก่อน commit
- ห้าม `console.log` ที่ไม่จำเป็นในโค้ดที่ merge (`console.error` สำหรับ error ฝั่ง server ใช้ได้)

---

## 16. Git workflow

- **Branch:** `<เลข issue>-<slug ของชื่อ issue>` เช่น `6-add-join-leave-approval-and-the-time-conflict-lock` (ปุ่ม "Create branch" ใน GitHub issue สร้างชื่อแบบนี้ให้)
- **Commit:**
  - หัวข้อเป็นประโยคคำสั่งภาษาอังกฤษ บอกสิ่งที่เปลี่ยน
  - body อธิบายเหตุผลและกติกาที่เพิ่ม
  - ลงท้ายด้วย `Refs #<issue หรือ sub-issue>`
  - commit ละ 1 sub-issue หรือ 1 ขั้นของงาน
- **PR:** เข้า branch หลักที่ทีมตกลง ใส่ `Closes #<issue>` และ `Closes #<sub-issue>` ทุกตัว พร้อมสรุปการทดสอบ
- ไฟล์ทำงานที่ไม่ commit อยู่ใน `matee/` และ ignore ด้วย `matee/.gitignore`: `Claude Plan.md`, `Report.md`, `QA.md`, `Claude-QA.md` ถ้าวางไว้ที่ root ของ repo จะขึ้นเป็น untracked
- ก่อนเปิด PR:
  - rebase หรือ merge branch หลักล่าสุด
  - lint และ build ต้องผ่าน
  - ทดสอบ flow ด้วย 2 บัญชี

---

## 17. การทดสอบ

**ขั้นต่ำก่อนเปิด PR**
1. `cd matee && npm run lint`
2. `npm run build`
3. ทดสอบด้วยมือ 2 บัญชี (browser ปกติ + incognito) ตาม flow ของ issue

**การทดสอบอัตโนมัติกับ DB จริง** (แบบที่ใช้กับ #5 และ #6 สคริปต์ไม่ได้อยู่ใน repo)
- ล็อกอินด้วย `@supabase/ssr` `createServerClient` ที่เก็บ cookie ไว้ในหน่วยความจำ แล้วเรียก `signInWithPassword` จะได้ cookie รูปแบบเดียวกับ browser
- เรียก Server Action จริงโดยใช้ Node module loader แทน `@/lib/supabase/server` ด้วย client ที่ผูกกับ cookie ของผู้ใช้ที่กำลังทดสอบ และแทน `next/cache` ด้วย stub
- ตรวจหน้าเว็บด้วย `fetch` พร้อม header `cookie` ไปที่ dev server แล้วค้นข้อความใน HTML (ตัด `<!-- -->` ที่ React แทรกออกก่อน)
- **ข้อมูลทดสอบ:** ชื่อตี้ขึ้นต้นด้วย `[TEST]`, ใช้วันที่ปี **2099** เพื่อไม่ให้ชนกับข้อมูลจริง และ**ลบทิ้งใน `finally` ทุกครั้ง**
- ทดสอบกรณีตี้จบแล้วหรือแชทหมดอายุ: host แก้ `event_date` ของตี้ทดสอบเป็นอดีต (RLS อนุญาต owner)
- ทดสอบ Realtime: subscribe จาก node แล้ว**รอ 3–4 วินาที**หลัง `SUBSCRIBED` ก่อนส่งข้อมูล
- ถ่ายภาพหน้าจอด้วย browser แบบ headless: `BootSplash` จะคลุมหน้าตอน load ให้ซ่อน `#boot-splash` ใน profile ของ browser ที่ใช้ทดสอบ (เช่น `userContent.css` ของ Firefox) โดยไม่แก้โค้ดแอป และค่าในฟอร์ม react-hook-form อาจยังว่างถ้าถ่ายก่อน hydrate

**Logic ล้วน** (`time.js`, `expiry.js`, `access.js`, `member-state.js`, `findConflict`, `my-party.js`) ทดสอบด้วย `node` ตรงๆ ได้ เพราะไม่มี dependency ฝั่ง server

---

## 18. Environment และการตั้งค่า

### Env (`matee/.env` หรือ `.env.local`, ห้าม commit)
| ตัวแปร | ใช้ที่ |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ทุก client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ทุก client (ใช้ร่วมกับ RLS) |

ห้ามใส่ service role key ในแอปนี้

### ตั้งค่าใน Supabase
1. รัน migration ทุกไฟล์ใน `supabase/migrations/` ตามลำดับชื่อไฟล์ (ไม่ใช่ `supabase/schema.sql` ดู Known issue ข้อ 1)
2. เปิด Realtime ให้ `parties` และ `party_messages` (schema ทำให้แล้ว ตรวจใน Database > Publications)
3. เปิด extension `pg_cron` เพื่อให้ job `purge-expired-chats` ทำงาน
4. Auth: ตั้ง JWT Signing Keys เป็นแบบ asymmetric (ให้ `getSession()` ตรวจกับ JWKS ได้) และพิจารณาปิด email confirmation สำหรับ demo
5. Auth redirect URLs: `http://localhost:3000/**` และโดเมน Vercel
6. ตั้ง admin: แก้ `profiles.role = 'admin'` ใน Table editor

### Local dev
```bash
cd matee
npm install
npm run dev          # http://localhost:3000
```
ทดสอบจากเครื่องอื่นใน LAN เดียวกัน: เปิด `http://<IP>:3000` และเพิ่ม IP นั้นใน `allowedDevOrigins` ของ `next.config.mjs` ถ้าหน้าเว็บโหลดไม่ครบ

### Vercel (#9)
- Root directory: `matee`
- env: 2 ตัวข้างบน

---

## 19. สถานะงานและ Known issues

### สถานะ issue (ณ 2026-10-09)
| Issue | เรื่อง | สถานะ |
|---|---|---|
| #1, #2 | scaffold, schema | ✅ ปิดแล้ว |
| #3 | register/login/session/avatar | ✅ merge เข้า `development` แล้ว (PR #47) |
| #4 | create, feed, detail | ✅ อยู่ใน `development` ค้นหา/หมวดย้ายไป `/search` (PR #49) ส่วน `/categories` อยู่บน branch 22 |
| #5 | live chat + หมดอายุ 7 วัน | ✅ merge เข้า `development` แล้ว (PR #48) |
| #6 | join/leave/approve/time conflict + QA รอบ 1–2 | ✅ merge เข้า `development` แล้ว (PR #48) |
| – | Restyle แบบ Threads (sidebar, `/search`, modal, โปรไฟล์, โลโก้, splash) | ✅ merge เข้า `development` แล้ว (PR #49) |
| #7 (+#22, #23, #24) | admin + moderation | 🌿 branch `22-...` / `7-...` |
| #8 | จำนวนคน live บนการ์ด | ⏳ (ใช้แพทเทิร์นในหัวข้อ 13) |
| #9 | deploy Vercel + smoke test | ⏳ |

### Known issues / หนี้ทางเทคนิค
1. **`supabase/schema.sql` เป็นสำเนาเก่า:** ไม่ตรงกับ migration ตรงส่วน bucket avatars (ไม่มี size limit / MIME types) และยังไม่มีการ drop `skips` ให้ใช้ `supabase/migrations/` เป็นแหล่งจริง และควรลบหรือ generate `schema.sql` ใหม่ (SQL syntax `on conflict (id) do update` ใน migration แก้แล้วเมื่อ 2026-10-09)
2. **`middleware.js` → `proxy.js`:** Next 16 แจ้งเตือนว่า deprecated ซึ่ง branch 22 เปลี่ยนแล้ว อย่าแก้ซ้ำซ้อน ให้ merge ตาม branch นั้น
3. **รูปแบบผลลัพธ์ของ action ไม่ตรงกัน:** admin/avatar ใช้ `{ error }` ส่วน party/chat ใช้ `{ ok, code, message }` ให้ใช้แบบหลังเป็นมาตรฐาน
4. ~~สีของหน้า auth/account ใช้ `zinc`/`white` ตรงๆ~~ แก้แล้ว 2026-10-09: ทุกหน้าใช้ token ของธีม Lagoon Sunset (เหลือแค่ `bg-black/40` ของ backdrop และ overlay ตอนอัปโหลดรูป ซึ่งตั้งใจใช้)
5. **`getUser()` ซ้ำใน 1 request:** layout กับ page ใช้ `loadAccount()` (cache) ร่วมกันแล้ว แต่ middleware และ `getViewerMembership`/`CreateParty` ยังเรียก `getUser()` ของตัวเอง หน้าที่ล็อกอินจึงช้ากว่าหน้า guest ราว 2 เท่า แนวทางลด: ใช้ user จาก `cache()` ตัวเดียวทั้ง request และใช้ `getClaims()` ใน middleware (ดู `matee/Claude-QA.md` U-1, N-6)
6. หน้า `/party/[id]` มีลิงก์ "ตี้อื่นในหมวด" ไป `/?category=` หลัง PR #49 หน้า `/` ยังกรองตามหมวดได้ แต่**ไม่มี chip หรือข้อความบอกว่ากำลังกรองอยู่** ควรเปลี่ยนลิงก์เป็น `/search?category=`
7. Realtime DELETE ของ `party_messages` ส่งไปทุกคนที่เปิดแชทอยู่ทุกตี้ (ข้อจำกัดของ Supabase) ยังรับได้เพราะการลบเกิดเฉพาะตอน moderation
8. ยังไม่มีปุ่มลบข้อความของ host บนหน้าตี้ (#24)
9. **เอาฟีเจอร์ข้ามตี้ (skip) ออกแล้ว:** โค้ดไม่มี `SkipButton`, `skipParty()` หรือตัวกรอง `skips` ใน `listParties` แล้ว แต่ตาราง `public.skips` ยังอยู่ใน DB โดยไม่มีโค้ดใช้ ถ้าจะลบให้ทำเป็น migration ใหม่ (`drop table public.skips`) หลังทุกเครื่องใช้โค้ดที่ไม่มี skip แล้ว และห้ามแก้ migration เดิม

10. **Boot splash บังเนื้อหาทุกครั้งที่โหลดหน้าเต็ม:** อย่างน้อย 0.7 วินาที (400ms + fade) และนานกว่านั้นบนเครื่องที่ JavaScript โหลดช้า ทั้งที่ server render เนื้อหามาครบแล้ว (ดู `matee/Claude-QA.md`)
11. **มือถือ: guest ไม่มีที่เปลี่ยนธีม** เพราะเมนู ≡ อยู่แค่ใน sidebar ส่วนคนที่ล็อกอินเปลี่ยนได้จากเฟืองในหน้า `/account` เท่านั้น
12. **`EditProfileForm` กด "เสร็จสิ้น" แล้วเรียก `router.back()` เสมอ** ถ้าเข้า `/account/edit` ตรงๆ จะย้อนออกนอกเว็บแทนที่จะไป `/account`
13. **`Modal` ไม่ขัง focus:** กด Tab แล้วออกไปที่หน้าข้างหลังได้
14. **ปุ่ม "เข้าสู่ระบบ" บนแถบบนมือถือ (guest) ตัดเป็น 2 บรรทัด**

---

## 20. Checklist สำหรับ AI agent

ก่อนเขียนโค้ด
- [ ] อ่าน `matee/AGENTS.md` และ docs ใน `matee/node_modules/next/dist/docs/` สำหรับ API ของ Next ที่จะใช้
- [ ] อ่าน RLS และ trigger ที่เกี่ยวข้องใน migration เพราะกติกาจริงอยู่ที่ DB
- [ ] หา helper ที่มีอยู่แล้วก่อนเขียนใหม่ (`time.js`, `my-commitments.js`, `member-state.js`, `chat/*`, `queries.js`)
- [ ] เช็คว่าอยู่บน branch ของ issue ที่ถูกต้อง

ระหว่างเขียน
- [ ] อ่านใน Server Component, เขียนใน Server Action (`"use server"`)
- [ ] ทุก action: ตรวจ input → `getUser()` → ตรวจสิทธิ์ → เขียน → แปลง error → `revalidatePath` → คืน `{ ok, code, message }`
- [ ] ข้อความ UI เป็นภาษาไทยตามหัวข้อ 10.6 และ 14
- [ ] ใช้ design tokens ไม่ hard-code สี
- [ ] เวลาใช้ helper ใน `time.js` (Asia/Bangkok) เสมอ
- [ ] ไม่แก้ไฟล์ของ feature อื่นที่เพื่อนรับผิดชอบโดยไม่จำเป็น เช่น auth หรือ admin
- [ ] ไม่เพิ่ม dependency และไม่ใช้ service role key
- [ ] หน้าใหม่: ใช้ `<main className="flex w-full flex-1 flex-col">` ภายใน `AppShell` ถ้าเป็นหน้าเต็มจอ (ไม่มี sidebar) ให้เพิ่มใน `BARE_PATHS` และถ้าเป็นหน้าหลักให้เพิ่มลิงก์ใน `links` ของ `site-header.jsx`
- [ ] ฟอร์มที่ควรเปิดทับหน้าเดิม: ทำเป็น modal ตามหัวข้อ 14 (ครบ 4 ไฟล์) และปุ่ม/ลิงก์ใหม่ใส่ class `press`

ก่อนจบงาน
- [ ] `npm run lint` และ `npm run build` ผ่าน
- [ ] ทดสอบด้วย 2 บัญชี หรือสคริปต์ตามหัวข้อ 17 และลบข้อมูล `[TEST]` ทุกครั้ง
- [ ] commit ละขั้นพร้อม `Refs #<issue>` แต่ไม่ push หรือเปิด PR ถ้าไม่ได้รับคำสั่ง
- [ ] ถ้าโค้ดทำให้เอกสารนี้ไม่ตรง ให้แก้เอกสารนี้ด้วย