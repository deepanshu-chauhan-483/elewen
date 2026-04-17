import ServicePackagesPageContent from '../components/package-listing/ServicePackagesPageContent'

export default function RentalFurniturePackagesPage() {
  return (
    <ServicePackagesPageContent
      serviceSlug="rental-furniture"
      serviceLabel="Rental Furniture"
      ctaTitle="Not sure which rental furniture package is right for you?"
      showHero={false}
    />
  )
}
