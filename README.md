# Final Project — MaTee | มาตี้กัน

กลุ่ม: อุอิอา สาขา 1 · สมาชิก: น.ส.ธิติรัตน์ ศิริสวัสดิ์ 682110177, นาย นนท์นิพัทธ์ ตั้งโรจนขจร 682110178, ณัฐวุฒิ แร่มี 682110171

- โค้ดแอปอยู่ในโฟลเดอร์ `matee/` (Next.js 16 App Router + Supabase)
- Deploy: https://react-final-project-woad.vercel.app
- ฐานข้อมูล: `supabase/migrations/` (ไฟล์จริงที่ใช้สร้าง DB)
- เอกสารออกแบบละเอียด: `System-Design.md`

## 1. แอปนี้ทำอะไร ใครใช้

แอปหาตี้ทำกิจกรรมสำหรับนักศึกษา มช./CAMT ตั้งตี้ชวนคนไปทำกิจกรรมด้วยกัน เช่น ตีแบด เข้ายิม เล่นบอร์ดเกม ไปคาเฟ่ หรือติวสอบ แล้วให้คนอื่นกดเข้าร่วม ปัจจุบันการหาตี้ทำกันในกลุ่มไลน์/Discord ทำให้ข้อความจมหาย ค้นย้อนหลังไม่ได้ และไม่รู้ว่าตี้ไหนเต็มแล้ว MaTee มี

1. ฟีดการ์ดตี้ที่หน้า `/` แสดงจำนวนคน (เช่น 3/4) ตี้ที่เต็ม ยกเลิก หรือเริ่มไปแล้วจะไม่อยู่ในฟีด และมีหน้า `/search` สำหรับค้นหาและกรอง
2. โหมดเข้าร่วม 2 แบบที่เจ้าของตี้เลือก: **เข้าได้ทันที** หรือ **ต้องขออนุมัติ** (เจ้าของกดยืนยันทีละคน)
3. แชทในตี้แบบ live (Supabase Realtime) สำหรับคนที่ขอเข้าร่วมหรือเป็นสมาชิกแล้ว แชทหายเองหลังตี้จบ 7 วัน
4. หน้า "ตี้ของฉัน" จัดกลุ่มตามวันแบบ agenda และการกันเวลาชน (เข้าร่วมตี้ที่เวลาทับกับตี้ที่มีอยู่ไม่ได้)
5. หน้าผู้ดูแลระบบ (admin) ดูภาพรวม จัดการตี้ ดูรายชื่อผู้ใช้ และลบข้อความในแชท

## 2. เช็คลิสต์ Final Project → อยู่ที่ไหน

| ข้อกำหนด | ทำแล้วที่ |
|---|---|
| App Router อย่างน้อย 4 route | 14 หน้า ดูหัวข้อ 3 · โฟลเดอร์ `matee/src/app/` |
| Server + Client Component พร้อมเหตุผล | หัวข้อ 4 (ตาราง) และคอมเมนต์ต้นไฟล์ |
| Data fetching แบบ SSR/SSG/ISR อย่างเจตนา | หัวข้อ 5 · `export const dynamic = "force-dynamic"` พร้อมคอมเมนต์เหตุผลใน `app/page.jsx`, `app/search/page.jsx`, `app/party/[id]/page.jsx`, `app/my-party/page.jsx`, `app/manage/[id]/page.jsx` |
| Mutation ผ่าน Server Action | หัวข้อ 7 · เช่น `app/create/actions.js` (`createParty`), `lib/parties/member-actions.js` (`joinParty`) |
| Global state ฝั่ง client (Context) | หัวข้อ 6 · `components/theme-provider.jsx` (`ThemeProvider` + `useTheme()`) |
| ฟอร์ม validate จริง (react-hook-form + zod) | `components/party/PartyForm.jsx` + `lib/parties/schema.js` (ฟอร์มตั้งตี้ `/create` และแก้ไขตี้ใน `/manage/[id]`) ตรวจทั้งฝั่ง browser และใน Server Action ด้วย schema เดียวกัน |
| Responsive + deploy Vercel | sidebar บนจอใหญ่ → icon rail → แถบล่างบนมือถือ (`components/app-shell.jsx`, `site-header.jsx`) · URL ด้านบน |

## 3. หน้า (route)

สิทธิ์: **Guest** ดูได้อย่างเดียว · **User** ต้องล็อกอิน · **Host** เจ้าของตี้นั้น · **Admin** บัญชีที่ `profiles.role = 'admin'`

| Route | สิทธิ์ | หน้านี้ทำอะไร |
|---|---|---|
| `/` | ทุกคน | ฟีดตี้ที่เปิดรับ ยังไม่เต็ม และยังไม่เริ่ม ปุ่มบนการ์ดเปลี่ยนตามสถานะคนดู (เข้าร่วม / ขอเข้าร่วม / รออนุมัติ / ชนเวลา / จัดการ) |
| `/search` | ทุกคน | ค้นหาด้วยคำ หมวด ช่วงวันที่ ชื่อเจ้าของ และ "เปิดรับ" ค่าตัวกรองอยู่ใน URL |
| `/party/[id]` | ทุกคน | รายละเอียดตี้ ปุ่มเข้าร่วม/ออก รายชื่อสมาชิก และแชท (เฉพาะสมาชิก) เจ้าของตี้ลบข้อความในแชทได้ |
| `/login`, `/register` | Guest | เข้าสู่ระบบ / สมัครสมาชิกด้วย Supabase Auth แล้วกลับหน้าเดิมผ่าน `?next=` |
| `/create` | User | ฟอร์มตั้งตี้ (เปิดเป็น modal เมื่อกดจากในแอป) ตรวจเวลาชนก่อนบันทึก |
| `/my-party` | User | agenda ตี้ของฉัน: เป็นเจ้าของ / ยืนยันแล้ว / รออนุมัติ และส่วน "ที่ผ่านมา" |
| `/manage/[id]` | Host | ยืนยัน/ปฏิเสธคำขอ รายชื่อสมาชิก แก้ไขตี้ และยกเลิกตี้ อัปเดตเองทุก 15 วินาที คนอื่นได้ 404 |
| `/account`, `/account/edit` | User | โปรไฟล์ ตี้ที่ตั้ง/เข้าร่วม แก้ชื่อและรูปโปรไฟล์ (modal) |
| `/admin` | Admin | ภาพรวม: จำนวนตี้ (เปิดอยู่/จบแล้ว/ยกเลิก) ผู้ใช้ การเข้าร่วม คำขอ ข้อความ และคนสมัครล่าสุด |
| `/admin/parties` | Admin | ทุกตี้ ค้นหาและกรองสถานะ/หมวด ยกเลิกหรือลบตี้ |
| `/admin/parties/[id]` | Admin | รายละเอียดตี้ + แชททั้งหมด ลบข้อความได้ |
| `/admin/users` | Admin | รายชื่อผู้ใช้ (ชื่อ บทบาท วันที่สมัคร) |

- `/create`, `/my-party`, `/manage/[id]`, `/account` ถ้ายังไม่ล็อกอินจะถูกส่งไป `/login?next=` โดย `matee/src/proxy.js`
- `/admin/*` ทุกหน้าเรียก `requireAdmin()` ถ้าไม่ใช่ admin ได้ 404

## 4. Server หรือ Client และทำไม

หลักที่ใช้: **อ่านข้อมูลใน Server Component, เขียนข้อมูลใน Server Action, ใช้ Client Component เฉพาะส่วนที่ต้องมี state, event หรือ API ของ browser**

| ส่วนของแอป | ชนิด | เหตุผล |
|---|---|---|
| ทุก `page.jsx` และ `layout.jsx` | Server | ดึงข้อมูลจาก Supabase ด้วย session ของผู้ใช้ฝั่ง server (RLS ตรวจสิทธิ์ให้) แล้วส่ง HTML ที่มีข้อมูลแล้วไป browser ไม่ต้องส่ง key หรือ query ไปฝั่ง client |
| การ์ดตี้และฟีด (`party-card.jsx`, `party-feed.jsx`) | Server | แสดงผลอย่างเดียว ไม่มี state |
| ส่วนแชทในหน้าตี้ (`chat/PartyChatSection.jsx`) | Server | ตัดสินฝั่ง server ว่าใครเห็นแชท และโหลดข้อความล่าสุดเฉพาะสมาชิก |
| แชท (`chat/PartyChat.jsx`) | Client | subscribe Supabase Realtime ต้องใช้ WebSocket ใน browser, `useState` เก็บข้อความ และช่องพิมพ์ |
| ปุ่มเข้าร่วม/ออก (`party/JoinButton.jsx`), ปุ่มยืนยัน/ปฏิเสธ/ยกเลิก (`party/ManageControls.jsx`), ปุ่ม admin (`admin/admin-controls.jsx`) | Client | กดแล้วเรียก Server Action แสดงสถานะ "กำลัง..." และ error ทันทีด้วย `useTransition` และมี dialog ยืนยัน |
| ฟอร์มตั้ง/แก้ตี้ (`party/PartyForm.jsx`) | Client | react-hook-form + zod ต้องใช้ state และ event ของฟอร์ม แสดง error ทีละช่อง |
| ฟอร์มล็อกอิน/สมัคร (`auth/LoginForm.jsx`, `RegisterForm.jsx`) | Client | เรียก Supabase Auth ฝั่ง browser (ตั้ง session cookie) และใช้ state ของฟอร์ม |
| ฟอร์มแก้โปรไฟล์ (`account/EditProfileForm.jsx`) | Client | แสดงรูปตัวอย่างก่อนบันทึก (blob URL) แล้วเรียก Server Action ตอนกดบันทึก |
| กรอบแอปและเมนู (`app-shell.jsx`, `site-header.jsx`) | Client | ต้องรู้ path ปัจจุบัน (`usePathname`) เพื่อไฮไลต์เมนู และเปิด/ปิดเมนู ข้อมูลบัญชีส่งมาจาก layout (Server) |
| ตัวกรองและช่องค้นหา (`party-filters.jsx`, `party-search.jsx`) | Client | เขียนค่าลง URL ทันทีที่กด (`useRouter`, `useSearchParams`) |
| ธีม (`theme-provider.jsx`) | Client | Context เก็บ state ธีมให้ทั้งแอป (หัวข้อ 6) |
| `/manage/[id]` refresh เอง (`auto-refresh.jsx`) | Client | ตั้งเวลาเรียก `router.refresh()` ทุก 15 วินาทีเฉพาะตอนแท็บเปิดอยู่ |
| Server Action (`*actions.js`) | Server Action | โค้ดที่เขียน DB และตรวจ session/สิทธิ์ต้องอยู่ฝั่ง server เท่านั้น แล้วเรียก `revalidatePath` |
| `proxy.js` | Proxy (ทุก request) | ตรวจ JWT ด้วย `getClaims()` ต่ออายุ token ที่หมดอายุ และส่ง guest ไปหน้า login |

## 5. การดึงข้อมูล: ทำไมเลือก SSR

ทุกหน้าที่ดึงข้อมูลเป็น **SSR (render ใหม่ทุก request)** แบบตั้งใจ ประกาศ `export const dynamic = "force-dynamic"` พร้อมคอมเมนต์เหตุผลที่ต้นไฟล์ของ `/`, `/search`, `/party/[id]`, `/my-party`, `/manage/[id]`

เหตุผลที่ไม่ใช้ SSG หรือ ISR:
1. **หน้าขึ้นกับคนที่ดู:** ปุ่มบนการ์ด (เข้าร่วม / รออนุมัติ / ชนเวลา / จัดการ) แชทที่เห็นเฉพาะสมาชิก และหน้า "ตี้ของฉัน" ต่างกันในแต่ละคน SSG/ISR สร้างหน้าเดียวแล้วเสิร์ฟให้ทุกคนจาก cache จึงแสดงผิดคน
2. **ข้อมูลต้องเป็นปัจจุบัน:** จำนวนที่นั่ง ตี้ที่เต็มแล้ว หรือเริ่มไปแล้ว ถ้าใช้ ISR (เช่น cache 60 วินาที) คนจะเห็นตี้ที่เต็มแล้วและกดเข้าร่วมไม่ได้
3. **สิทธิ์ตรวจด้วย RLS ตาม session:** query ใช้ cookie ของผู้ใช้ จึงต้องรันตอนมี request
4. layout หลักอ่าน cookie (ธีมและบัญชี) อยู่แล้ว ทุกหน้าจึงเป็น dynamic อยู่แล้ว การประกาศ `force-dynamic` ทำให้เจตนาชัดและกันไม่ให้ใครเผลอทำหน้าเป็น static ภายหลัง

หลังเขียนข้อมูล Server Action เรียก `revalidatePath(...)` ให้หน้าที่เกี่ยวข้องดึงข้อมูลใหม่ ส่วนที่ต้อง live จริง (แชท) ใช้ Supabase Realtime เพิ่มจาก SSR

## 6. Global state ฝั่ง client: ThemeContext

`matee/src/components/theme-provider.jsx`
- `ThemeProvider` (React Context) ห่อทั้งแอปใน `app/layout.jsx` เก็บธีมที่เลือก: ตามระบบ / สว่าง / มืด
- ค่าเริ่มต้นมาจาก cookie ที่ layout อ่านฝั่ง server หน้าแรกจึงแสดงธีมถูกตั้งแต่ต้น ไม่กะพริบ
- component ไหนก็เรียก `useTheme()` ได้ คืน `{ theme, setTheme }` โดย `setTheme` เปลี่ยน `data-theme` บน `<html>` และบันทึก cookie
- ใช้ในเมนู "≡" ทั้ง sidebar และแถบบนมือถือ ไม่ต้องส่ง prop ผ่าน `AppShell` → `SiteHeader` → เมนูหลายชั้น

## 7. ข้อมูลมาจากไหน และจุดที่เขียนข้อมูล

**แหล่งข้อมูล:** Supabase Postgres (`supabase/migrations/`)
- `profiles`: ชื่อ รูป และ role (`user`/`admin`) สร้างอัตโนมัติด้วย trigger `handle_new_user` ตอนสมัคร
- `parties`: ชื่อ หมวด วัน เวลา ระยะเวลา สถานที่ จำนวนที่รับ `confirmed_count` โหมดเข้าร่วม และสถานะ (`open`/`cancelled`)
- `party_members`: สถานะ `pending` / `confirmed` / `rejected` / `cancelled` หนึ่งแถวต่อคนต่อตี้
- `party_messages`: ข้อความแชท (1–500 ตัวอักษร)
- view `party_counts`: จำนวนคำขอรออนุมัติ
- Storage bucket `avatars`: รูปโปรไฟล์ (jpeg/png/webp ไม่เกิน 2 MB)
- Realtime เปิดบน `party_messages` (แชท) · `pg_cron` ลบแชทของตี้ที่จบหรือยกเลิกเกิน 7 วัน ทุกวันเวลา 03:00

**กติกาที่ DB บังคับเอง:** สิทธิ์อ่าน/เขียนด้วย RLS, กันตี้เต็ม, กันเวลาชน (`has_time_conflict`), เจ้าของตี้ออกจากตี้ตัวเองไม่ได้, ส่งแชทได้เฉพาะสมาชิกและก่อนหมดอายุ

**Mutation (Server Action ทั้งหมด ตรวจ session และสิทธิ์ก่อน คืนผล `{ ok, code, message }`)**

| Action | ไฟล์ | ทำอะไร |
|---|---|---|
| `createParty` | `app/create/actions.js` | ตั้งตี้ (ตรวจด้วย zod + เวลาชน) |
| `updateParty` | `lib/parties/party-actions.js` | เจ้าของแก้ตี้ก่อนตี้เริ่ม |
| `joinParty`, `leaveParty` | `lib/parties/member-actions.js` | เข้าร่วม (หรือส่งคำขอ) / ออกจากตี้ |
| `decideRequest`, `cancelParty` | `lib/parties/member-actions.js` | เจ้าของยืนยัน/ปฏิเสธคำขอ / ยกเลิกตี้ |
| `sendPartyMessage`, `deletePartyMessage` | `lib/chat/actions.js` | ส่งข้อความ / เจ้าของตี้ลบข้อความ |
| `updateDisplayName`, `uploadAvatar` | `lib/auth/profile-actions.js`, `lib/avatar/actions.js` | แก้ชื่อ / อัปโหลดรูปโปรไฟล์ |
| `cancelPartyAsAdmin`, `deletePartyAsAdmin`, `deleteMessageAsAdmin` | `lib/admin/actions.js` | admin ยกเลิก/ลบตี้ และลบข้อความ |

## 8. แบ่งงานกันยังไง

| คน | รับผิดชอบ |
|---|---|
| คนที่ 1 | scaffold Next.js, Supabase client ฝั่ง server/browser, `proxy.js`, ระบบ auth (register / login / JWT session / `getSession()`), อัปโหลดรูปโปรไฟล์ไป Storage, หน้า `/account` |
| คนที่ 2 | ฟีดการ์ดที่ `/` และ `/search`, `/party/[id]`, ฟอร์ม `/create` (รวม join mode, ระยะเวลา, เช็คเวลาชน), แชทในตี้แบบ live, หน้า `/my-party` |
| คนที่ 3 | `/manage/[id]` (approve / reject / ยกเลิกตี้), หน้า admin ทั้งหมด (ภาพรวม, จัดการตี้, รายชื่อผู้ใช้, ดูแลแชท), deploy ขึ้น Vercel |

**ต้องมี (ตามโจทย์)**
- Register → `/register` ใช้ Supabase Auth และ trigger `handle_new_user` สร้างแถวใน `profiles`
- มีรูปผู้ใช้ → `/account/edit` อัปโหลดไป bucket `avatars` แล้วเก็บ URL ใน `profiles.avatar_url`
- มี login → `/login` session เป็น JWT ของ Supabase ใน httpOnly cookie ผ่าน `@supabase/ssr` ต่ออายุใน `proxy.js`
- หน้า approve → `/manage/[id]` เจ้าของกดยืนยัน/ปฏิเสธคำขอ `pending` ของตี้แบบ "ต้องขออนุมัติ"
- Manage party → `/my-party` (เฟืองพร้อมตัวเลขคำขอ) เปิดไป `/manage/[id]` ดูสถานะ จำนวนคน และยกเลิกตี้ ส่วน "จบแล้ว" คิดจากเวลาจบอัตโนมัติ
- เก็บสถานะจำนวนคน การยืนยัน หรือยกเลิก → `party_members.status`, `parties.status`, `parties.confirmed_count` + view `party_counts` และ trigger กันตี้เต็มใน DB

**ต้องส่ง:** Supabase schema → `supabase/migrations/`

## 9. รันในเครื่อง

```bash
cd matee
npm install
# ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env
npm run dev
```
