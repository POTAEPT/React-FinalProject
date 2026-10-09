export const PARTY_CATEGORIES = [
  {
    value: "sport",
    label: "กีฬา",
    description: "แบดมินตัน ยิม วิ่ง และกิจกรรมกลางแจ้ง",
  },
  {
    value: "board_game",
    label: "บอร์ดเกม",
    description: "บอร์ดเกม ไพ่ และเกมตั้งโต๊ะ",
  },
  {
    value: "study",
    label: "ติวสอบ",
    description: "อ่านหนังสือ ทำการบ้าน และทำโปรเจกต์",
  },
  {
    value: "cafe",
    label: "คาเฟ่",
    description: "นั่งคาเฟ่ ชวนคุย หรือทำงานเบาๆ",
  },
  {
    value: "other",
    label: "อื่นๆ",
    description: "กิจกรรมที่ยังไม่มีหมวดของตัวเอง",
  },
];

export const JOIN_MODES = [
  {
    value: "public",
    label: "เข้าได้ทันที",
    hint: "กดเข้าร่วมแล้วเป็นสมาชิกทันที",
  },
  {
    value: "approve",
    label: "ต้องขออนุมัติ",
    hint: "ส่งคำขอ แล้วให้เจ้าของตี้ตอบรับ",
  },
];

export function isPartyCategory(value) {
  return PARTY_CATEGORIES.some((category) => category.value === value);
}

export function categoryLabel(category, customCategory) {
  if (category === "other") {
    return customCategory || "อื่นๆ";
  }

  return (
    PARTY_CATEGORIES.find((item) => item.value === category)?.label ?? category
  );
}

export function categoryDescription(category) {
  return PARTY_CATEGORIES.find((item) => item.value === category)?.description;
}

export function joinModeLabel(joinMode) {
  return JOIN_MODES.find((mode) => mode.value === joinMode)?.label ?? joinMode;
}
