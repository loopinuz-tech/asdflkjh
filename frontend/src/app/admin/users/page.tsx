import { createClient } from '@/lib/supabase/client'
import { getAdminUsers } from '@/actions/admin'
import { AdminUsersView } from './client-page'

export default async function AdminUsersPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const users = await getAdminUsers()

  return <AdminUsersView initialUsers={users} currentUserId={user?.id || ''} />
}
