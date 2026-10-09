"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

import { TimeSelect } from "@/components/ui/TimeSelect";
import { JOIN_MODES, PARTY_CATEGORIES } from "@/lib/parties/categories";
import { createPartySchema, zodResolver } from "@/lib/parties/schema";
import {
  DURATION_MINUTES,
  formatDuration,
  formatEventDate,
  formatTimeRange,
} from "@/lib/parties/time";

const fieldClass =
  "w-full rounded-xl border border-line bg-background px-3 py-2 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:border-danger";
const timeClass =
  "rounded-xl border border-line bg-background px-2 py-2 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:border-danger";

function FieldError({ message, id }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-danger">
      {message}
    </p>
  );
}

// sessionStorage can be missing or throw (private mode, blocked storage);
// a lost draft is fine, a crashed form is not.
function readDraft(key) {
  try {
    const raw = key ? window.sessionStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(key, values) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore: the draft is a convenience.
  }
}

function clearDraft(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

// The party form for /create and the host's edit form on /manage/[id].
//   action        Server Action called with the values; createParty, or
//                 updateParty bound to the party id
//   mode          "create" goes to the new party; "edit" stays and confirms
//   draftKey      create only: keeps the form in sessionStorage so leaving the
//                 page (e.g. to look at a conflicting party) does not lose it
//   host           create only: { name, avatarUrl } shown above the title
//   scheduleLocked edit only: date, time and duration are shown, not edited,
//                 because people have already joined or asked to join
export function PartyForm({
  action,
  mode = "create",
  defaultValues,
  minDate,
  draftKey = null,
  scheduleLocked = false,
  minMembers = 2,
  host = null,
  submitLabel,
  pendingLabel,
}) {
  const router = useRouter();
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    subscribe,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(createPartySchema),
    defaultValues,
  });
  const category = useWatch({ control, name: "category" });

  useEffect(() => {
    if (!draftKey) {
      return undefined;
    }

    const draft = readDraft(draftKey);

    if (draft) {
      reset({ ...defaultValues, ...draft });
    }

    return subscribe({
      formState: { values: true },
      callback: ({ values }) => writeDraft(draftKey, values),
    });
    // Restore once on mount; defaultValues come from the server and do not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  function onSubmit(values) {
    setFormError(null);
    setNotice(null);
    setConflict(null);
    startTransition(async () => {
      const result = await action(values);

      if (!result.ok && result.code === "time_conflict") {
        setError("eventDate", { type: "time_conflict", message: "" });
        setError("eventTime", { type: "time_conflict", message: result.message });
        setConflict(result);
        return;
      }

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, message] of Object.entries(result.fieldErrors)) {
            setError(key, { message });
          }
        }

        if (result.message) {
          setFormError(result.message);
        }

        return;
      }

      if (mode === "create") {
        clearDraft(draftKey);
        router.push(`/party/${result.id}`);
        return;
      }

      // The saved values become the new baseline for "cancel changes".
      reset(values);
      setNotice("บันทึกการแก้ไขแล้ว");
    });
  }

  // QA2-1: drop unsaved edits and go back to the last saved values.
  function cancelEdits() {
    reset();
    setFormError(null);
    setConflict(null);
    setNotice(null);
  }

  const title = useWatch({ control, name: "title" });
  const canSubmit = mode === "create" ? Boolean(title?.trim()) : isDirty;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-5" noValidate>
      {host ? (
        <div className="flex items-center gap-3">
          {host.avatarUrl ? (
            <Image
              src={host.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-soft font-medium text-soft-foreground"
            >
              {host.name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{host.name}</p>
            <p className="text-sm text-muted">เจ้าของตี้</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-1">
        <label htmlFor="title" className="sr-only">
          ชื่อกิจกรรม
        </label>
        <input
          id="title"
          maxLength={80}
          placeholder="ชวนใครทำอะไร?"
          autoFocus={mode === "create"}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
          className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted/70 aria-invalid:text-danger"
          {...register("title")}
        />
        <label htmlFor="detail" className="sr-only">
          รายละเอียด
        </label>
        <textarea
          id="detail"
          rows={3}
          maxLength={1000}
          placeholder="รายละเอียด เช่น ต้องเตรียมอะไร นัดเจอกันตรงไหน"
          className="w-full resize-none bg-transparent text-base leading-6 outline-none placeholder:text-muted/70"
          aria-invalid={errors.detail ? true : undefined}
          aria-describedby={errors.detail ? "detail-error" : undefined}
          {...register("detail")}
        />
        <FieldError id="title-error" message={errors.title?.message} />
        <FieldError id="detail-error" message={errors.detail?.message} />
      </div>

      <fieldset className="grid gap-2">
        <legend className="sr-only">หมวดหมู่</legend>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {PARTY_CATEGORIES.map((item) => (
            <label
              key={item.value}
              className="press shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-muted has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
            >
              <input
                type="radio"
                value={item.value}
                className="sr-only"
                {...register("category", {
                  onChange(event) {
                    if (event.target.value !== "other") {
                      setValue("customCategory", "");
                    }
                  },
                })}
              />
              {item.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.category?.message} />
        {category === "other" ? (
          <div className="grid gap-1">
            <label htmlFor="customCategory" className="sr-only">
              ชื่อหมวด
            </label>
            <input
              id="customCategory"
              maxLength={30}
              placeholder="ชื่อหมวด"
              aria-invalid={errors.customCategory ? true : undefined}
              aria-describedby={errors.customCategory ? "custom-category-error" : undefined}
              className={fieldClass}
              {...register("customCategory")}
            />
            <FieldError id="custom-category-error" message={errors.customCategory?.message} />
          </div>
        ) : null}
      </fieldset>

      <div className="grid divide-y divide-line rounded-2xl border border-line">
        {scheduleLocked ? (
          <div className="grid gap-1 px-4 py-3">
            <p className="text-sm font-medium">วันเวลา</p>
            <p className="text-sm">
              {formatEventDate(defaultValues.eventDate)} ·{" "}
              {formatTimeRange(defaultValues.eventTime, defaultValues.durationMinutes)} ·{" "}
              {formatDuration(defaultValues.durationMinutes)}
            </p>
            <p className="text-xs text-muted">
              มีคนเข้าร่วมหรือขอเข้าร่วมแล้ว จึงเปลี่ยนวันเวลาไม่ได้ ถ้าต้องย้ายวัน ให้ยกเลิกตี้แล้วตั้งใหม่
            </p>
            <FieldError message={errors.eventDate?.message || errors.eventTime?.message} />
          </div>
        ) : (
          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
            <div className="grid gap-1">
              <label htmlFor="eventDate" className="text-xs font-medium text-muted">
                วันที่
              </label>
              <input
                id="eventDate"
                type="date"
                min={minDate}
                className={fieldClass}
                aria-invalid={errors.eventDate ? true : undefined}
                {...register("eventDate")}
              />
              <FieldError message={errors.eventDate?.message} />
            </div>
            <div className="grid gap-1">
              <label id="eventTime-label" htmlFor="eventTime" className="text-xs font-medium text-muted">
                เวลาเริ่ม
              </label>
              <Controller
                control={control}
                name="eventTime"
                render={({ field }) => (
                  <TimeSelect
                    id="eventTime"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={Boolean(errors.eventTime)}
                    describedBy={errors.eventTime ? "event-time-error" : "event-time-hint"}
                    className={timeClass}
                  />
                )}
              />
              <p id="event-time-hint" className="text-xs text-muted">
                เวลาประเทศไทย แบบ 24 ชั่วโมง
              </p>
              <FieldError id="event-time-error" message={errors.eventTime?.message} />
              {conflict?.conflictingPartyId && errors.eventTime ? (
                <Link
                  href={`/party/${conflict.conflictingPartyId}`}
                  target="_blank"
                  rel="noopener"
                  className="text-sm font-medium text-accent underline"
                >
                  ดูตี้ “{conflict.conflictingTitle}” (เปิดแท็บใหม่)
                </Link>
              ) : null}
            </div>
            <div className="grid gap-1">
              <label htmlFor="durationMinutes" className="text-xs font-medium text-muted">
                ระยะเวลา
              </label>
              <select
                id="durationMinutes"
                className={fieldClass}
                aria-invalid={errors.durationMinutes ? true : undefined}
                {...register("durationMinutes", { valueAsNumber: true })}
              >
                {DURATION_MINUTES.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ))}
              </select>
              <FieldError message={errors.durationMinutes?.message} />
            </div>
          </div>
        )}

        <div className="grid gap-1 px-4 py-3">
          <label htmlFor="location" className="text-xs font-medium text-muted">
            สถานที่
          </label>
          <input
            id="location"
            maxLength={120}
            placeholder="เช่น สนามแบดหลัง มช."
            className="w-full bg-transparent text-base outline-none placeholder:text-muted/70"
            aria-invalid={errors.location ? true : undefined}
            aria-describedby={errors.location ? "location-error" : undefined}
            {...register("location")}
          />
          <FieldError id="location-error" message={errors.location?.message} />
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="grid gap-0.5">
            <label htmlFor="maxMembers" className="text-xs font-medium text-muted">
              จำนวนที่รับ รวมเจ้าของตี้
            </label>
            {minMembers > 2 ? (
              <p className="text-xs text-muted">ตอนนี้มีสมาชิก {minMembers} คน ตั้งต่ำกว่านี้ไม่ได้</p>
            ) : null}
            <FieldError id="capacity-error" message={errors.maxMembers?.message} />
          </div>
          <input
            id="maxMembers"
            type="number"
            inputMode="numeric"
            min={Math.max(2, minMembers)}
            max={30}
            className="w-20 rounded-xl bg-background px-3 py-2 text-center text-base font-semibold tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:outline-danger"
            aria-invalid={errors.maxMembers ? true : undefined}
            aria-describedby={errors.maxMembers ? "capacity-error" : undefined}
            {...register("maxMembers", { valueAsNumber: true })}
          />
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="sr-only">วิธีเข้าร่วม</legend>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-background p-1">
          {JOIN_MODES.map((joinMode) => (
            <label
              key={joinMode.value}
              className="press grid cursor-pointer gap-0.5 rounded-xl px-3 py-2.5 text-center has-[:checked]:border has-[:checked]:border-line has-[:checked]:bg-card has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
            >
              <input type="radio" value={joinMode.value} className="sr-only" {...register("joinMode")} />
              <span className="text-sm font-semibold">{joinMode.label}</span>
              <span className="text-xs leading-4 text-muted">{joinMode.hint}</span>
            </label>
          ))}
        </div>
        {mode === "edit" ? (
          <p className="text-xs text-muted">
            เปลี่ยนเป็น “เข้าได้ทันที” แล้ว คำขอที่ค้างอยู่ยังรอคุณยืนยันหรือปฏิเสธเหมือนเดิม
          </p>
        ) : null}
        <FieldError message={errors.joinMode?.message} />
      </fieldset>

      {formError ? (
        <p
          role="alert"
          className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl bg-soft px-3 py-2 text-sm text-soft-foreground">
          {notice}
        </p>
      ) : null}

      <div
        className={`flex items-center justify-end gap-3 ${
          mode === "create"
            ? "glass-card sticky bottom-0 z-[1] -mx-5 -mb-5 mt-auto px-5 pt-5 pb-4"
            : ""
        }`}
      >
        {mode === "edit" ? (
          <button
            type="button"
            onClick={cancelEdits}
            disabled={isPending || !isDirty}
            className="press rounded-full border border-line px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            ยกเลิกการแก้ไข
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="press rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
      {mode === "edit" && !isDirty && !notice ? (
        <p className="text-xs text-muted">ยังไม่มีอะไรเปลี่ยน แก้ช่องไหนก็ได้แล้วกดบันทึก</p>
      ) : null}
    </form>
  );
}
