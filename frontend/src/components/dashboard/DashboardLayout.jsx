import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { DASHBOARD } from '../../constants/dashboard'
import { Outlet } from 'react-router-dom'

const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Right Section */}
      <div className="flex flex-1 flex-col">
        <Navbar />

        {/* Content */}
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
