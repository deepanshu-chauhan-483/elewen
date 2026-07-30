import { useSearchParams } from 'react-router-dom'
import ServicePackagesPageContent from '../components/package-listing/ServicePackagesPageContent'
import HookahAgeGate from '../components/checkout/HookahAgeGate'
import { isHookahSearchQuery } from '../lib/hookahAgeGate'

export default function PackageListingPage() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search')?.trim() ?? ''
  const content = <ServicePackagesPageContent serviceSlug="" serviceLabel="Packages" />

  if (isHookahSearchQuery(searchQuery)) {
    return <HookahAgeGate cancelTo="/">{content}</HookahAgeGate>
  }

  return content
}
