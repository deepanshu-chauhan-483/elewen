import { useMemo, useState } from 'react'
import { DashboardSearchContext } from './dashboardSearchContext.js'

export function DashboardSearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('')

  const value = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      clearSearch: () => setSearchTerm(''),
    }),
    [searchTerm]
  )

  return <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>
}
