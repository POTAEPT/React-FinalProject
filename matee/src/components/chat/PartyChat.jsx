"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";

import { sendPartyMessage } from "@/lib/chat/actions";
import { MESSAGE_LIMIT, messageColumns, toMessage } from "@/lib/chat/message";
import { createClient } from "@/lib/supabase/client";

const MAX_LENGTH = 500;
// Realtime reports SUBSCRIBED before it starts forwarding postgres_changes,
// which takes a few seconds. Messages sent in that gap never arrive as events,
// so the panel reloads the latest messages once after this delay.
const CATCH_UP_DELAY_MS = 3000;

const timeFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

function formatTime(iso) {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

// Keeps one copy per id, oldest first. Our own messages arrive twice: from
// sendPartyMessage and from the Realtime insert event.
function mergeMessages(current, incoming) {
  if (current.some((message) => message.id === incoming.id)) {
    return current.map((message) =>
      message.id === incoming.id ? { ...message, ...incoming } : message,
    );
  }

  return [...current, incoming].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
}

function Avatar({ name, url }) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-soft text-sm text-soft-foreground"
    >
      {(name ?? "?").slice(0, 1)}
    </span>
  );
}

// Live chat for one party. The server decides who may see this panel and
// passes the latest messages; this component subscribes to new and deleted
// messages through Realtime (RLS filters inserts per subscriber) and sends
// through sendPartyMessage.
export function PartyChat({ partyId, currentUserId, initialMessages, notice = null }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  // Sender profiles already known, so Realtime inserts only fetch new senders.
  // A cache, never rendered from, so it is filled in place.
  const [profiles] = useState(
    () =>
      new Map(
        initialMessages
          .filter((message) => message.displayName)
          .map((message) => [
            message.userId,
            { displayName: message.displayName, avatarUrl: message.avatarUrl },
          ]),
      ),
  );
  const listRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let catchUpTimer = null;

    async function catchUp() {
      const { data, error } = await supabase
        .from("party_messages")
        .select(messageColumns)
        .eq("party_id", partyId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_LIMIT);

      if (error || !active) {
        return;
      }

      const latest = (data ?? []).map(toMessage);

      for (const message of latest) {
        if (message.displayName && !profiles.has(message.userId)) {
          profiles.set(message.userId, {
            displayName: message.displayName,
            avatarUrl: message.avatarUrl,
          });
        }
      }

      setMessages((current) => latest.reduce(mergeMessages, current));
    }

    async function withProfile(row) {
      const message = {
        id: row.id,
        partyId: row.party_id,
        userId: row.user_id,
        body: row.body,
        createdAt: row.created_at,
        displayName: null,
        avatarUrl: null,
      };
      let profile = profiles.get(row.user_id);

      if (!profile) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", row.user_id)
          .maybeSingle();

        profile = { displayName: data?.display_name ?? null, avatarUrl: data?.avatar_url ?? null };
        profiles.set(row.user_id, profile);
      }

      return { ...message, ...profile };
    }

    const channel = supabase
      .channel(`party-chat:${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "party_messages",
          filter: `party_id=eq.${partyId}`,
        },
        async (payload) => {
          const message = await withProfile(payload.new);

          if (active) {
            setMessages((current) => mergeMessages(current, message));
          }
        },
      )
      // Realtime cannot filter delete events by column, so every delete on the
      // table arrives with its id only; drop it if it is one of ours.
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "party_messages" },
        (payload) => {
          const id = payload.old?.id;

          if (id) {
            setMessages((current) => current.filter((message) => message.id !== id));
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && !catchUpTimer) {
          catchUpTimer = setTimeout(catchUp, CATCH_UP_DELAY_MS);
        }
      });

    return () => {
      active = false;
      clearTimeout(catchUpTimer);
      supabase.removeChannel(channel);
    };
  }, [partyId, profiles]);

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages.length]);

  function send() {
    const body = draft.trim();

    if (!body || isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await sendPartyMessage(partyId, body);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setDraft("");
      setMessages((current) => mergeMessages(current, result.message));
    });
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <div className="grid gap-3">
      {notice ? (
        <p role="status" className="rounded-xl bg-soft px-3 py-2 text-sm font-medium text-soft-foreground">
          {notice}
        </p>
      ) : null}

      <ol
        ref={listRef}
        aria-label="ข้อความในแชท"
        aria-live="polite"
        className="grid max-h-96 gap-3 overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted">ยังไม่มีข้อความ เริ่มทักทายได้เลย</li>
        ) : (
          messages.map((message) => {
            const mine = message.userId === currentUserId;
            const name = message.displayName ?? "สมาชิก";

            return (
              <li key={message.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <Avatar name={name} url={message.avatarUrl} />
                <div className={`grid max-w-[80%] gap-0.5 ${mine ? "justify-items-end" : ""}`}>
                  <p className="text-xs text-muted">
                    {mine ? "คุณ" : name} · {formatTime(message.createdAt)}
                  </p>
                  <p
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-6 ${
                      mine ? "bg-accent text-accent-foreground" : "bg-background"
                    }`}
                  >
                    {message.body}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ol>

      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label htmlFor={`chat-input-${partyId}`} className="sr-only">
          พิมพ์ข้อความ
        </label>
        <textarea
          id={`chat-input-${partyId}`}
          rows={2}
          maxLength={MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="พิมพ์ข้อความ แล้วกด Enter เพื่อส่ง"
          className="w-full resize-none rounded-xl border border-line bg-background px-3 py-2 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {draft.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={isPending || draft.trim().length === 0}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {isPending ? "กำลังส่ง..." : "ส่ง"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
