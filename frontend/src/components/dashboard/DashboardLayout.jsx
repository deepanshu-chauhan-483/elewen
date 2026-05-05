import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { DASHBOARD } from '../../constants/dashboard'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getStoredJwt, getValidStoredJwt } from '../../lib/api'

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setToken] = useState(() => getStoredJwt())

  useEffect(() => {
    const syncToken = () => setToken(getStoredJwt())

    window.addEventListener('elewen-auth-change', syncToken)
    window.addEventListener('storage', syncToken)

    return () => {
      window.removeEventListener('elewen-auth-change', syncToken)
      window.removeEventListener('storage', syncToken)
    }
  }, [])

  useEffect(() => {
    let active = true

    getValidStoredJwt().then(nextToken => {
      if (!active) return
      if (nextToken !== token) {
        setToken(nextToken)
      }
    })

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (token) return
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/login?redirect=${redirect}`, {
      replace: true,
      state: { from: `${location.pathname}${location.search}` },
    })
  }, [location.pathname, location.search, navigate, token])

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6 text-center text-sm text-[#6B7280]">
        Loading your customer dashboard...
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main
          className="flex-1 overflow-y-auto p-6"
          style={{
            backgroundColor: '#FAFAFA',
            marginTop: DASHBOARD.NAVBAR_HEIGHT,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
