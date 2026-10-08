"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { createParty } from "@/app/create/actions";
import { JOIN_MODES, PARTY_CATEGORIES } from "@/lib/parties/categories";
import { createPartySchema, zodResolver } from "@/lib/parties/schema";
import { DURATION_MINUTES, formatDuration } from "@/lib/parties/time";

const fieldClass =
  "w-full rounded-xl border border-line bg-background px-3 py-2 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:border-red-700";

function FieldError({ message, id }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}

export function CreatePartyForm({ defaultDate, minDate }) {
  const router = useRouter();
  const [formError, setFormError] = useState(null);
  const [category, setCategory] = useState("sport");
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPartySchema),
    defaultValues: {
      title: "",
      category: "sport",
      customCategory: "",
      eventDate: defaultDate,
      eventTime: "18:00",
      durationMinutes: 120,
      location: "",
      maxMembers: 4,
      detail: "",
      joinMode: "approve",
    },
  });
  function onSubmit(values) {
    setFormError(null);
    startTransition(async () => {
      const result = await createParty(values);

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

      router.push(`/party/${result.id}`);
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
              setCategory(event.target.value);

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

      <div className="grid gap-3 sm:grid-cols-3">
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
          <label htmlFor="eventTime" className="text-sm font-medium">
            เวลาเริ่ม
          </label>
          <input
            id="eventTime"
            type="time"
            className={fieldClass}
            aria-invalid={errors.eventTime ? true : undefined}
            aria-describedby={errors.eventTime ? "event-time-error" : "event-time-hint"}
            {...register("eventTime")}
          />
          <p id="event-time-hint" className="text-xs text-muted">
            เวลาประเทศไทย
          </p>
          <FieldError id="event-time-error" message={errors.eventTime?.message} />
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
          min={2}
          max={30}
          className={fieldClass}
          aria-invalid={errors.maxMembers ? true : undefined}
          aria-describedby={errors.maxMembers ? "capacity-error" : undefined}
          {...register("maxMembers", { valueAsNumber: true })}
        />
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
        {JOIN_MODES.map((mode) => (
          <label
            key={mode.value}
            className="flex cursor-pointer gap-3 rounded-xl border border-line px-3 py-2"
          >
            <input
              type="radio"
              value={mode.value}
              className="mt-1"
              {...register("joinMode")}
            />
            <span>
              <span className="block text-sm font-medium">{mode.label}</span>
              <span className="block text-sm text-muted">{mode.hint}</span>
            </span>
          </label>
        ))}
        <FieldError message={errors.joinMode?.message} />
      </fieldset>

      {formError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "กำลังตั้งตี้..." : "ตั้งตี้"}
      </button>
    </form>
  );
}
