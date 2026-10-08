export const USE_ADMIN_MOCK_DATA = true;

export const mockAdminDashboard = {
  users: 12,
  openParties: 4,
  cancelledParties: 2,
  finishedParties: 8,
  joins: 19,
  messages: 37,
  recentUsers: [
    { id: "user-001", display_name: "น้องมีนา", created_at: "2026-10-08T09:15:00.000Z" },
    { id: "user-002", display_name: "บอล เชียงใหม่", created_at: "2026-10-07T14:20:00.000Z" },
    { id: "user-003", display_name: "ฟ้าใส", created_at: "2026-10-06T08:45:00.000Z" },
  ],
};

export const mockAdminParties = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "ตีแบดหลังเลิกเรียน",
    category: "กีฬา",
    owner: "น้องมีนา",
    event_date: "2026-10-12",
    event_time: "17:30",
    location: "สนามกีฬา มช.",
    status: "open",
    members: 3,
    max_members: 6,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "หาทีมทำโปรเจกต์เว็บ",
    category: "การเรียน",
    owner: "บอล เชียงใหม่",
    event_date: "2026-10-14",
    event_time: "13:00",
    location: "ห้องสมุดกลาง",
    status: "open",
    members: 2,
    max_members: 4,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "ดูหนังวันหยุด",
    category: "บันเทิง",
    owner: "ฟ้าใส",
    event_date: "2026-10-05",
    event_time: "18:00",
    location: "เมญ่า",
    status: "finished",
    members: 5,
    max_members: 6,
  },
];

export const mockAdminUsers = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    email: "admin@example.test",
    display_name: "ผู้ดูแลระบบ",
    role: "admin",
    banned_at: null,
    created_at: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    email: "mina@example.test",
    display_name: "น้องมีนา",
    role: "user",
    banned_at: null,
    created_at: "2026-10-08T09:15:00.000Z",
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    email: "spam@example.test",
    display_name: "บัญชีที่ถูกรายงาน",
    role: "user",
    banned_at: "2026-10-07T11:30:00.000Z",
    created_at: "2026-09-20T16:10:00.000Z",
  },
];

export const mockAdminPartyDetails = {
  ...mockAdminParties[0],
  description: "ชวนเพื่อน ๆ มาตีแบดแบบสบาย ๆ หลังเลิกเรียน แบ่งทีมหน้างานได้เลย",
  messages: [
    { id: "m-001", author: "น้องมีนา", body: "เจอกันที่สนาม 17:30 นะ", created_at: "2026-10-08T10:00:00.000Z" },
    { id: "m-002", author: "บอล เชียงใหม่", body: "รับทราบครับ เดี๋ยวผมเตรียมลูกแบดไปให้", created_at: "2026-10-08T10:04:00.000Z" },
  ],
};
