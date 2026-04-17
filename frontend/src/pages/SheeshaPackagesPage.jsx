import ServicePackagesPageContent from '../components/package-listing/ServicePackagesPageContent'

export default function SheeshaPackagesPage() {
  return (
    <ServicePackagesPageContent
      serviceSlug="sheesha"
      serviceLabel="Sheesha"
      ctaTitle="Not sure which sheesha package is right for you?"
      showHero={false}
    />
  )
}
