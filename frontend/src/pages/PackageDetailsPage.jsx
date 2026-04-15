import { Navigate, useParams, useSearchParams } from 'react-router-dom'

export default function PackageDetailsPage() {
  const { service = '', packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const next = searchParams.toString()

  if (service === 'decor') {
    return <Navigate to={`/packages/decor-single/${packageId}${next ? `?${next}` : ''}`} replace />
  }

  return <Navigate to={`/packages/${service}${next ? `?${next}` : ''}`} replace />
}
