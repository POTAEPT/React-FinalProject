import { redirect } from 'next/navigation'

import { EditProfileForm } from '@/components/account/EditProfileForm'
import { getSession } from '@/lib/auth/get-session'

// Edit form with its sign-in guard. Shared by /account/edit and the modal
// that intercepts it, so there is one form.
export async function EditProfile() {
  const session = await getSession()

  if (!session) redirect('/login?next=/account')
  if (session.profile.banned_at) redirect('/banned')

  return (
    <EditProfileForm
      userId={session.user.id}
      displayName={session.profile.display_name ?? ''}
      email={session.user.email}
      avatarUrl={session.profile.avatar_url}
    />
  )
}
