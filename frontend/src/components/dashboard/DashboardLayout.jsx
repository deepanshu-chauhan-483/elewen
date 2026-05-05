import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './navbar'
import { DASHBOARD } from '../../constants/dashboard'
import { Outlet } from 'react-router-dom'

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileSidebarOpen])

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

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto p-6 pb-28 md:pb-6 "
          style={{
            backgroundColor: '#F2F2F2',
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
