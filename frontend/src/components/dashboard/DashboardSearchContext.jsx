import { useMemo, useState } from 'react'
import { dashboardSearchContext } from './dashboardSearchContext'

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

  return <dashboardSearchContext.Provider value={value}>{children}</dashboardSearchContext.Provider>
}
