import { getAdminImports } from '@/actions/admin'
import { ImportCenterView } from './client-page'

export default async function ImportCenterPage() {
  const imports = await getAdminImports()

  return <ImportCenterView imports={imports} />
}
