import { Navigate, useParams, useSearchParams } from 'react-router-dom'

export default function PackageDetailsPage() {
  const { service = '', packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const next = searchParams.toString()
  const normalizedService = service.trim().toLowerCase()

  if (normalizedService === 'decor' || normalizedService === 'decor-single') {
    return <Navigate to={`/packages/decor-single/${packageId}${next ? `?${next}` : ''}`} replace />
  }

  if (normalizedService === 'sheesha' || normalizedService === 'sheesha-single') {
    return (
      <Navigate to={`/packages/sheesha-single/${packageId}${next ? `?${next}` : ''}`} replace />
    )
  }

  return <Navigate to={`/packages/${service}/${packageId}${next ? `?${next}` : ''}`} replace />
}
