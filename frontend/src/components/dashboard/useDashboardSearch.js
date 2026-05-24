import { useContext } from 'react'
import { dashboardSearchContext } from './DashboardSearchContext'

export function useDashboardSearch() {
  const context = useContext(dashboardSearchContext)

  if (!context) {
    throw new Error('useDashboardSearch must be used within DashboardSearchProvider')
  }

  return context
}
