import ServicePackagesPageContent from '../components/package-listing/ServicePackagesPageContent'
import HookahAgeGate from '../components/checkout/HookahAgeGate'

export default function SheeshaPackagesPage() {
  return (
    <HookahAgeGate cancelTo="/event-flow/service?flow=services">
      <ServicePackagesPageContent
        serviceSlug="sheesha"
        ctaTitle="Not sure which sheesha package is right for you?"
        showHero={false}
      />
    </HookahAgeGate>
  )
}
