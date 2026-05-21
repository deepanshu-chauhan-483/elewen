import { createContext, useState, createElement } from 'react'

export const dashboardSearchContext = createContext(null)

export const DashboardSearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const value = { searchTerm, setSearchTerm }

  return createElement(dashboardSearchContext.Provider, { value }, children)
}
