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
      <div className="relative w-24 h-24 overflow-hidden bg-zinc-100 border-2 border-zinc-200 rounded-full">
        {previewUrl ? (
          <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-3xl text-zinc-400">👤</div>
        )}
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" /></div>}
      </div>

      <label className="text-sm font-medium transition cursor-pointer text-zinc-600 hover:text-zinc-900">
        {loading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={loading} className="hidden" />
      </label>
      <p className="text-xs text-zinc-400">JPEG, PNG, WEBP · สูงสุด 2MB</p>
      {error && <p className="px-2 py-1 text-xs text-red-600 border border-red-100 rounded bg-red-50">{error}</p>}
    </div>
  )
}
