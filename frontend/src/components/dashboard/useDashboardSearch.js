import { useContext } from 'react'
import { DashboardSearchContext } from './dashboardSearchContext.js'

export function useDashboardSearch() {
  const context = useContext(DashboardSearchContext)

  if (!context) {
    throw new Error('useDashboardSearch must be used within DashboardSearchProvider')
  }

  return context
}
