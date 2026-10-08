import Link from "next/link";

import { PartyChat } from "@/components/chat/PartyChat";
import { chatAccess } from "@/lib/chat/access";
import { listPartyMessages } from "@/lib/chat/queries";

function Notice({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm leading-6 text-muted">
      {children}
    </p>
  );
}

// The chat area of /party/[id]. Decides on the server who sees the transcript;
// only active members get messages loaded and the live panel mounted, so
// leaving (which revalidates this page) unmounts the panel and its channel.
export async function PartyChatSection({ party, viewer }) {
  const access = chatAccess(party, viewer);
  let body;

  switch (access.kind) {
    case "expired":
      body = <Notice>แชทหมดอายุแล้ว</Notice>;
      break;
    case "guest":
      body = (
        <Notice>
          <Link
            href={`/login?next=${encodeURIComponent(`/party/${party.id}#chat`)}`}
            className="font-medium text-accent underline"
          >
            เข้าสู่ระบบ
          </Link>{" "}
          แล้วเข้าร่วมตี้เพื่อคุยในแชท
        </Notice>
      );
      break;
    case "left":
      body = <Notice>คุณออกจากตี้แล้ว แชทของตี้นี้จึงปิดสำหรับคุณ</Notice>;
      break;
    case "not_member":
      body = (
        <Notice>
          {access.rejected
            ? "แชทเปิดให้เฉพาะสมาชิกของตี้"
            : "เข้าร่วมตี้ก่อน แล้วจะคุยกับสมาชิกคนอื่นได้ที่นี่"}
        </Notice>
      );
      break;
    default: {
      const { ok, messages } = await listPartyMessages(party.id);

      body = (
        <>
          {ok ? null : (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              โหลดข้อความเก่าไม่สำเร็จ ข้อความใหม่จะยังแสดงตามปกติ
            </p>
          )}
          <PartyChat
            partyId={party.id}
            currentUserId={viewer.user.id}
            initialMessages={messages}
            notice={access.daysLeft ? `แชทจะหายไปใน ${access.daysLeft} วัน` : null}
          />
        </>
      );
    }
  }

  return (
    <section
      id="chat"
      aria-labelledby="chat-title"
      className="grid scroll-mt-6 gap-4 rounded-2xl border border-line bg-card p-5 sm:p-6"
    >
      <h2 id="chat-title" className="text-lg font-semibold">
        แชทของตี้
      </h2>
      {body}
    </section>
  );
}
