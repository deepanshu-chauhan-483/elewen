import { Navigate, useSearchParams } from 'react-router-dom'

/**
 * Bartending levels step removed — send users straight to packages.
 * Keeps query params (category, event, service, flow, …) for listing filters.
 */
export default function BartendingLevelsPage() {
  const [searchParams] = useSearchParams()
  const next = new URLSearchParams(searchParams)
  next.delete('level')
  if (!next.get('service')) next.set('service', 'bartending')

  const query = next.toString()
  return <Navigate to={`/packages/bartending${query ? `?${query}` : ''}`} replace />
}
