import CmsPageLoader from './CmsPageLoader'
import { isStrapiPageLoading } from '../../hooks/useStrapiPageLoading'

/**
 * Renders children only after all Strapi react-query hooks have finished their initial fetch.
 */
export default function StrapiPageGate({ queries = [], children, label, fullScreen = true }) {
  if (isStrapiPageLoading(...queries)) {
    return <CmsPageLoader label={label} fullScreen={fullScreen} />
  }

  return children
}
