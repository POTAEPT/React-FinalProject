'use client'
import { useState } from 'react'
import Image from 'next/image'
import { uploadAvatar } from '@/lib/avatar/actions'

/**
 * Avatar for the profile header. The whole avatar is the "change photo"
 * control: tapping it opens the file picker and the preview updates at once.
 */
export default function AvatarUploader({ userId, currentAvatarUrl, name = '' }) {
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    const { publicUrl, error: uploadError } = await uploadAvatar({ userId, file })

    if (uploadError) {
      setError(uploadError)
    } else {
      setPreviewUrl(publicUrl)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <label
        className="press group relative block size-20 cursor-pointer overflow-hidden rounded-full bg-soft focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
        title="เปลี่ยนรูปโปรไฟล์ (JPEG, PNG, WEBP สูงสุด 2MB)"
      >
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-3xl font-medium text-soft-foreground">
            {name.slice(0, 1)}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
          {loading ? 'กำลังอัปโหลด' : 'เปลี่ยนรูป'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={loading}
          aria-label="เปลี่ยนรูปโปรไฟล์"
          className="sr-only"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-2 py-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
