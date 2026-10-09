'use client'
import { useState } from 'react'
import Image from 'next/image'
import { uploadAvatar } from '@/lib/avatar/actions'

/**
 * อธิบาย: Component สำหรับเปลี่ยนรูปโปรไฟล์
 * จะเรียกใช้ Action ด้านบนเพื่ออัปโหลด และเปลี่ยนพรีวิวทันที
 */
export default function AvatarUploader({ userId, currentAvatarUrl }) {
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
      setPreviewUrl(publicUrl) // เปลี่ยนรูปแสดงผลทันที
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-24 overflow-hidden rounded-full border-2 border-brand bg-soft">
        {previewUrl ? (
          <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl text-soft-foreground">👤</div>
        )}
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" /></div>}
      </div>

      <label className="cursor-pointer rounded-xl border border-line px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-background focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
        {loading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={loading} className="sr-only" />
      </label>
      <p className="text-xs text-muted">JPEG, PNG, WEBP · สูงสุด 2MB</p>
      {error && <p role="alert" className="rounded-lg border border-danger-line bg-danger-bg px-2 py-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
