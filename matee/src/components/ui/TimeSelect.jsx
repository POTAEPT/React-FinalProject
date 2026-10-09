"use client";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

// A 24-hour time picker built from two selects. The native <input type="time">
// follows the browser's locale (often AM/PM), while the rest of the app shows
// 24-hour times, so this keeps every screen in the same format.
// value and onChange use "HH:MM".
export function TimeSelect({ id, value, onChange, onBlur, invalid, describedBy, className }) {
  const [hour = "18", minute = "00"] = String(value || "").split(":");
  // A stored time that is not on a 15-minute step (older parties) stays selectable.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      className="flex items-center gap-1"
    >
      <select
        id={id}
        aria-label="ชั่วโมง"
        aria-invalid={invalid || undefined}
        value={hour}
        onChange={(event) => onChange(`${event.target.value}:${minute}`)}
        onBlur={onBlur}
        className={className}
      >
        {HOURS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="font-medium">
        :
      </span>
      <select
        aria-label="นาที"
        aria-invalid={invalid || undefined}
        value={minute}
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        onBlur={onBlur}
        className={className}
      >
        {minutes.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted">น.</span>
    </div>
  );
}
