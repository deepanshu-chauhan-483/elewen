import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveSeoForLocation } from '../../lib/seoRoutes'

function upsertMetaByName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLinkRel(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Applies title / description / robots / canonical from the current route.
 * Query strings are ignored for canonicals so funnel variants collapse.
 */
export default function SeoHead() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = resolveSeoForLocation(pathname)
    document.title = seo.title
    upsertMetaByName('description', seo.description)
    upsertMetaByName('robots', seo.robots)
    upsertLinkRel('canonical', seo.canonicalUrl)
  }, [pathname])

  return null
}
