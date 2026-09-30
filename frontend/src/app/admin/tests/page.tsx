import { getAdminTests } from '@/actions/admin'
import { AdminTestsView } from './client-page'

export default async function AdminTestsPage() {
  const tests = await getAdminTests('all')

  return <AdminTestsView initialTests={tests} />
}
