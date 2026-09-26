# Final Project Proposal — MaTee | มาตี้กัน

กลุ่ม: [ชื่อกลุ่ม] · สมาชิก: [น.ส.ธิติรัตน์ ศิริสวัสดิ์ 682110177] , [ชื่อ-รหัส]

## 1. แอปนี้ทำอะไร ใครใช้

แอปหาตี้ทำกิจกรรมสำหรับนักศึกษา มช./CAMT — ตั้งตี้ชวนคนไปทำกิจกรรมด้วยกัน เช่น ตีแบด เข้ายิม เล่นบอร์ดเกม ไปคาเฟ่ หรือติวสอบ และกดเข้าร่วมได้ ปัจจุบันการหาตี้ทำกันในกลุ่มไลน์/Discord ทำให้ข้อความจมหาย ค้นย้อนหลังไม่ได้ และไม่รู้ว่าตี้ไหนเต็มหรือยัง — MaTee เพิ่ม 2 ฟีเจอร์หลักคือ 1) หน้าเลือกหมวดหมู่ (Category) เพื่อกรองกิจกรรมที่สนใจก่อน และ 2) โหมดปัดการ์ดแบบ Tinder (Swipe) ให้เลือกเข้าร่วม/ปัดทิ้งได้เร็ว ไม่ต้องไล่ดูเป็นลิสต์ยาว

## 2. หน้าที่จะมี (อย่างน้อย 4 route)

| Route | หน้านี้ทำอะไร |
| ----- | ------------- |
| / | หน้าแรก — ตี้มาใหม่ 6 อัน + ตี้ใกล้เต็ม + ปุ่ม "หาตี้เลย" |
| /categories | เลือกหมวดหมู่ที่สนใจ (กีฬา, บอร์ดเกม, ติวสอบ, คาเฟ่, อื่นๆ) — กดแล้วพาไปหน้า swipe แบบกรองตามหมวดนั้น |
| /discover | กองการ์ดแบบ Tinder — ปัดขวา = เข้าร่วมตี้, ปัดซ้าย = ข้าม, ปัดขึ้น = ดูรายละเอียด — กรองตาม `?category=` ที่ส่งมาจากหน้า categories |
| /party/[id] | รายละเอียดตี้ + จำนวนคน (เช่น 3/4) + ปุ่มเข้าร่วม/ออก + คอมเมนต์ถามรายละเอียด |
| /create | ฟอร์มตั้งตี้ใหม่ (ชื่อกิจกรรม หมวด วันที่ เวลา สถานที่ จำนวนที่รับ รายละเอียด) |
| /my-party | ตี้ที่ฉันสร้าง + ตี้ที่ฉันเข้าร่วม + ประวัติที่ปัดข้ามไปแล้ว (เก็บใน localStorage ช่วงแรก) |

## 3. Server หรือ Client — และทำไม

| ส่วนของแอป | Server / Client | เหตุผล |
| ---------- | --------------- | ------ |
| / หน้าแรก | Server | ดึงตี้มาใหม่/ใกล้เต็มจาก DB ตรงๆ ได้ SEO ไม่ต้องส่ง JS |
| /categories กริดหมวดหมู่ | Server | หมวดหมู่เป็นข้อมูล static ดึงครั้งเดียว + อยากให้โหลดไว |
| /discover กองการ์ด + ปัดซ้าย/ขวา | Client | ต้องใช้ gesture/drag (framer-motion), `useState` เก็บ deck, `useSearchParams` อ่าน category, ต้อง animate แบบ 60fps ทำฝั่ง server ไม่ได้ |
| /party/[id] รายละเอียด | Server | ดึงจาก DB + ISR revalidate 30 วินาที เพื่ออัปเดตจำนวนคน |
| ช่องค้นหา + filter ใน /discover | Client | ต้อง onChange ทันทีและเขียน `?category=` ลง URL |
| ปุ่ม เข้าร่วม/ออก (ทั้งใน swipe และ detail) | Client | optimistic update กดแล้วการ์ดหาย/เปลี่ยน UI ทันที |
| ฟอร์ม /create | Client | react-hook-form + zod ต้องใช้ state และ event |
| `createTee` / `toggleJoin` / `skipTee` | Server Action | โค้ดที่เขียน DB ต้องไม่หลุดไป browser + `revalidatePath` |
| layout + nav | Server | ไม่มี interactive |

## 4. ข้อมูลมาจากไหน + จุดที่ต้องเขียนข้อมูลกลับ

- แหล่งข้อมูล: Supabase ตาราง `party` (id, title, category, date, time, location, maxMembers, currentMembers, detail, ownerId) และ `joins` (teeId, userId) + `skips` (teeId, userId สำหรับปัดซ้าย) — ถ้าตั้งไม่ทันจะ fallback เป็น `data/party.json` ในโปรเจกต์ก่อนแล้วค่อยย้าย · หน้ารายการ/หน้าแรกใช้ ISR revalidate 30 วินาที
- mutation: `createTee` เป็น Server Action จากฟอร์ม /create แล้ว revalidate `/` และ `/discover` · `toggleJoin(teeId)` เรียกเมื่อปัดขวา (หรือกดเข้าร่วมใน /party/[id]) และ `skipTee(teeId)` เรียกเมื่อปัดซ้าย — ทั้งคู่บันทึกฝั่ง server แล้ว revalidate `/discover` และ `/my-party`

## 5. แบ่งงานกันยังไง
