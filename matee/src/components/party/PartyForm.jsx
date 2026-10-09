"use client";

import { useEffect, useState, useTransition } from "react";
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
    formState: { errors },
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

      setNotice("บันทึกการแก้ไขแล้ว");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          ชื่อกิจกรรม
        </label>
        <input
          id="title"
          maxLength={80}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={fieldClass}
          {...register("title")}
        />
        <FieldError id="title-error" message={errors.title?.message} />
      </div>

      <div className="grid gap-1">
        <label htmlFor="category" className="text-sm font-medium">
          หมวดหมู่
        </label>
        <select
          id="category"
          className={fieldClass}
          aria-invalid={errors.category ? true : undefined}
          {...register("category", {
            onChange(event) {
              if (event.target.value !== "other") {
                setValue("customCategory", "");
              }
            },
          })}
        >
          {PARTY_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.category?.message} />
      </div>

      {category === "other" ? (
        <div className="grid gap-1">
          <label htmlFor="customCategory" className="text-sm font-medium">
            ชื่อหมวด
          </label>
          <input
            id="customCategory"
            maxLength={30}
            aria-invalid={errors.customCategory ? true : undefined}
            aria-describedby={errors.customCategory ? "custom-category-error" : undefined}
            className={fieldClass}
            {...register("customCategory")}
          />
          <FieldError id="custom-category-error" message={errors.customCategory?.message} />
        </div>
      ) : null}

      {scheduleLocked ? (
        <div className="grid gap-1 rounded-xl border border-dashed border-line px-3 py-2">
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <div className="grid gap-1">
            <label htmlFor="eventDate" className="text-sm font-medium">
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
            <label id="eventTime-label" htmlFor="eventTime" className="text-sm font-medium">
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
            <label htmlFor="durationMinutes" className="text-sm font-medium">
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

      <div className="grid gap-1">
        <label htmlFor="location" className="text-sm font-medium">
          สถานที่
        </label>
        <input
          id="location"
          maxLength={120}
          className={fieldClass}
          aria-invalid={errors.location ? true : undefined}
          aria-describedby={errors.location ? "location-error" : undefined}
          {...register("location")}
        />
        <FieldError id="location-error" message={errors.location?.message} />
      </div>

      <div className="grid gap-1">
        <label htmlFor="maxMembers" className="text-sm font-medium">
          จำนวนที่รับ รวมเจ้าของตี้
        </label>
        <input
          id="maxMembers"
          type="number"
          min={Math.max(2, minMembers)}
          max={30}
          className={fieldClass}
          aria-invalid={errors.maxMembers ? true : undefined}
          aria-describedby={errors.maxMembers ? "capacity-error" : undefined}
          {...register("maxMembers", { valueAsNumber: true })}
        />
        {minMembers > 2 ? (
          <p className="text-xs text-muted">ตอนนี้มีสมาชิก {minMembers} คน ตั้งต่ำกว่านี้ไม่ได้</p>
        ) : null}
        <FieldError id="capacity-error" message={errors.maxMembers?.message} />
      </div>

      <div className="grid gap-1">
        <label htmlFor="detail" className="text-sm font-medium">
          รายละเอียด
        </label>
        <textarea
          id="detail"
          rows={4}
          maxLength={1000}
          className={fieldClass}
          aria-invalid={errors.detail ? true : undefined}
          aria-describedby={errors.detail ? "detail-error" : undefined}
          {...register("detail")}
        />
        <FieldError id="detail-error" message={errors.detail?.message} />
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">วิธีเข้าร่วม</legend>
        {JOIN_MODES.map((joinMode) => (
          <label
            key={joinMode.value}
            className="flex cursor-pointer gap-3 rounded-xl border border-line px-3 py-2 has-[:checked]:border-accent"
          >
            <input type="radio" value={joinMode.value} className="mt-1" {...register("joinMode")} />
            <span>
              <span className="block text-sm font-medium">{joinMode.label}</span>
              <span className="block text-sm text-muted">{joinMode.hint}</span>
            </span>
          </label>
        ))}
        {mode === "edit" ? (
          <p className="text-xs text-muted">
            เปลี่ยนเป็น “เข้าได้เลย” แล้ว คำขอที่ค้างอยู่ยังรอคุณยืนยันหรือปฏิเสธเหมือนเดิม
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

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
