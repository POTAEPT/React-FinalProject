import { chatState } from "@/lib/chat/expiry";

// What the chat section of /party/[id] shows for one viewer, first match wins:
//   expired     -> "chat expired", no transcript, no composer (everyone)
//   guest       -> login prompt
//   member      -> the live panel (pending or confirmed, host included);
//                  closing adds the "disappears in N days" notice
//   left        -> the viewer left; the chat closed for them
//   not_member  -> join prompt (also for rejected requests)
export function chatAccess(party, viewer, now = Date.now()) {
  const state = chatState(party, now);

  if (state.kind === "expired") {
    return { kind: "expired" };
  }

  if (!viewer?.user) {
    return { kind: "guest" };
  }

  const status = viewer.membership?.status ?? null;

  if (status === "pending" || status === "confirmed") {
    return {
      kind: "member",
      daysLeft: state.kind === "closing" ? state.daysLeft : null,
    };
  }

  if (status === "cancelled") {
    return { kind: "left" };
  }

  return { kind: "not_member", rejected: status === "rejected" };
}
