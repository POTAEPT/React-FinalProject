'use client'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import AvatarUploader, { avatarFileError } from '@/components/account/AvatarUploader'
import { uploadAvatar } from '@/lib/avatar/actions'
import { updateDisplayName } from '@/lib/auth/profile-actions'

// Threads-style edit sheet: a labelled row per field, then "ยกเลิก" and
// "บันทึก". Nothing is saved until "บันทึก": a picked photo is only a
// preview, so cancelling (or closing the sheet) discards every change.
// closeHref: where to go after saving or cancelling when the sheet opened on
// a direct visit; without it the sheet goes back in history, like Modal.
export function EditProfileForm({ userId, displayName, email, avatarUrl, closeHref }) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  const nameChanged = name.trim() !== displayName
  const dirty = nameChanged || Boolean(file)

  // Free the picked file's blob: URL when it is replaced or the sheet closes.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function close() {
    if (closeHref) {
      router.replace(closeHref)
    } else {
      router.back()
    }
  }

  function onPick(picked) {
    const problem = avatarFileError(picked)
    setFileError(problem ?? '')
    if (problem) return

    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  function onSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!dirty) {
      close()
      return
    }

    startTransition(async () => {
      if (file) {
        const upload = await uploadAvatar({ userId, file })

        if (!upload.ok) {
          setError(upload.message)
          return
        }

        // The photo is saved; a later name error must not upload it again.
        setFile(null)
      }

      if (nameChanged) {
        const result = await updateDisplayName(name)

        if (!result.ok) {
          setError(result.message)
          return
        }
      }

      close()
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
        <AvatarUploader
          previewUrl={preview ?? avatarUrl}
          onPick={onPick}
          name={name || displayName}
          disabled={isPending}
          error={fileError}
        />
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
      <p className="text-sm text-muted" aria-live="polite">
        {dirty ? 'มีการแก้ไขที่ยังไม่ได้บันทึก' : 'ยังไม่มีการแก้ไข'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={close}
          disabled={isPending}
          className="press rounded-2xl border border-line px-4 py-3.5 text-base font-semibold disabled:opacity-60"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isPending || !dirty}
          className="press rounded-2xl bg-brand px-4 py-3.5 text-base font-semibold text-brand-foreground disabled:opacity-60"
        >
          {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </form>
  )
}
