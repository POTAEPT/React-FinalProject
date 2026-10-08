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
      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-line bg-background">
        {previewUrl ? (
          <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted">👤</div>
        )}
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/70"><span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>}
      </div>

      <label className="cursor-pointer text-sm font-medium text-accent transition hover:underline">
        {loading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={loading} className="hidden" />
      </label>
      <p className="text-xs text-muted">JPEG, PNG, WEBP · สูงสุด 2MB</p>
      {error && <p className="rounded border border-danger/40 bg-danger-soft px-2 py-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
