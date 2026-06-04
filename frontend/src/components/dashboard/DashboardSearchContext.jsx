import { createContext, useMemo, useState } from 'react'

export const DashboardSearchContext = createContext(null)

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

  return (
    <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>
  )
}
