'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import AvatarUploader from '@/components/account/AvatarUploader'
import { updateDisplayName } from '@/lib/auth/profile-actions'

// Threads-style edit sheet: a labelled row per field and a full-width Done.
// The photo saves as soon as it is picked; the name saves on Done.
export function EditProfileForm({ userId, displayName, email, avatarUrl, closeHref }) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(event) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = name.trim() === displayName ? { ok: true } : await updateDisplayName(name)

      if (!result.ok) {
        setError(result.error)
        return
      }

      // Same rule as Modal: a direct visit has no in-app page to go back to.
      if (closeHref) {
        router.replace(closeHref)
      } else {
        router.back()
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
        <div className="grid min-w-0 flex-1 gap-1">
          <label htmlFor="profile-name" className="text-sm font-semibold">
            ชื่อ
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            required
            className="w-full bg-transparent py-1 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
        <AvatarUploader userId={userId} currentAvatarUrl={avatarUrl} name={displayName} />
      </div>
      <div className="grid gap-1 border-b border-line pb-3">
        <p className="text-sm font-semibold">อีเมล</p>
        <p className="text-base text-muted">{email}</p>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="press rounded-2xl bg-foreground px-4 py-3.5 text-base font-semibold text-background disabled:opacity-60"
      >
        {isPending ? 'กำลังบันทึก...' : 'เสร็จสิ้น'}
      </button>
    </form>
  )
}
