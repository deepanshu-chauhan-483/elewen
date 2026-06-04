import { useContext } from 'react'
import { DashboardSearchContext } from './DashboardSearchContext'

export function useDashboardSearch() {
  const context = useContext(DashboardSearchContext)

  if (!context) {
    throw new Error('useDashboardSearch must be used within DashboardSearchProvider')
  }

  return context
}
