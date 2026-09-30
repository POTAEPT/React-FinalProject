import { z } from "zod";

import { partyStartMs } from "@/lib/parties/time";

const categories = ["sport", "board_game", "study", "cafe", "other"];
const joinModes = ["public", "approve"];

export const createPartySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "ใส่ชื่อกิจกรรม")
      .max(80, "ชื่อกิจกรรมยาวได้ไม่เกิน 80 ตัวอักษร"),
    category: z.enum(categories, { error: "เลือกหมวดหมู่" }),
    customCategory: z
      .string()
      .trim()
      .max(30, "ชื่อหมวดยาวได้ไม่เกิน 30 ตัวอักษร"),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "เลือกวันที่"),
    eventTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "เลือกเวลา"),
    durationMinutes: z.coerce
      .number({ error: "เลือกระยะเวลา" })
      .int()
      .min(30, "ระยะเวลาอย่างน้อย 30 นาที")
      .max(480, "ระยะเวลานานได้ไม่เกิน 8 ชั่วโมง")
      .multipleOf(30, "ระยะเวลาต้องเป็นขั้นละ 30 นาที"),
    location: z
      .string()
      .trim()
      .min(1, "ใส่สถานที่")
      .max(120, "สถานที่ยาวได้ไม่เกิน 120 ตัวอักษร"),
    maxMembers: z.coerce
      .number({ error: "ใส่จำนวนคน" })
      .int()
      .min(2, "รับได้อย่างน้อย 2 คน รวมเจ้าของตี้")
      .max(30, "รับได้ไม่เกิน 30 คน"),
    detail: z.string().trim().max(1000, "รายละเอียดยาวได้ไม่เกิน 1,000 ตัวอักษร"),
    joinMode: z.enum(joinModes, { error: "เลือกวิธีเข้าร่วม" }),
  })
  .superRefine((value, context) => {
    if (value.category === "other" && value.customCategory.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["customCategory"],
        message: "ใส่ชื่อหมวดเมื่อเลือก อื่นๆ",
      });
    }

    const start = partyStartMs(value.eventDate, value.eventTime);

    if (Number.isNaN(start) || start <= Date.now()) {
      context.addIssue({
        code: "custom",
        path: ["eventTime"],
        message: "เลือกวันและเวลาที่ยังมาไม่ถึง",
      });
    }
  });

export function fieldErrorsFromZod(error) {
  const fieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export function zodResolver(schema) {
  return async (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors = {};

    for (const issue of result.error.issues) {
      const key = issue.path[0];

      if (typeof key === "string" && !errors[key]) {
        errors[key] = { type: issue.code, message: issue.message };
      }
    }

    return { values: {}, errors };
  };
}
