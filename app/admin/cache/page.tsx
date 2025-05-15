import { fetchCacheStatus, fetchAllCacheKeys } from "@/app/actions/cache-actions"
import { CacheAdmin } from "@/components/cache-admin"

export default async function CacheAdminPage() {
  const cacheStatus = await fetchCacheStatus()
  const cacheKeys = await fetchAllCacheKeys()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cache Administration</h1>

      <CacheAdmin initialStatus={cacheStatus} initialKeys={cacheKeys} />
    </div>
  )
}
