import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './navbar'
import { DASHBOARD } from '../../constants/dashboard'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getStoredJwt, getValidStoredJwt } from '../../lib/api'

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileSidebarOpen])

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
    <div className="min-h-screen w-full overflow-x-hidden md:flex">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Section */}
      <div className="flex w-full flex-col md:ml-[260px] md:flex-1">
        <Navbar onMobileMenuOpen={() => setIsMobileSidebarOpen(true)} />

        <main
          className="flex-1 overflow-y-auto md:p-6 pb-28 md:pb-6"
          style={{
            backgroundColor: '#F2F2F2',
            marginTop: DASHBOARD.NAVBAR_HEIGHT,
          }}
        >
          <div className="px-6 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
