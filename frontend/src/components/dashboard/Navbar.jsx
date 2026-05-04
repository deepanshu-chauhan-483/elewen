import { DASHBOARD } from '../../constants/dashboard'

const SearchBar = () => {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#F0F0F0] px-4 py-2 w-[300px]">
      <span>🔍</span>
      <input
        type="text"
        placeholder="Search"
        className="w-full bg-transparent outline-none text-sm"
      />
    </div>
  )
}

const UserMenu = () => {
  return (
    <div className="flex items-center gap-4">
      <button className="text-sm">← Back to Website</button>

      <button className="rounded-full bg-[#C6A15B] px-4 py-2 text-white text-sm">Logout</button>

      <div className="relative">
        🔔
        <span className="absolute -top-2 -right-2 bg-[#591902] text-white text-xs rounded-full px-1">
          3
        </span>
      </div>

      <div className="h-8 w-8 rounded-full bg-gray-300" />
    </div>
  )
}

const Navbar = () => {
  return (
    <header
      className="fixed top-0 right-0 flex items-center justify-between px-6"
      style={{
        height: DASHBOARD.NAVBAR_HEIGHT,
        left: DASHBOARD.SIDEBAR_WIDTH,
        backgroundColor: DASHBOARD.COLORS.NAVBAR_BG,
        borderBottom: `1px solid ${DASHBOARD.COLORS.NAVBAR_BORDER}`,
      }}
    >
      <SearchBar />

      <UserMenu />
    </header>
  )
}

export default Navbar
