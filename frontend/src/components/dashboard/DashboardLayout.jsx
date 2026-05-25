import { useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './navbar'
import { DashboardSearchProvider } from './DashboardSearchContext'
import { DASHBOARD } from '../../constants/dashboard'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getStoredJwt, getValidStoredJwt } from '../../lib/api'
import { scrollPageToTop } from '../../hooks/useScrollToTop'

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
  const [authResolved, setAuthResolved] = useState(() => Boolean(getStoredJwt()))
  const mainRef = useRef(null)

  useEffect(() => {
    let active = true

    const syncToken = () => {
      if (!active) return
      setAuthResolved(false)
      getValidStoredJwt()
        .then(nextToken => {
          if (!active) return
          setToken(nextToken || '')
          setAuthResolved(true)
        })
        .catch(() => {
          if (!active) return
          setToken('')
          setAuthResolved(true)
        })
    }

    window.addEventListener('elewen-auth-change', syncToken)
    window.addEventListener('storage', syncToken)

    return () => {
      active = false
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
      setAuthResolved(true)
    })

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!authResolved) return
    if (token) return
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/login?redirect=${redirect}`, {
      replace: true,
      state: { from: `${location.pathname}${location.search}` },
    })
  }, [authResolved, location.pathname, location.search, navigate, token])

  useEffect(() => {
    scrollPageToTop()
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }, [location.pathname, location.search])

  if (!authResolved || !token) {
    return (
      <div className="flex min-h-[var(--door-viewport-height)] items-center justify-center bg-[#FAFAFA] px-6 text-center text-sm text-[#6B7280] md:min-h-screen">
        Loading your customer dashboard...
      </div>
    )
  }

  return (
    <DashboardSearchProvider key={location.pathname}>
      <div className="dashboard-shell min-h-[var(--door-viewport-height)] w-full overflow-x-hidden bg-[#F2F2F2] md:flex md:min-h-screen">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Section */}
        <div className="flex min-h-[var(--door-viewport-height)] w-full flex-col bg-[#F2F2F2] md:ml-[260px] md:min-h-screen md:flex-1">
          <Navbar onMobileMenuOpen={() => setIsMobileSidebarOpen(true)} />

          <main
            ref={mainRef}
            className="dashboard-main flex flex-1 flex-col overflow-y-auto pb-28 md:min-h-0 md:p-6 md:pb-6"
            style={{
              backgroundColor: '#F2F2F2',
              marginTop: DASHBOARD.NAVBAR_HEIGHT,
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col px-6 py-6 md:px-6 md:py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DashboardSearchProvider>
  )
}

export default DashboardLayout
