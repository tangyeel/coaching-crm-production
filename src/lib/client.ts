export async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Request failed')
  return data as T
}
