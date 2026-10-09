import { redirect } from 'next/navigation'

import { EditProfileForm } from '@/components/account/EditProfileForm'
import { getSession } from '@/lib/auth/get-session'

// Edit form with its sign-in guard. Shared by /account/edit and the modal
// that intercepts it, so there is one form.
// closeHref: where "done" goes when the modal opened on a direct visit (no
// page in the app to go back to). Omit it to go back in history.
export async function EditProfile({ closeHref } = {}) {
  const session = await getSession()

  if (!session) redirect('/login?next=/account')

  return (
    <EditProfileForm
      userId={session.user.id}
      displayName={session.profile.display_name ?? ''}
      email={session.user.email}
      avatarUrl={session.profile.avatar_url}
      closeHref={closeHref}
    />
  )
}
