'use client'
import Image from 'next/image'

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

// Same rules as uploadAvatar on the server, checked before anything is sent.
export function avatarFileError(file) {
  if (!AVATAR_TYPES.includes(file.type)) return 'รองรับเฉพาะไฟล์ JPEG, PNG, WEBP'
  if (file.size > AVATAR_MAX_BYTES) return 'ขนาดไฟล์ต้องไม่เกิน 2MB'
  return null
}

/**
 * Avatar picker for the edit-profile form. Picking a file only previews it;
 * the form uploads it when the user saves, so "ยกเลิก" really discards it.
 *   previewUrl  the saved avatar, or a blob: URL of the picked file
 *   onPick      called with the chosen File
 */
export default function AvatarUploader({ previewUrl, onPick, name = '', disabled = false, error = '' }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <label
        className="press group relative block size-20 cursor-pointer overflow-hidden rounded-full bg-soft focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
        title="เปลี่ยนรูปโปรไฟล์ (JPEG, PNG, WEBP สูงสุด 2MB)"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            sizes="80px"
            // A picked file is a local blob: URL, which the image optimizer cannot fetch.
            unoptimized={previewUrl.startsWith('blob:')}
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-3xl font-medium text-soft-foreground">
            {name.slice(0, 1)}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
          เปลี่ยนรูป
        </span>
        <input
          type="file"
          accept={AVATAR_TYPES.join(',')}
          onChange={(event) => {
            const file = event.target.files?.[0]
            // Reset so picking the same file again still fires onChange.
            event.target.value = ''
            if (file) onPick(file)
          }}
          disabled={disabled}
          aria-label="เปลี่ยนรูปโปรไฟล์"
          className="sr-only"
        />
      </label>
      {error ? (
        <p role="alert" className="max-w-48 rounded-xl border border-danger-line bg-danger-bg px-2 py-1 text-right text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
