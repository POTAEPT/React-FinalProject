# Final Project Proposal — MaTee | มาตี้กัน

กลุ่ม: อุอิอา สาขา 1 · สมาชิก: น.ส.ธิติรัตน์ ศิริสวัสดิ์ 682110177, นาย นนท์นิพัทธ์ ตั้งโรจนขจร 682110178, ณัฐวุฒิ แร่มี 682110171

## 1. แอปนี้ทำอะไร ใครใช้

แอปหาตี้ทำกิจกรรมสำหรับนักศึกษา มช./CAMT — ตั้งตี้ชวนคนไปทำกิจกรรมด้วยกัน เช่น ตีแบด เข้ายิม เล่นบอร์ดเกม ไปคาเฟ่ หรือติวสอบ และกดเข้าร่วมได้ ปัจจุบันการหาตี้ทำกันในกลุ่มไลน์/Discord ทำให้ข้อความจมหาย ค้นย้อนหลังไม่ได้ และไม่รู้ว่าตี้ไหนเต็มหรือยัง — MaTee เพิ่ม 1) ฟีดการ์ดตี้ที่หน้า `/` ที่โชว์จำนวนคน (เช่น 3/4) แบบ live ผ่าน Supabase Realtime การ์ดหายเมื่อเต็มและกลับมาเมื่อมีคนออก 2) โหมดเข้าร่วม 2 แบบที่โฮสต์เลือกตอนตั้งตี้ — Public (กดแล้วเข้าร่วมทันที) หรือ Approve (ส่งคำขอแล้วให้โฮสต์ยืนยันทีละคน) 3) แชทในตี้สำหรับคนที่ขอเข้าร่วม/ยืนยันแล้ว เพื่อคุยรายละเอียดกันในที่เดียว และ 4) หน้า "ตี้ของฉัน" ที่จัดกลุ่มตามวันเหมือน agenda เห็นทั้งตี้ที่โฮสต์ ตี้ที่ยืนยันแล้ว และตี้ที่รอการยืนยัน

## 2. หน้าที่จะมี (อย่างน้อย 4 route)

รวม 15 route แบ่งตามสิทธิ์ผู้ใช้ — Guest เข้าดูได้อย่างเดียว, User ต้อง login, Host คือเจ้าของตี้นั้น, Admin คือบัญชีที่ `profiles.role = 'admin'`

| Route | สิทธิ์ | หน้านี้ทำอะไร |
| ----- | ------ | ------------- |
| / | Guest / User | ฟีดการ์ดตี้ที่เปิดอยู่และยังไม่เริ่ม เรียงใหม่สุดก่อน มีช่องค้นหา + chip หมวดหมู่ + filter Public/Approve ใน URL (`?q=&category=&mode=`) จำนวนคนบนการ์ดอัปเดต live ปุ่มบนการ์ดเปลี่ยนตามสถานะผู้ดู (login / เข้าร่วม / ขอเข้าร่วม / รอการยืนยัน / เข้าร่วมแล้ว / จัดการ) และมีลิงก์ "ข้าม" สำหรับ user |
| /discover | Guest / User | redirect ไป `/` (คง `?category=` ไว้) — เก็บไว้ให้ลิงก์เก่ายังใช้ได้ |
| /categories | Guest / User | กริดหมวดหมู่แบบ static (กีฬา, บอร์ดเกม, ติวสอบ, คาเฟ่, อื่นๆ) กดแล้วไป `/?category=` |
| /party/[id] | Guest / User / Host | รายละเอียดตี้เต็ม (วัน เวลาเริ่ม–จบ สถานที่ รายละเอียด จำนวนคน live) — Guest เห็นข้อมูลอย่างเดียว, User เห็นปุ่มเข้าร่วม/ขอเข้าร่วม/ออก สถานะคำขอ รายชื่อสมาชิก และแชทเมื่อ pending/confirmed, Host เห็นรายชื่อ + แชท + ลิงก์ไป `/manage/[id]` |
| /login | Guest | เข้าสู่ระบบด้วย Supabase Auth แล้วพากลับหน้าเดิมผ่าน `?next=` |
| /register | Guest | สมัครสมาชิก กรอก display name และอัปโหลดรูปโปรไฟล์ (ไม่บังคับ) |
| /create | User (กลายเป็น Host) | ฟอร์มตั้งตี้ — ชื่อ หมวด (เลือก "อื่นๆ" แล้วพิมพ์หมวดเองได้) วันที่ เวลา ระยะเวลา (30–480 นาที) สถานที่ จำนวนที่รับ รายละเอียด และโหมด Public/Approve ตรวจเวลาชนกับตี้ที่ตัวเองมีอยู่ก่อนบันทึก |
| /my-party | User | agenda ตี้ของฉันจัดกลุ่มตามวัน (โฮสต์ / ยืนยันแล้ว / รอการยืนยัน) ตี้ที่ถูกยกเลิกมี chip กำกับ ตี้ที่จบแล้วอยู่ในส่วน "ที่ผ่านมา" ที่พับไว้ แต่ละแถวมีปุ่มแชทไป `/party/[id]#chat` และไอคอนเฟืองไป `/manage/[id]` เฉพาะตี้ที่ตัวเองโฮสต์ |
| /account | User | โปรไฟล์ เปลี่ยนรูป และแสดง claims ที่ decode จาก JWT (`sub`, `email`, `exp`) |
| /banned | User | หน้าที่ middleware ส่งผู้ใช้ที่ถูกแบน (`profiles.banned_at` ถูกตั้งค่า) มา |
| /manage/[id] | Host | จัดการตี้ของตัวเอง — สรุปตี้ โหมดเข้าร่วม จำนวน confirmed/max คิวคำขอพร้อมปุ่ม Approve/Reject (โหมด Approve) รายชื่อสมาชิก และปุ่มยกเลิกตี้ (มี confirm dialog, ย้อนกลับไม่ได้) ถ้าไม่ใช่เจ้าของได้ 404 |
| /admin | Admin | dashboard — จำนวน users, parties (open / cancelled / finished), joins, messages และรายชื่อสมัครล่าสุด |
| /admin/parties | Admin | ทุกตี้รวม cancelled และ finished มีค้นหาและ filter สถานะ/หมวด ยกเลิกหรือลบตี้ใดก็ได้ |
| /admin/users | Admin | ทุกบัญชี (display name, role, วันที่สมัคร, สถานะแบน) แบน/ปลดแบนได้ |
| /admin/parties/[id] | Admin | รายละเอียดตี้ + แชททั้งหมด ลบข้อความใดก็ได้ |

`/create`, `/my-party`, `/manage/[id]`, `/account` ถ้ายังไม่ login จะถูก redirect ไป `/login?next=` · หน้า `/admin/*` ทุกหน้าเรียก `requireAdmin()` ก่อน ถ้าไม่ใช่ admin ได้ 404

## 3. Server หรือ Client — และทำไม

| ส่วนของแอป | Server / Client | เหตุผล |
| ---------- | --------------- | ------ |
| / ฟีดการ์ด (หน้าแรก 20 ใบ) | Server | query `parties` ที่ open, ยังไม่เต็ม, ยังไม่เริ่ม จาก DB ตรงๆ ตัดตี้ที่ user ข้ามไว้ฝั่ง server ส่ง HTML พร้อมข้อมูลไปเลย |
| / จำนวนคน live + ค้นหา/filter + ปุ่ม "โหลดเพิ่ม" | Client | subscribe Realtime บน `parties` เพื่ออัปเดต `confirmed_count` ถอดการ์ดที่เต็ม/ถูกยกเลิก และใส่กลับเมื่อมีที่ว่าง ต้อง `useState` เก็บลิสต์ และเขียน `?q=&category=&mode=` ลง URL ทันที |
| /categories กริดหมวดหมู่ | Server | หมวดหมู่เป็น enum คงที่ ไม่มี interactive |
| /party/[id] รายละเอียด + รายชื่อสมาชิก | Server | ดึงตี้ สมาชิก และข้อความล่าสุดด้วย session ของผู้ใช้ RLS จัดการสิทธิ์ให้ |
| /party/[id] แชท + ปุ่มเข้าร่วม/ออก + จำนวนคน live | Client | subscribe Realtime บน `party_messages` และ `parties` ปุ่มต้องเปลี่ยนสถานะทันทีโดยไม่เปลี่ยนหน้า และปิดแชททันทีเมื่อกดออก |
| /my-party agenda | Server | อ่านครั้งเดียวด้วย session ไม่ต้อง Realtime ใช้ `revalidatePath('/my-party')` จาก action แทน |
| /manage/[id] สรุปตี้ + คิวคำขอ | Server | ตรวจ owner ก่อน (404 ถ้าไม่ใช่) แล้วดึง pending queue จาก DB |
| /manage/[id] ปุ่ม Approve / Reject / ยกเลิกตี้ | Client | ต้องกดแล้วแถวหายจากคิวทันที และมี confirm dialog ก่อนยกเลิก |
| ฟอร์ม /create | Client | react-hook-form + zod ต้องใช้ state, event และตรวจเวลาชนแบบ inline |
| Server Action (`createParty`, `joinParty`, `leaveParty`, `skipParty`, `sendPartyMessage`, approve/reject, `cancelParty`, admin actions) | Server Action | โค้ดที่เขียน DB และเช็ค session/role ต้องไม่หลุดไป browser + `revalidatePath` |
| /admin, /admin/parties, /admin/users, /admin/parties/[id] | Server | เรียก `requireAdmin()` แล้ว query ตรง ปุ่ม cancel/delete/ban เป็น Client Component เล็กๆ ที่เรียก admin Server Action |
| layout + nav | Server | อ่าน session ฝั่ง server เพื่อโชว์ลิงก์ "ตี้ของฉัน" และลิงก์ Admin ตาม role ไม่มี interactive |
| `proxy.js` | Proxy (ทุก request) | refresh JWT ที่หมดอายุ redirect guest ออกจากหน้าที่ต้อง login และส่งผู้ใช้ที่ถูกแบนไป `/banned` |

## 4. ข้อมูลมาจากไหน + จุดที่ต้องเขียนข้อมูลกลับ

- แหล่งข้อมูล: Supabase Postgres ตาม `supabase/schema.sql`
  - `profiles` (id, display_name, avatar_url, role `user`/`admin`, banned_at) — สร้างอัตโนมัติจาก trigger `handle_new_user` ตอนสมัคร
  - `parties` (title, category, custom_category เมื่อเลือก "อื่นๆ", event_date, event_time, duration_minutes 30–480, location, max_members, confirmed_count, detail, owner_id, join_mode `public`/`approve`, status `open`/`cancelled`)
  - `party_members` (party_id, user_id, status `pending`/`confirmed`/`rejected`/`cancelled`) — unique ต่อ user ต่อตี้ แถวของโฮสต์เป็น `confirmed` เสมอ
  - `skips` (party_id, user_id) — ใช้กรองฟีดเท่านั้น
  - `party_messages` (party_id, user_id, body 1–500 ตัวอักษร, created_at)
  - view `party_counts` ให้ `pending_count` สำหรับ `/manage/[id]` และ badge บนเฟืองใน `/my-party` ส่วนจำนวนคนบนการ์ดใช้ `parties.confirmed_count` ที่ trigger คำนวณให้
  - Supabase Storage bucket `avatars` (public, จำกัดโฟลเดอร์ `avatars/{userId}/`, jpeg/png/webp ไม่เกิน 2 MB) เก็บรูปโปรไฟล์แล้วบันทึก URL ลง `profiles.avatar_url`
  - Realtime เปิดบน `parties` (จำนวนคน live + ยกเลิก) และ `party_messages` (แชท) ส่วน `party_members` ไม่เปิด
  - `pg_cron` รัน `purge_expired_chats()` ทุกวัน 03:00 (Asia/Bangkok) ลบข้อความของตี้ที่จบไปแล้วเกิน 7 วัน (หรือถูกยกเลิกเกิน 7 วัน) และ insert policy ของ `party_messages` เช็คเวลาหมดอายุเดียวกัน
- กติกาที่บังคับใน DB: เวลาเริ่ม = `event_date + event_time`, เวลาจบ = เริ่ม + `duration_minutes` (ไม่เก็บลง DB) — ตี้ที่เริ่มแล้วออกจากฟีดและรับคำขอเพิ่มไม่ได้ ตี้ที่จบแล้วถูกป้ายว่า "จบแล้ว" เอง · การ์ดล็อกเวลาชน (`has_time_conflict`) ห้าม join/ขอเข้าร่วม/สร้างตี้ที่ช่วง `[start, end)` ทับกับตี้ที่ตัวเองยัง pending/confirmed อยู่ ผ่าน trigger บน `party_members` และ `parties` (ช่วงที่ต่อกันพอดีไม่นับว่าชน) · trigger เดิมยังกันตี้เต็มและกันโฮสต์ออกจากตี้ตัวเอง
- mutation (ทั้งหมดเป็น Server Action ที่ตรวจ session จาก JWT ก่อน):
  - `createParty` จากฟอร์ม /create — เช็คเวลาชนก่อน ถ้าชนคืน `{ code: 'time_conflict', conflictingPartyId, conflictingTitle }` แล้ว revalidate `/` และ `/my-party`
  - `joinParty(partyId)` — insert/อัปเดต `party_members` เป็น `confirmed` (Public) หรือ `pending` (Approve) เช็คเวลาชนแบบเดียวกัน · `leaveParty(partyId)` ตั้งแถวเป็น `cancelled` และปิดแชทให้คนนั้น · `skipParty(partyId)` เขียนลง `skips` — revalidate `/` และ `/my-party`
  - `sendPartyMessage(partyId, body)` — insert `party_messages` เมื่อยังเป็น pending/confirmed และแชทยังไม่หมดอายุ Realtime ส่งต่อให้คนที่เหลือ · ลบข้อความตัวเองได้ โฮสต์ลบได้ทุกข้อความในตี้ตัวเอง
  - approve / reject บน `/manage/[id]` — อัปเดต status ของ `party_members` · `cancelParty(partyId)` ตั้ง `parties.status = 'cancelled'` — revalidate `/`, `/party/[id]`, `/manage/[id]`, `/my-party`
  - admin actions — cancel/delete ตี้, ban/unban (ตั้ง `profiles.banned_at`), ลบข้อความใดก็ได้ ผ่าน policy ที่ใช้ `is_admin()`

## 5. แบ่งงานกันยังไง

| คน | รับผิดชอบ |
| -- | --------- |
| คนที่ 1 | scaffold Next.js, Supabase client ฝั่ง server/browser, `proxy.js`, ระบบ auth (register / login / JWT session / `getSession()`), อัปโหลดรูปโปรไฟล์ไป Storage, หน้า `/account` |
| คนที่ 2 | ฟีดการ์ดที่ `/` พร้อมค้นหาและ filter, `/categories`, `/party/[id]`, ฟอร์ม `/create` (รวม join mode, ระยะเวลา, เช็คเวลาชน), แชทในตี้แบบ live, หน้า `/my-party` |
| คนที่ 3 | `/manage/[id]` (approve / reject / ยกเลิกตี้), จำนวนคน live บนการ์ดผ่าน Realtime, หน้า admin ทั้งหมด (dashboard, จัดการตี้, จัดการผู้ใช้, ดูแลแชท), `/banned`, deploy ขึ้น Vercel |

ต้องส่ง

- Supabase schema → อยู่ที่ `supabase/schema.sql`

ต้องมี

- Register → อยู่ที่ `/register` ใช้ Supabase Auth และ trigger `handle_new_user` สร้างแถวใน `profiles`
- มีรูปผู้ใช้ → อยู่ที่ตอนสมัครและ `/account` อัปโหลดไป bucket `avatars` แล้วเก็บ URL ใน `profiles.avatar_url`
- มีlogin → อยู่ที่ `/login` session เป็น JWT ของ Supabase ใน httpOnly cookie ผ่าน `@supabase/ssr` refresh ใน `proxy.js` และดู claims ได้ที่ `/account`
- หน้าapprove → อยู่ที่ `/manage/[id]` โฮสต์กด Approve/Reject คำขอ `pending` ของตี้โหมด Approve
- Manage party 🎉 → อยู่ที่ `/my-party` (เฟืองพร้อม badge จำนวนคำขอ) เปิดไป `/manage/[id]` ดูสถานะ จำนวนคน และยกเลิกตี้ได้ ส่วน "จบแล้ว" คิดจากเวลาจบอัตโนมัติ
- เก็บstage จำนวนคน,การยืนยันหรือยกเลิก → อยู่ที่ `party_members.status` (pending / confirmed / rejected / cancelled), `parties.status` (open / cancelled), `parties.confirmed_count` + view `party_counts` และ trigger กันตี้เต็มใน DB

## 6. ตั้งค่าที่ต้องทำนอกโค้ด

- สร้าง Supabase project แล้วรัน `supabase/schema.sql` (รวม bucket `avatars`) · ตัดสินใจว่าจะเปิด email confirmation ตอนสมัครหรือไม่ (ปิดง่ายกว่าสำหรับ demo)
- เปิด Realtime ให้ตาราง `parties` และ `party_messages`
- เปิด extension `pg_cron` ใน Supabase dashboard (Database > Extensions) เพื่อให้ job `purge-expired-chats` ทำงาน
- ตั้ง JWT Signing Keys เป็นแบบ asymmetric เพื่อให้ `getSession()` ตรวจลายเซ็น JWT ได้จาก JWKS โดยไม่ต้องเรียก Supabase ซ้ำ
- เพิ่ม Auth redirect URLs สำหรับ `localhost:3000` และโดเมนบน Vercel
- ตั้ง `profiles.role = 'admin'` ให้บัญชี admin ด้วยมือใน table editor (ไม่มี UI ให้เลื่อนสิทธิ์)
- สร้าง Vercel project ผูกกับ repo นี้ และตั้ง env `NEXT_PUBLIC_SUPABASE_URL` กับ `NEXT_PUBLIC_SUPABASE_ANON_KEY` · ใส่ remote pattern ของ Supabase storage host ใน `next.config` สำหรับ `next/image`
