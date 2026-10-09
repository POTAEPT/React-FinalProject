# MaTee (มาตี้กัน) — เอกสารอธิบายระบบสำหรับทีม

> ใช้เตรียมตอบคำถามตอนนำเสนอ อ่านหัวข้อ 1–3 ให้เข้าใจภาพรวมก่อน แล้วไปหัวข้อ 9 (เช็คลิสต์) กับหัวข้อ 10 (คำถามที่น่าจะโดนถาม)
> เนื้อหาตรงกับโค้ดบน `main` (`cc1ca63`) ที่ deploy อยู่บน https://react-final-project-woad.vercel.app วันที่ 10 ต.ค. 2569 · รายละเอียดเชิงเทคนิคเพิ่มเติมอยู่ใน `System-Design.md`

## สารบัญ
1. แอปนี้คืออะไร
2. เทคโนโลยีที่ใช้ และทำไมเลือก
3. ภาพรวมสถาปัตยกรรม
4. โครงสร้างโฟลเดอร์
5. ฐานข้อมูลและกติกาใน DB
6. Logic ของแต่ละฟีเจอร์
7. ความปลอดภัย
8. ความเร็ว
9. อธิบายตามเช็คลิสต์ Final Project
10. คำถามนอกเช็คลิสต์ที่น่าจะโดนถาม
11. ข้อจำกัดและสิ่งที่ยังไม่ได้ทำ (ตอบตรงๆ ถ้าโดนถาม)
12. การทดสอบ
13. ลำดับเดโมที่แนะนำ
14. คำศัพท์

---

## 1. แอปนี้คืออะไร

**ปัญหา:** นักศึกษาหาเพื่อนไปทำกิจกรรม (ตีแบด บอร์ดเกม ติวสอบ คาเฟ่) ในกลุ่มไลน์/Discord ข้อความจมหาย ค้นย้อนหลังไม่ได้ ไม่รู้ว่าตี้เต็มหรือยัง และไม่รู้ว่าตัวเองนัดซ้อนเวลากันหรือเปล่า

**MaTee แก้ด้วย:**
- ฟีดตี้ที่ยังเปิดรับ แสดงจำนวนคน (เช่น 3/4) และซ่อนตี้ที่เต็ม ยกเลิก หรือเริ่มไปแล้ว
- ตั้งตี้ได้ 2 โหมด: **เข้าได้ทันที** (public) หรือ **ต้องขออนุมัติ** (approve)
- กันนัดซ้อน: เข้าร่วมหรือตั้งตี้ที่เวลาทับกับตี้ที่มีอยู่แล้วไม่ได้
- แชทในตี้แบบ live สำหรับสมาชิก และหายเองหลังตี้จบ 7 วัน
- หน้า "ตี้ของฉัน" แบบ agenda และหน้าจัดการตี้สำหรับเจ้าของ
- หน้าผู้ดูแลระบบ (admin)

**ผู้ใช้ 4 บทบาท**

| บทบาท | คือใคร | ทำอะไรได้ |
|---|---|---|
| Guest | ยังไม่ล็อกอิน | ดูฟีด ค้นหา ดูรายละเอียดตี้ |
| User | ล็อกอินแล้ว | ตั้งตี้ เข้าร่วม/ขอเข้าร่วม/ออก แชท ดูตี้ของฉัน แก้โปรไฟล์ |
| Host | User ที่เป็นเจ้าของตี้นั้น | ยืนยัน/ปฏิเสธคำขอ แก้ไขตี้ ยกเลิกตี้ ลบข้อความในแชทตี้ตัวเอง |
| Admin | `profiles.role = 'admin'` (ตั้งด้วยมือใน Supabase) | ดูภาพรวม ยกเลิก/ลบตี้ใดก็ได้ ดูรายชื่อผู้ใช้ ลบข้อความใดก็ได้ |

---

## 2. เทคโนโลยีที่ใช้ และทำไมเลือก

| เทคโนโลยี | ใช้ทำอะไร | ทำไม |
|---|---|---|
| **Next.js 16 (App Router)** | หน้าเว็บ, Server Component, Server Action, proxy | โจทย์กำหนด และได้ทั้ง render ฝั่ง server และ mutation ในที่เดียว ไม่ต้องเขียน API แยก |
| **React 19 + React Compiler** | UI | Compiler ทำ memo ให้อัตโนมัติ ไม่ต้องเขียน `useMemo`/`useCallback` เองเกือบทั้งหมด |
| **Supabase** | Postgres, Auth, Realtime, Storage, pg_cron | ได้ DB + ล็อกอิน + live + เก็บรูป ในบริการเดียว และตั้งสิทธิ์ด้วย RLS ใน DB ได้ |
| **@supabase/ssr** | เก็บ session ใน cookie | ให้ทั้ง server และ browser อ่าน session เดียวกัน |
| **Tailwind CSS 4** | สไตล์ | เขียนเร็ว และผูกกับ design token (`--brand`, `--line`) |
| **react-hook-form + zod** | ฟอร์มตั้ง/แก้ตี้ | RHF จัดการ state ฟอร์มโดยไม่ re-render ทุกตัวอักษร ส่วน zod เป็น schema เดียวที่ใช้ทั้ง browser และ server |
| **Vercel** | deploy | ทำงานกับ Next.js ได้ทันที |

---

## 3. ภาพรวมสถาปัตยกรรม

```
 Browser
   │  (1) ทุก request ผ่าน proxy ก่อน
   ▼
 proxy.js ── ตรวจ JWT ด้วย getClaims() · ต่ออายุ token · guest เข้าหน้าที่ต้องล็อกอิน → /login
   │
   ▼
 Server Components (page.jsx / layout.jsx)  ── อ่านข้อมูล (SSR) ด้วย session ของผู้ใช้
   │        │
   │        └─ ส่ง HTML + ข้อมูล → Client Components (ปุ่ม, ฟอร์ม, แชท, เมนู)
   │                                      │
   │                                      │ (2) กดปุ่ม/ส่งฟอร์ม
   │                                      ▼
   │                               Server Actions (*actions.js) ── ตรวจ input + สิทธิ์ → เขียน DB
   │                                      │                         → revalidatePath() ให้หน้าโหลดใหม่
   ▼                                      ▼
 Supabase: Postgres (RLS + triggers) · Auth · Storage (avatars) · Realtime (แชท) · pg_cron (ลบแชทหมดอายุ)
```

**หลักใหญ่ 3 ข้อ (ใช้ตอบได้เกือบทุกคำถาม):**
1. **อ่านใน Server Component, เขียนใน Server Action** ส่วน Client Component ใช้เฉพาะส่วนที่ต้องมี state, event หรือ API ของ browser
2. **กติกาจริงอยู่ใน DB** (RLS + trigger) โค้ด Next ตรวจซ้ำก่อนเพื่อให้ข้อความ error ชัด ถ้าโค้ดพลาด DB ก็ยังกันไว้
3. **ทุก action คืนผลรูปแบบเดียวกัน** `{ ok: true, ... }` หรือ `{ ok: false, code, message }` UI จึงแสดง error ได้ทันที

---

## 4. โครงสร้างโฟลเดอร์

```
React-FinalProject/
├── README.md, System-Design.md, Final-Doc.md
├── supabase/migrations/        ← schema จริง (ตาราง, RLS, trigger, cron)
└── matee/src/
    ├── proxy.js                ← ด่านหน้าทุก request (เดิมชื่อ middleware.js)
    ├── app/                    ← หน้า (route) ทั้งหมด
    │   ├── layout.jsx          ← อ่าน cookie ธีม + บัญชี, ห่อ ThemeProvider + AppShell
    │   ├── page.jsx            ← ฟีด /
    │   ├── search/ party/[id]/ create/ my-party/ manage/[id]/ account/ login/ register/
    │   ├── admin/              ← layout (แท็บ) + ภาพรวม, parties, parties/[id], users
    │   ├── @modal/             ← parallel route สำหรับเปิด /create และ /account/edit เป็น modal
    │   └── create/actions.js   ← Server Action createParty
    ├── components/             ← UI (Server หรือ Client ดูจาก "use client" บรรทัดแรก)
    │   ├── theme-provider.jsx  ← Context (global state)
    │   ├── app-shell.jsx, site-header.jsx  ← กรอบแอป sidebar / แถบมือถือ
    │   ├── party/ chat/ admin/ account/ auth/ ui/
    └── lib/                    ← logic แยกตามเรื่อง
        ├── supabase/           ← สร้าง client ฝั่ง server / browser / proxy
        ├── auth/               ← current-user (cache), account, get-session, profile-actions
        ├── parties/            ← queries, member-actions, party-actions, schema (zod), time, my-commitments
        ├── chat/               ← queries, actions, expiry, access
        ├── admin/              ← require-admin, queries, actions
        └── action-result.js    ← fail(code, message)
```

**กฎการแยกไฟล์ใน `lib/`:** `queries.js` คือการอ่าน (ใช้ใน Server Component) · `*actions.js` คือการเขียน (มี `"use server"`) · ไฟล์อื่น (`time.js`, `expiry.js`, `schema.js`) เป็น logic ล้วน ใช้ได้ทั้งสองฝั่ง

---

## 5. ฐานข้อมูลและกติกาใน DB

### ตาราง
| ตาราง | เก็บอะไร | ข้อจำกัดสำคัญ |
|---|---|---|
| `profiles` | ชื่อ, รูป, role | ชื่อ 1–40 ตัว · สร้างเองด้วย trigger `handle_new_user` ตอนสมัคร · ผู้ใช้แก้ `role` เองไม่ได้ |
| `parties` | ตี้ | ชื่อ 1–80 · สถานที่ 1–120 · รายละเอียด ≤1000 · คน 2–30 · ระยะเวลา 30–480 นาที ทีละ 30 · หมวด "อื่นๆ" ต้องพิมพ์ชื่อหมวดเอง · `status` = `open`/`cancelled` · `confirmed_count` แก้ได้เฉพาะ trigger |
| `party_members` | ความสัมพันธ์คน–ตี้ | 1 แถวต่อคนต่อตี้ · `status` = `pending` / `confirmed` / `rejected` / `cancelled` |
| `party_messages` | แชท | 1–500 ตัวอักษร |
| view `party_counts` | จำนวนคำขอรออนุมัติต่อตี้ | ใช้ทำตัวเลขบนเฟืองและหน้าจัดการ |
| Storage `avatars` | รูปโปรไฟล์ | jpeg/png/webp ≤ 2MB · เขียนได้เฉพาะโฟลเดอร์ `avatars/{userId}/` ของตัวเอง |

> ตาราง `skips` และคอลัมน์ `profiles.banned_at` ยังอยู่ใน DB แต่**ไม่มีโค้ดใช้แล้ว** (ทีมตัดฟีเจอร์ข้ามตี้และแบนผู้ใช้ออก ดูหัวข้อ 11)

### เวลา
- เก็บ `event_date` + `event_time` + `duration_minutes` ไม่เก็บเวลาจบลง DB
- เวลาเริ่ม = วันที่ + เวลา **ตามเวลาไทย (+07:00)** · เวลาจบ = เริ่ม + ระยะเวลา
- ฝั่ง JS คำนวณใน `lib/parties/time.js` (`partyStartMs`, `partyEndMs`) และฝั่ง SQL ใช้ `party_start_at`/`party_end_at` ด้วยสูตรเดียวกัน
- "จบแล้ว" ไม่ใช่สถานะใน DB แต่คิดจากเวลาจบ < ตอนนี้

### Trigger ที่ต้องรู้
| Trigger | ทำอะไร |
|---|---|
| `parties_add_owner` | ตั้งตี้แล้วใส่เจ้าของเป็นสมาชิก `confirmed` อัตโนมัติ (เจ้าของนับเป็น 1 ที่นั่ง) |
| `party_members_capacity` | ถ้า confirmed เกิน `max_members` → error `Party is full` และกันไม่ให้เจ้าของตี้เปลี่ยนสถานะตัวเอง |
| `party_members_refresh_confirmed_count` | นับ `confirmed_count` ใหม่ทุกครั้งที่สมาชิกเปลี่ยน |
| `party_members_time_conflict` / `parties_time_conflict` | เข้าร่วมหรือตั้งตี้ที่เวลาทับ → error `Time conflict` |
| `parties_protect_row` | ห้ามแก้ `confirmed_count` เอง และตี้ที่ยกเลิกแล้วเปิดกลับไม่ได้ |
| `profiles_protect_moderation_columns` | ห้ามผู้ใช้แก้ `role` ของตัวเอง |

### ฟังก์ชันที่ใช้ใน policy
- `is_admin()`: คนที่เรียกเป็น admin ไหม
- `is_active_member(party)`: เป็น pending หรือ confirmed ในตี้นี้ไหม (สิทธิ์อ่าน/ส่งแชท)
- `join_allowed(party, status)`: ตี้ยังเปิด ยังไม่เริ่ม ไม่ใช่เจ้าของ และสถานะตรงโหมด (public → confirmed, approve → pending)
- `has_time_conflict(...)`: เช็คเวลาทับ
- `chat_expires_at(party)`: แชทหมดอายุเมื่อไหร่ (ตี้ปกติ = จบ + 7 วัน · ตี้ยกเลิก = เวลายกเลิก + 7 วัน)

### pg_cron
`purge_expired_chats()` รันทุกวัน 20:00 UTC (= 03:00 เวลาไทย) ลบข้อความของแชทที่หมดอายุ

---

## 6. Logic ของแต่ละฟีเจอร์

### 6.1 สมัคร ล็อกอิน และ session
- **สมัคร** (`/register`): `supabase.auth.signUp` ฝั่ง browser ส่งชื่อเป็น metadata แล้ว trigger `handle_new_user` สร้างแถวใน `profiles`
- **ล็อกอิน** (`/login`): `signInWithPassword` ฝั่ง browser → `@supabase/ssr` เก็บ session (JWT) ใน cookie → `window.location.replace(next)` โหลดหน้าใหม่ทั้งหน้า ให้ server เห็น cookie ใหม่แน่นอน (เคยเจอบั๊กหน้าขาวเมื่อใช้ `router.push` + `refresh`)
- **`?next=`** ผ่าน `safeNextPath()` เสมอ รับเฉพาะ path ในเว็บ กัน open redirect
- คนที่ล็อกอินอยู่แล้วเปิด `/login` จะถูกส่งต่อไปหน้าอื่น

**ตรวจ session 3 แบบ (โดนถามบ่อย):**

| วิธี | ใช้ที่ไหน | ทำงานยังไง |
|---|---|---|
| `getClaims()` | `proxy.js` | ตรวจลายเซ็น JWT ในเครื่องด้วย public key (ES256, cache JWKS 10 นาที) เร็วมาก (~1ms) และต่ออายุ token ที่หมดอายุให้ |
| `getUser()` | หน้า (ผ่าน `getCurrentUser()` ที่ห่อ `cache()`) และทุก Server Action | ถาม Supabase Auth ผ่านเน็ต (~70ms) เชื่อถือได้ที่สุด รู้ทันทีถ้า session ถูกยกเลิก |
| `getSession()` | **ห้ามใช้ตัดสินสิทธิ์** | อ่าน cookie ตรงๆ ไม่ตรวจลายเซ็น ปลอมได้ |

**`proxy.js`** (Next 16 เปลี่ยนชื่อจาก `middleware.js`) ทำ 2 อย่าง: ต่ออายุ token และส่ง guest ที่เข้า `/create`, `/my-party`, `/manage`, `/account` ไป `/login?next=...` ตอน redirect ต้องคัด cookie ใหม่ติดไปด้วย (`redirectWithSession`)

### 6.2 ตั้งตี้ (`/create`)
1. `PartyForm` (Client) ใช้ react-hook-form + `zodResolver(createPartySchema)` แสดง error ทีละช่องทันที
2. กดบันทึก → Server Action `createParty(input)` ตรวจด้วย **schema เดียวกัน** อีกรอบ (ห้ามเชื่อ browser)
3. ตรวจเวลาชนกับตี้ที่ตัวเองมีอยู่ (`getMyCommitments` + `findConflict`) ถ้าชนจะคืน `code: "time_conflict"` พร้อมชื่อตี้ที่ชน ฟอร์มขึ้น error ใต้ช่องวัน/เวลา
4. insert → trigger ใส่เจ้าของเป็นสมาชิก และ trigger เวลาชนตรวจซ้ำ
5. `revalidatePath` หน้า `/` และ `/my-party`
- เปิดจากในแอปจะเป็น **modal** (intercepting route `@modal/(.)create`) ถ้าเข้า URL ตรงจะเป็นหน้าเต็ม

### 6.3 ฟีด (`/`) และค้นหา (`/search`)
- `listParties()` ดึงตี้ `status = 'open'` เรียงตามวันเวลาที่ใกล้สุดก่อน แล้วโหลดชื่อเจ้าของ จำนวนคำขอ และ "commitments" ของคนดู **พร้อมกัน** (`Promise.all`)
- ฟีดหน้าแรกซ่อนตี้ที่ **เต็ม** หรือ **เริ่มแล้ว** · `/search` กรองด้วยคำ (ชื่อ/สถานที่) หมวด ช่วงวันที่ ชื่อเจ้าของ และ "เปิดรับ"
- ค่าตัวกรองอยู่ใน URL (`?q=&category=...`) จึงแชร์ลิงก์ผลค้นหาได้ และกด back ได้
- ปุ่มบนการ์ดคิดจาก `memberActionState()`: guest → ลิงก์ล็อกอิน · เจ้าของ → จัดการ · สมาชิก → เข้าร่วมแล้ว · รออนุมัติ · ถูกปฏิเสธ · ชนเวลา (disabled พร้อมลิงก์ไปตี้ที่ชน) · เต็ม/เริ่มแล้ว

### 6.4 เข้าร่วม / ขออนุมัติ / ออก
**State machine ของ `party_members.status`**
```
(ไม่มีแถว) ──เข้าร่วม (public)──► confirmed ──ออก──► cancelled ──เข้าร่วมใหม่──► confirmed/pending
(ไม่มีแถว) ──ขอเข้าร่วม (approve)─► pending ──host ยืนยัน──► confirmed
                                     │──host ปฏิเสธ──► rejected (ขอใหม่เองไม่ได้ · host เปลี่ยนใจกดยืนยันได้)
                                     └──ยกเลิกคำขอ──► cancelled
```
**`joinParty(partyId)` ตรวจตามลำดับ:** ล็อกอิน → เป็นเจ้าของ? → ตี้ยกเลิก? → เริ่มแล้ว? → เต็ม? → เคยถูกปฏิเสธ? → เป็นสมาชิกอยู่แล้ว? → เวลาชน? → แล้วจึง insert (หรือ update แถวที่เคย cancelled) ถ้า DB ตอบ error (`Party is full`, `Time conflict`, RLS) จะแปลงเป็น `code` เดียวกัน
- เจ้าของตี้ออกจากตี้ตัวเองไม่ได้ ต้องยกเลิกตี้แทน

### 6.5 กันเวลาชน
- ชน = ช่วง `[เริ่ม, จบ)` ทับกัน สูตร `a.start < b.end && b.start < a.end`
- **ต่อกันพอดีไม่นับว่าชน** (ตี้ 18:00–20:00 กับ 20:00–22:00 เข้าได้ทั้งคู่)
- นับเฉพาะตี้ที่ตัวเองเป็น pending/confirmed (รวมตี้ที่เป็นเจ้าของ) ที่ยังเปิดและยังไม่จบ
- ตรวจ 3 ชั้น: ปุ่มบนการ์ด (disabled) → Server Action → trigger ใน DB

### 6.6 จัดการตี้ (`/manage/[id]`)
- เฉพาะเจ้าของ คนอื่นได้ 404 (ไม่บอกว่ามีหน้านี้)
- ยืนยันคำขอ (กดทีเดียว) · ปฏิเสธ (มี dialog ยืนยัน) · เปลี่ยนใจยืนยันคนที่ปฏิเสธไปแล้ว
- **แก้ไขตี้** (`updateParty`) ได้ก่อนตี้เริ่ม: จำนวนคนตั้งต่ำกว่าคนที่ยืนยันแล้วไม่ได้ และ**วัน/เวลาเปลี่ยนไม่ได้ถ้ามีคนอื่นเข้าร่วมหรือขอเข้าร่วมแล้ว** (เพราะคนพวกนั้นเช็คเวลาชนกับเวลาเดิม)
- **ยกเลิกตี้** ย้อนกลับไม่ได้ สมาชิกยังคุยในแชทได้อีก 7 วัน
- หน้านี้ **refresh เองทุก 15 วินาที** ตอนแท็บเปิดอยู่ (`AutoRefresh` เรียก `router.refresh()`) เพราะ `party_members` ไม่ได้เปิด Realtime ข้อความที่พิมพ์ค้างในฟอร์มไม่หาย

### 6.7 แชท
- **ใครเห็น** (`chatAccess`): guest → ให้ล็อกอิน · ยังไม่เป็นสมาชิก/ถูกปฏิเสธ → ให้เข้าร่วม · ออกแล้ว → "คุณออกจากตี้แล้ว" · สมาชิก (pending/confirmed) → เห็นแชท · หมดอายุ → "แชทหมดอายุแล้ว"
- server โหลด 50 ข้อความล่าสุด แล้ว `PartyChat` (Client) subscribe **Supabase Realtime** (`postgres_changes` INSERT/DELETE บน `party_messages`) และ RLS กรองให้แต่ละคนเห็นเฉพาะตี้ที่มีสิทธิ์
- **ต้องโหลด session ก่อนเชื่อม Realtime:** browser client อ่าน session จาก cookie แบบ async ถ้าเชื่อม channel ทันทีจะเชื่อมแบบไม่ได้ล็อกอิน แล้ว RLS กรองข้อความใหม่ทิ้งหมด (เคยเป็นบั๊ก เจอตอนเทส E2E ก่อน deploy) จึง `await getSession()` ก่อน subscribe หลังแก้ ข้อความใหม่ขึ้นภายใน 0.2–0.9 วินาที
- **catch-up 3 วินาที:** Realtime บอกว่า subscribe แล้ว แต่จะเริ่มส่ง event หลังจากนั้นราว 3 วินาที จึงโหลดข้อความล่าสุดซ้ำ 1 ครั้งหลัง 3 วินาที กันข้อความที่ส่งเข้ามาในช่วงนั้นหาย และ dedupe ด้วย id
- **หมดอายุ:** ตี้จบแล้วแชทจะหายใน 7 วัน (มีป้ายนับวันถอยหลัง) · insert policy ใน DB ก็เช็คเวลาหมดอายุเหมือนกัน · cron ลบข้อความจริงทุกคืน
- **ลบข้อความ:** เจ้าของตี้ลบได้ทุกข้อความในตี้ตัวเอง (ปุ่ม "ลบ" 2 จังหวะ) และ admin ลบได้ทุกข้อความ คนที่เปิดแชทอยู่จะเห็นข้อความหายทันทีผ่าน Realtime DELETE
- ออกจากตี้ → หน้า revalidate → component แชท unmount และปิด channel เอง ส่วน RLS ก็กันไม่ให้อ่านต่อ

### 6.8 ตี้ของฉัน (`/my-party`)
- agenda จัดกลุ่มตามวัน: เป็นเจ้าของ / ยืนยันแล้ว / รออนุมัติ / ยกเลิก (มีป้ายกำกับ)
- ตี้ที่จบแล้วอยู่ในส่วน "ที่ผ่านมา" ที่พับไว้
- แถวที่เป็นเจ้าของมีเฟืองไป `/manage/[id]` พร้อมตัวเลขคำขอรออนุมัติ

### 6.9 โปรไฟล์ (`/account`, `/account/edit`)
- แก้ชื่อ (`updateDisplayName`) และรูป (`uploadAvatar`) ใน modal
- เลือกรูปแล้ว**ยังไม่อัปโหลด** แค่แสดงตัวอย่าง (blob URL) จนกด "บันทึก" ถ้ากดยกเลิกก็ไม่มีอะไรถูกบันทึก
- ตรวจชนิดไฟล์ (jpeg/png/webp) และขนาด (≤ 2MB) ทั้งก่อนส่งและใน Server Action

### 6.10 Admin
- `requireAdmin()` ใน layout ของ `/admin` และทุกหน้า ถ้าไม่ใช่ admin (รวม guest) ได้ **404**
- ปุ่ม "ผู้ดูแลระบบ" (ไอคอนโล่) ใน sidebar และแถบล่างมือถือ แสดงเฉพาะ admin
- ภาพรวม: ตี้เปิดอยู่ / จบแล้ว / ยกเลิก, ผู้ใช้, การเข้าร่วม (ไม่นับเจ้าของ), คำขอรออนุมัติ, ข้อความ, คนสมัครล่าสุด 5 คน
- `/admin/parties`: ทุกตี้ ค้นหาและกรอง ยกเลิก (เฉพาะที่ยังไม่จบ) หรือลบ
- `/admin/parties/[id]`: รายละเอียด + แชททั้งหมด ลบข้อความได้
- `/admin/users`: รายชื่อ บทบาท วันที่สมัคร (ไม่แสดงอีเมล เพราะอีเมลอยู่ใน `auth.users` ที่ต้องใช้ service role key ซึ่งห้ามใช้)
- action ของ admin ตรวจสิทธิ์ซ้ำทุกครั้ง และ RLS (`is_admin()`) ตรวจอีกชั้น

### 6.11 ธีม (global state)
- 3 แบบ: ตามระบบ / สว่าง / มืด เก็บใน cookie `matee-theme`
- layout อ่าน cookie แล้วใส่ `data-theme` บน `<html>` ตั้งแต่ server หน้าแรกจึงไม่กะพริบ
- `ThemeProvider` (Context) เก็บค่า และ `useTheme()` ให้เมนูเปลี่ยนธีม
- สีทั้งหมดเป็น token ที่เขียนด้วย CSS `light-dark()` ตัวเดียวได้ทั้งสองโหมด
- ภาษาสี: ปุ่มหลัก = teal (`bg-brand`) · ตัวที่เลือก = mint (`brand-soft`) · สถานะรอ = ส้ม (`highlight`) · อันตราย = แดง (`danger`)

---

## 7. ความปลอดภัย

**ตรวจ 3 ชั้น**
1. **Route:** `proxy.js` ส่ง guest ไปล็อกอิน · หน้าเจ้าของ/admin เรียก `notFound()` ถ้าไม่มีสิทธิ์
2. **Server Action:** ตรวจ input (zod/regex) → `getUser()` → สิทธิ์ → กติกา แล้วคืน `code` ที่ชัดเจน
3. **Database:** RLS ทุกตาราง + trigger ต่อให้มีคนยิง API ของ Supabase ตรงด้วย anon key ก็ทำเกินสิทธิ์ไม่ได้

**จุดที่ควรพูดได้**
- anon key อยู่ฝั่ง browser ได้ เพราะสิทธิ์จริงอยู่ที่ RLS ไม่ใช่ที่ key · โปรเจกต์**ไม่ใช้ service role key**
- JWT อยู่ใน cookie ที่ `@supabase/ssr` จัดการ และ server ตรวจลายเซ็นทุกครั้ง
- กัน open redirect ด้วย `safeNextPath()`
- id ใน URL ถูกตรวจรูปแบบ UUID ก่อน query
- Server Action ตรวจซ้ำทุกอย่างที่ฟอร์มตรวจ เพราะใครก็เรียก action ตรงได้

---

## 8. ความเร็ว

| สิ่งที่ทำ | ได้อะไร |
|---|---|
| `getCurrentUser()` ห่อด้วย React `cache()` | layout, page และ query ใน request เดียวกันเรียก `getUser()` ครั้งเดียว |
| `Promise.all` ในการโหลดฟีด | โหลดเจ้าของตี้ จำนวนคำขอ และตี้ของคนดูพร้อมกัน |
| proxy ใช้ `getClaims()` แทน `getUser()` + เลิก query ทุก request | ไม่ต้องถาม Supabase ทุก request |
| ผลรวม (production, median 10 ครั้ง) | หน้าที่ล็อกอินจาก **310–539ms เหลือ 191–261ms** · guest ~131ms |
| Boot splash แสดงเฉพาะเมื่อโหลดเกิน 1 วินาที | ปกติไม่เห็น splash |

---

## 9. อธิบายตามเช็คลิสต์ Final Project

### ข้อ 1: App Router อย่างน้อย 4 route ✅
**ตอบ:** มี 14 หน้า: `/`, `/search`, `/party/[id]`, `/create`, `/my-party`, `/manage/[id]`, `/account`, `/account/edit`, `/login`, `/register`, `/admin`, `/admin/parties`, `/admin/parties/[id]`, `/admin/users`
**ฟีเจอร์ App Router ที่ใช้และอธิบายได้:**
- dynamic segment `[id]`
- nested layout (`app/admin/layout.jsx` ทำแท็บ)
- **parallel + intercepting route** (`@modal/(.)create`): กดจากในแอปเปิดเป็น modal ส่วนเข้า URL ตรงเปิดเป็นหน้าเต็ม
- `not-found.jsx` และ `error.jsx`
- `generateMetadata` ตั้ง title ตามชื่อตี้

### ข้อ 2: Server + Client Component พร้อมเหตุผล ✅
**ตอบ:** ทุก `page.jsx`/`layout.jsx` เป็น Server เพราะดึงข้อมูลด้วย session ของผู้ใช้ฝั่ง server (RLS ตรวจสิทธิ์ให้) และไม่ต้องส่ง JavaScript ของส่วนที่แสดงผลอย่างเดียวไป browser ส่วน Client Component ใช้เฉพาะส่วนที่ต้องมี:
- **state/event:** ปุ่ม, ฟอร์ม, เมนู
- **API ของ browser:** WebSocket ของ Realtime ในแชท, `document.cookie` ของธีม, `usePathname`
- **ตัวอย่างที่ควรยกตอนตอบ:** หน้า `/party/[id]` เป็น Server (ดึงตี้ + ตัดสินว่าเห็นแชทไหม) แต่ข้างในมี `JoinButton` (Client: `useTransition` เรียก action) และ `PartyChat` (Client: Realtime)
- **ดูได้ที่:** README หัวข้อ 4 (ตาราง) · คอมเมนต์ต้นไฟล์

**คำถามต่อยอดที่อาจโดน**
- *ส่งข้อมูลจาก Server ไป Client ยังไง?* ส่งเป็น props ที่ serialize ได้ (object/array/string) ฟังก์ชันส่งไม่ได้ ยกเว้น Server Action
- *Client Component import Server Component ได้ไหม?* ไม่ได้ แต่รับเป็น `children` ได้ เช่น `ThemeProvider` (Client) ห่อ `AppShell` และหน้า Server ที่ส่งเข้ามาเป็น children
- *ทำไม `SiteHeader` เป็น Client?* ต้องรู้ path ปัจจุบันเพื่อไฮไลต์เมนู และเปิด/ปิดเมนู ข้อมูลบัญชีจึงส่งมาจาก layout ที่เป็น Server

### ข้อ 3: SSR/SSG/ISR อย่างเจตนา ✅
**ตอบ:** เลือก **SSR** และประกาศ `export const dynamic = "force-dynamic"` พร้อมคอมเมนต์เหตุผลใน 5 หน้าหลัก (`/`, `/search`, `/party/[id]`, `/my-party`, `/manage/[id]`)

**เหตุผลที่ไม่ใช้ SSG/ISR**
1. หน้าขึ้นกับคนที่ดู (ปุ่ม สถานะ แชท ตี้ของฉัน) ถ้า cache หน้าเดียวให้ทุกคนจะแสดงผิดคน
2. จำนวนที่นั่งและตี้ที่เต็มต้องเป็นค่าปัจจุบัน ถ้าใช้ ISR 60 วินาที คนจะเห็นตี้ที่เต็มไปแล้ว
3. query ใช้ cookie ของผู้ใช้เพื่อให้ RLS ทำงาน จึงต้องรันตอนมี request
4. layout อ่าน cookie (ธีม + บัญชี) อยู่แล้ว ทุกหน้าจึงเป็น dynamic อยู่แล้ว การประกาศ `force-dynamic` ทำให้เจตนาชัด และกันไม่ให้ใครเผลอทำหน้าเป็น static

**เรื่องข้อมูลไม่สด:** หลังเขียนข้อมูลใช้ `revalidatePath()` ส่วนที่ต้อง live จริงใช้ Realtime (แชท) และ `/manage` ใช้ refresh ทุก 15 วินาที

**คำถามต่อยอดที่อาจโดน**
- *ถ้าจะใช้ ISR ใช้ตรงไหนได้?* ข้อมูลสาธารณะที่ไม่ขึ้นกับคนดูและเปลี่ยนไม่บ่อย เช่น หน้าแนะนำหมวดหมู่ หรือสถิติรวม แต่ต้องแยกออกจาก layout ที่อ่าน cookie ก่อน
- *SSR ช้าไหม?* หน้า guest ~130ms หน้าที่ล็อกอิน ~190–260ms บน production ใช้ `cache()` และ `Promise.all` ลดเวลา
- *Next 16 มี `cacheComponents` / `"use cache"`:* โปรเจกต์ไม่ได้เปิด จึงยังใช้ route segment config (`dynamic`) ได้

### ข้อ 4: Mutation ผ่าน Server Action ✅
**ตอบ:** การเขียนทั้งหมดเป็น Server Action (ไฟล์ที่มี `"use server"`) เช่น `createParty`, `joinParty`, `leaveParty`, `decideRequest`, `cancelParty`, `updateParty`, `sendPartyMessage`, `deletePartyMessage`, `uploadAvatar`, `updateDisplayName` และ action ของ admin

**ลำดับในทุก action**
1. ตรวจ input
2. `getUser()`
3. ตรวจสิทธิ์และกติกา
4. เขียน DB
5. แปลง error จาก DB เป็น `code`
6. `revalidatePath()`
7. คืน `{ ok, code, message }`

**ตัวอย่างที่ควรเปิดโค้ดให้ดู:** `lib/parties/member-actions.js` → `joinParty`

**คำถามต่อยอดที่อาจโดน**
- *ทำไมไม่ใช้ Route Handler (API)?* Server Action เรียกจาก component ได้ตรงๆ ไม่ต้องเขียน fetch/endpoint เอง Next ส่ง request ให้ และ revalidate หน้าได้ในตัว ไม่มี client อื่นนอกจากเว็บนี้ที่ต้องใช้ API
- *Server Action ปลอดภัยไหม ในเมื่อใครก็เรียกได้?* ปลอดภัยเพราะ action ตรวจ session และสิทธิ์เองทุกครั้ง และ DB มี RLS อีกชั้น
- *ทำไมคืน error เป็น object แทนการ throw?* UI จะแสดงข้อความภาษาไทยได้ตรงจุด เช่น ใต้ช่องที่ผิด หรือใน dialog และหน้าไม่พัง

### ข้อ 5: Global state ฝั่ง client ✅
**ตอบ:** `ThemeProvider` (React Context) ใน `components/theme-provider.jsx`
- ห่อทั้งแอปใน `app/layout.jsx` ค่าเริ่มต้นมาจาก cookie ที่ layout อ่านฝั่ง server
- `useTheme()` คืน `{ theme, setTheme }` ให้ทุก client component · `setTheme` เปลี่ยน `data-theme` บน `<html>` และบันทึก cookie
- **ทำไมต้องเป็น global:** ธีมใช้ในเมนูหลายตัว (sidebar, แถบบนมือถือ, เมนูบัญชี) ถ้าไม่ใช้ Context ต้องส่ง prop ต่อกัน `layout → AppShell → SiteHeader → MenuButton → MenuPanel` (prop drilling)

**คำถามต่อยอดที่อาจโดน**
- *ทำไมไม่ใช้ Redux/Zustand?* state ที่เป็น global จริงมีแค่ธีม Context ของ React พอ ไม่ต้องเพิ่ม dependency
- *ข้อมูลอื่น เช่น บัญชีผู้ใช้หรือรายการตี้ ทำไมไม่เก็บใน global state?* ข้อมูลพวกนี้มาจาก server ทุก request (SSR) ถ้าเก็บซ้ำฝั่ง client จะมีสองแหล่งที่อาจไม่ตรงกัน จึงให้ server เป็นแหล่งเดียว แล้ว revalidate หลังเขียน
- *ทำไมต้อง `useMemo` ใน provider?* ให้ object ที่ส่งเข้า Context เปลี่ยนเฉพาะตอนธีมเปลี่ยน component ที่ใช้จะไม่ render ใหม่โดยไม่จำเป็น

### ข้อ 6: ฟอร์ม validate จริง (react-hook-form + zod) ✅
**ตอบ:** ฟอร์มตั้งตี้/แก้ตี้ `components/party/PartyForm.jsx` ใช้ `useForm({ resolver: zodResolver(createPartySchema) })` โดย schema อยู่ที่ `lib/parties/schema.js`

**กติกาที่ตรวจ**
- ชื่อ 1–80 ตัว
- หมวดต้องอยู่ในรายการ ถ้าเลือก "อื่นๆ" ต้องพิมพ์ชื่อหมวด
- วันและเวลาต้องยังมาไม่ถึง
- ระยะเวลา 30–480 นาที (ทีละ 30)
- สถานที่ 1–120 ตัว
- จำนวนคน 2–30
- รายละเอียด ≤ 1000 ตัว

**จุดเด่นที่ควรพูด**
- **schema เดียวใช้ 2 ที่:** ฝั่ง browser (แสดง error ทันที) และใน Server Action `createParty`/`updateParty` (`safeParse`) เพราะ browser ข้ามการตรวจได้
- error จาก server (เช่น เวลาชน หรือจำนวนคนต่ำกว่าคนที่ยืนยันแล้ว) ถูกส่งกลับมาแสดงใต้ช่องที่เกี่ยวข้อง (`fieldErrors`)
- ใช้ `subscribe` ของ RHF แทน `watch` เพราะ React Compiler

**ถ้าโดนถามว่าฟอร์มล็อกอิน/สมัครใช้อะไร:** ตอนนี้เป็น `useState` + ตรวจเอง (ทำก่อนตกลงมาตรฐาน) ฟอร์มที่ตรงเกณฑ์คือฟอร์มตั้งตี้

### ข้อ 7: Responsive + deploy Vercel ✅
**Responsive (3 ขนาด)**
- จอ ≥ 72rem: sidebar เต็มทางซ้าย
- md–72rem: sidebar หดเป็นแถบไอคอน
- มือถือ: แถบบน (หน้าแรก) + แถบล่างแบบไอคอน
- เนื้อหาเป็นคอลัมน์กลาง และ modal บนมือถือเต็มจอ

**Deploy:** https://react-final-project-woad.vercel.app deploy อัตโนมัติจาก branch `main` · เทสบนเว็บจริงแล้ว: smoke test ตาม issue #9 ผ่าน 20/20 (ตั้งตี้, เข้าจนเต็มแล้วการ์ดหาย, ออกแล้วการ์ดกลับ, อนุมัติคำขอ, แชท live ทั้งสองฝั่ง) และเปิดทุกหน้าด้วย 4 บทบาทผ่าน 63/63

**คำถามต่อยอดที่อาจโดน**
- *ตั้งค่าอะไรบน Vercel?* Root Directory = `matee`, env `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` และใน Supabase Auth เพิ่มโดเมน Vercel ใน Redirect URLs
- *ทำไม env ขึ้นต้น `NEXT_PUBLIC_`?* browser ต้องใช้ (ล็อกอิน, Realtime) และเปิดเผยได้เพราะสิทธิ์อยู่ที่ RLS

---

## 10. คำถามนอกเช็คลิสต์ที่น่าจะโดนถาม

**Q: ถ้าสองคนกดเข้าร่วมที่นั่งสุดท้ายพร้อมกัน?**
A: action เช็คก่อนว่าเต็มไหม แล้ว trigger `enforce_party_capacity` นับคน confirmed อีกครั้งตอน insert ถ้าเกินจะ error `Party is full` และ UI แสดง "ตี้นี้เต็มแล้ว" (ข้อจำกัด: trigger ไม่ได้ lock แถวตี้ ถ้ากดในเสี้ยววินาทีเดียวกันจริงๆ มีโอกาสเกินได้ในทางทฤษฎี ดูหัวข้อ 11)

**Q: กันนัดซ้อนยังไง ทำไม 18:00–20:00 กับ 20:00–22:00 ไม่ชน?**
A: ใช้ช่วงเวลาแบบ `[start, end)` ชนเมื่อ `a.start < b.end && b.start < a.end` จุดจบไม่นับรวม ต่อกันพอดีจึงไม่ชน ตรวจทั้ง UI, action และ trigger

**Q: ทำไม logic ซ้ำทั้งในโค้ดและใน DB?**
A: ฝั่งโค้ดให้ข้อความ error ที่ชัดและเร็ว ฝั่ง DB เป็นด่านสุดท้ายที่ข้ามไม่ได้ (ต่อให้ยิง API ตรงหรือโค้ดมีบั๊ก)

**Q: RLS คืออะไร?**
A: Row Level Security เป็นกติกาต่อแถวใน Postgres เช่น "แก้ตี้ได้เฉพาะ owner_id = คนที่ล็อกอิน" Supabase ส่ง JWT ของผู้ใช้ไปกับทุก query DB จึงรู้ว่าใครเรียก (`auth.uid()`)

**Q: แชทเป็น live ได้ยังไง?**
A: Supabase Realtime ฟังการเปลี่ยนแปลงในตาราง `party_messages` (INSERT/DELETE) ผ่าน WebSocket และใช้ select policy (RLS) กรองให้แต่ละคน มีการโหลดซ้ำหลัง 3 วินาทีกันข้อความหลุดช่วงเริ่ม subscribe

**Q: ทำไมจำนวนคนบนการ์ดไม่ live?**
A: ตอนนี้ live เฉพาะแชท ส่วนจำนวนคนบนฟีดคือ issue #8 ที่ยังไม่ได้ทำ ฟีดแสดงค่าล่าสุดทุกครั้งที่โหลดหน้า (SSR) และหลังกดปุ่มใดๆ หน้าจะ revalidate และถ้ากดเข้าร่วมตี้ที่เต็มไปแล้ว ระบบตอบว่าเต็ม

**Q: แชทหายหลัง 7 วันทำยังไง?**
A: `chat_expires_at()` คำนวณเวลาหมดอายุ (จบ + 7 วัน หรือยกเลิก + 7 วัน) · insert policy ห้ามส่งหลังหมดอายุ · หน้าเว็บแสดง "แชทหมดอายุแล้ว" · pg_cron ลบข้อความจริงทุกคืน 03:00

**Q: `revalidatePath` ทำอะไร?**
A: บอก Next ว่าหน้านั้นข้อมูลเปลี่ยนแล้ว ครั้งถัดไปที่โหลด (รวมหน้าปัจจุบันหลัง action) จะ render ใหม่ด้วยข้อมูลล่าสุด

**Q: React `cache()` ใช้ทำอะไร?**
A: จำผลของฟังก์ชันไว้ตลอด 1 request เช่น `getCurrentUser()` ถูกเรียกจาก layout, page และ query แต่ถาม Supabase จริงครั้งเดียว (ไม่ได้ cache ข้าม request หรือข้ามผู้ใช้)

**Q: modal `/create` ทำยังไง ทำไมรีเฟรชแล้วเป็นหน้าเต็ม?**
A: ใช้ parallel route `@modal` + intercepting route `(.)create` กดลิงก์ในแอป Next จะดักไปแสดงใน slot `@modal` ทับหน้าเดิม ถ้าเข้า URL ตรงหรือรีเฟรชจะไม่มีหน้าเดิมให้ทับ จึงแสดงเป็นหน้าเต็ม · modal ใส่ `inert` ให้เนื้อหาข้างหลัง focus จึงไม่หลุดออกไป

**Q: Next 16 ต่างจากเวอร์ชันก่อนตรงไหนที่โปรเจกต์เจอ?**
A: `params`/`searchParams`/`cookies()` ต้อง `await` · `middleware.js` เปลี่ยนชื่อเป็น `proxy.js` (รันบน Node.js) · React Compiler เปิดใช้ได้ · มี Cache Components แบบใหม่ (โปรเจกต์ยังไม่เปิด)

**Q: `getClaims()` ต่างจาก `getUser()` ยังไง ทำไมใช้คนละที่?**
A: `getClaims()` ตรวจลายเซ็น JWT ในเครื่อง (เร็ว) เหมาะกับ proxy ที่รันทุก request · `getUser()` ถาม Supabase Auth (ช้ากว่าแต่รู้ทันทีถ้า session ถูกเพิกถอน) ใช้ในหน้าและ action ที่ตัดสินสิทธิ์จริง

**Q: เวลาในแอปใช้ timezone อะไร?**
A: เวลาไทย (+07:00) ทั้งการคำนวณ (`partyStartMs`) และการแสดงผล (`Intl.DateTimeFormat` + `Asia/Bangkok`) server บน Vercel ใช้ UTC ถ้าไม่กำหนดเวลาจะเพี้ยน 7 ชั่วโมง

**Q: ทำไมผู้ใช้เปลี่ยน role ตัวเองเป็น admin ไม่ได้?**
A: trigger `profiles_protect_moderation_columns` ห้ามแก้ `role` จากแอป admin ตั้งได้เฉพาะใน Supabase dashboard

**Q: ทำไมเจ้าของตี้ออกจากตี้ตัวเองไม่ได้?**
A: เจ้าของนับเป็นสมาชิก confirmed เสมอ (trigger กันไว้) ถ้าไม่อยากจัดแล้วให้ยกเลิกตี้ ซึ่งแจ้งสมาชิกชัดกว่าตี้ที่ไม่มีเจ้าของ

**Q: ทำไมห้ามเปลี่ยนวัน/เวลาเมื่อมีคนเข้าร่วมแล้ว?**
A: คนที่เข้าร่วมเช็คเวลาชนกับเวลาเดิมไปแล้ว ถ้าย้ายเวลาอาจทำให้เขานัดซ้อนโดยไม่รู้ตัว

**Q: ทำไมถูกปฏิเสธแล้วขอใหม่ไม่ได้?**
A: กันการกดขอซ้ำจนรบกวนเจ้าของ แต่เจ้าของเปลี่ยนใจกดยืนยันได้จากรายการ "ปฏิเสธแล้ว"

**Q: ทำไม `/manage` ใช้ refresh ทุก 15 วินาทีแทน Realtime?**
A: ตาราง `party_members` ไม่ได้เปิด Realtime (ต้องแก้ DB) การ refresh เฉพาะตอนแท็บเปิดอยู่จึงง่ายกว่าและพอสำหรับงานนี้ และข้อมูลที่พิมพ์ค้างไม่หาย

**Q: เก็บรูปโปรไฟล์ยังไง ปลอดภัยไหม?**
A: Supabase Storage bucket `avatars` อัปโหลดได้เฉพาะโฟลเดอร์ของตัวเอง จำกัดชนิดและขนาดทั้งที่ bucket และใน action ชื่อไฟล์ใส่ timestamp กัน browser cache รูปเก่า

**Q: Accessibility ทำอะไรบ้าง?**
A: ทุกปุ่มไอคอนมี `aria-label` · focus ring ชัด · contrast ผ่าน WCAG AA (คำนวณไว้ใน System-Design) · modal ขัง focus · สถานะไม่ได้บอกด้วยสีอย่างเดียว มีข้อความกำกับ · error ใช้ `role="alert"`

**Q: ตัดฟีเจอร์อะไรออก ทำไม?**
A: "ข้ามตี้" (skip) และ "แบนผู้ใช้" เพื่อลดขอบเขตงานให้พอดีกับโปรเจกต์ในวิชา ตาราง/คอลัมน์ยังอยู่ใน DB แต่ไม่มีโค้ดใช้ (ไม่แก้ schema เดิม)

---

## 11. ข้อจำกัดและสิ่งที่ยังไม่ได้ทำ (ตอบตรงๆ ถ้าโดนถาม)

| เรื่อง | สถานะ |
|---|---|
| จำนวนคน live บนฟีด (issue #8) | ยังไม่ได้ทำ ตอนนี้ live เฉพาะแชท |
| ฟอร์มล็อกอิน/สมัคร | ยังไม่ใช้ react-hook-form + zod (ฟอร์มที่ตรงเกณฑ์คือฟอร์มตั้งตี้) |
| ปุ่ม + ลอยบนมือถือ | บางจังหวะทับปุ่ม "ยกเลิกคำขอ" ในหน้าตี้ เลื่อนหน้าแล้วกดได้ (ถ้าเดโมบนมือถือให้เลื่อนเลี่ยง) |
| ที่นั่งสุดท้ายถ้ากดพร้อมกันจริงๆ | trigger ไม่ได้ lock แถวตี้ ในทางทฤษฎีอาจเกิน 1 คน (โอกาสต่ำมากในการใช้งานจริง) |
| Realtime DELETE | ส่ง event ลบไปทุกคนที่เปิดแชทอยู่ (ข้อจำกัดของ Supabase ที่กรอง DELETE ไม่ได้) แต่ client ตัดเฉพาะ id ที่มี ไม่มีข้อมูลรั่ว |
| `supabase/schema.sql` | เป็นสำเนาเก่า ใช้ `supabase/migrations/` เป็นแหล่งจริง |
| คอลัมน์/ตารางที่ไม่ใช้ | `skips`, `profiles.banned_at`, `is_banned()` ยังอยู่ใน DB |

---

## 12. การทดสอบ

- lint + build ทุกครั้งก่อน commit
- ชุดทดสอบอัตโนมัติ (สคริปต์ Node + ฐานข้อมูลจริง + production build) 304 ข้อ ครอบคลุม:
  - เข้าร่วม/ออก/อนุมัติ และเวลาชนทั้ง 4 แบบ (ทับบางส่วน, ซ้อนข้างใน, ต่อกันก่อน, ต่อกันหลัง)
  - แชท + Realtime และการหมดอายุ
  - สิทธิ์ admin, การต่ออายุ token, token ปลอม
- ทดสอบใน Firefox จริง (puppeteer) เช่น สองบัญชีคุยกันแบบ live, host ลบข้อความแล้วอีกฝั่งเห็นหาย, เปลี่ยนธีม, แก้ไขโปรไฟล์
- ตรวจภาพหน้าจอทั้งธีมสว่าง ธีมมืด และมือถือ
- ข้อมูลทดสอบตั้งชื่อ `[TEST]` และลบทิ้งหลังรันทุกครั้ง
- **E2E ก่อน deploy** (10 ต.ค.): ไล่ทุกหน้า × 4 บทบาท × จอคอม/มือถือ/ธีมมืด 189/189 และลองยิง API ตรงเพื่อทำเกินสิทธิ์ 14 แบบ ถูก DB กันทั้งหมด
- **เจอและแก้บั๊กจากการเทส:** แชทไม่รับข้อความใหม่แบบ live เพราะเชื่อม Realtime ก่อนโหลด session เสร็จ (ดูหัวข้อ 6.7) หลังแก้ข้อความขึ้นภายใน 0.2–0.9 วินาที เป็นตัวอย่างที่ดีถ้าโดนถามว่า "เทสแล้วเจออะไรบ้าง"
- **บนเว็บจริง (Vercel):** smoke test 20/20 และทุกหน้า 63/63 ไม่มี error จาก server

---

## 13. ลำดับเดโมที่แนะนำ (ประมาณ 5 นาที)

1. เปิด `/` แบบ guest → ชี้ฟีด จำนวนคน และกดเข้าตี้แล้วถูกพาไปล็อกอิน (`?next=`)
2. ล็อกอินบัญชี A → ตั้งตี้แบบ "ต้องขออนุมัติ" (โชว์ error ของฟอร์มเมื่อกรอกผิด = RHF + zod)
3. บัญชี B (อีกเบราว์เซอร์) → ขอเข้าร่วม → A ไปที่ `/my-party` เห็นเฟืองมีตัวเลข → `/manage` กดยืนยัน
4. ทั้งสองคุยในแชท → ข้อความขึ้นทันที (Realtime) → A ลบข้อความ B เห็นหาย
5. B ลองเข้าตี้อื่นที่เวลาทับ → ปุ่มแจ้ง "ชนเวลากับ ..."
6. เปลี่ยนธีม (Context) และย่อจอให้เห็น responsive
7. ล็อกอิน admin → ปุ่มโล่ → ภาพรวม → ยกเลิก/ลบตี้
8. เปิดโค้ดสั้นๆ: `"use client"` vs Server page, `export const dynamic`, `joinParty` (Server Action), `theme-provider.jsx`, `PartyForm` + `schema.js`

---

## 14. คำศัพท์

| คำ | ความหมาย |
|---|---|
| Server Component | component ที่รันบน server เท่านั้น อ่าน DB ได้ตรง ไม่ส่ง JS ไป browser |
| Client Component | component ที่มี `"use client"` รันใน browser ได้ ใช้ state/event ได้ |
| Server Action | ฟังก์ชันใน `"use server"` ที่ client เรียกได้เหมือนฟังก์ชันปกติ แต่รันบน server |
| SSR | สร้าง HTML ใหม่ทุก request |
| SSG / ISR | สร้าง HTML ล่วงหน้า / สร้างล่วงหน้าแล้วสร้างใหม่ทุก N วินาที |
| RLS | Row Level Security กติกาสิทธิ์ต่อแถวใน Postgres |
| JWT | token ที่บอกว่าใครล็อกอิน มีลายเซ็นกันปลอม |
| Realtime | บริการของ Supabase ที่ส่งการเปลี่ยนแปลงใน DB มาที่ browser ผ่าน WebSocket |
| revalidate | สั่งให้หน้าดึงข้อมูลใหม่ |
| Context | กลไกของ React แชร์ค่าให้ component ลูกทุกตัวโดยไม่ต้องส่ง prop |
| Intercepting route | route ที่ดักลิงก์ไปแสดงในที่อื่น (เช่น modal) |
