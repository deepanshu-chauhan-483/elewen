import { NavLink } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'

// 🔹 ICONS (all defined here, reusable)

const DashboardIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <rect x="9" y="2" width="5" height="3" rx="1" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <rect x="9" y="8" width="5" height="6" rx="1" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <rect x="2" y="10" width="5" height="4" rx="1" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const TasteIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <path d="M3 2V8C3 10 5 12 8 12C11 12 13 10 13 8V2" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <path d="M6 14H10" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const TimelineIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <path d="M8 4V8L11 10" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const DetailsIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="2" width="10" height="12" rx="1" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <path d="M5 5H11M5 8H11M5 11H8" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const MessageIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="8" rx="2" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <path d="M4 6L8 8L12 6" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const HistoryIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <path d="M8 3V8L11 10" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <circle cx="8" cy="8" r="6" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const BookmarkIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <path d="M4 2H12V14L8 11L4 14V2Z" stroke={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

const HelpIcon = ({ isActive }) => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke={isActive ? '#591902' : '#E7E0DA'} />
    <path
      d="M6.5 6C6.5 5 7.5 4.5 8.5 5C9.5 5.5 9.5 7 8.5 7.5C8 7.8 8 8.2 8 9"
      stroke={isActive ? '#591902' : '#E7E0DA'}
    />
    <circle cx="8" cy="11" r="0.5" fill={isActive ? '#591902' : '#E7E0DA'} />
  </svg>
)

// 🔹 REUSABLE NAV ITEM

const SidebarItem = ({ to, label, Icon }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all ${
          isActive ? 'bg-[#E7E0DA]' : ''
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon isActive={isActive} />

          <span
            style={{
              color: isActive ? DASHBOARD.COLORS.ACTIVE_TEXT : DASHBOARD.COLORS.SIDEBAR_TEXT,
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

// 🔹 SIDEBAR

const Sidebar = () => {
  return (
    <div
      className="flex flex-col"
      style={{
        width: DASHBOARD.SIDEBAR_WIDTH,
        backgroundColor: DASHBOARD.COLORS.SIDEBAR_BG,
      }}
    >
      {/* Logo */}
      <div className="bg-[#FAFAFA] py-5 pl-5">
        <h1 className="text-3xl font-serif text-[#591902]">ELEWEN</h1>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-1 px-4 py-6">
        <SidebarItem to="/dashboard/active-booking" label="Active Booking" Icon={DashboardIcon} />

        <SidebarItem to="/dashboard/sample-taste" label="Sample Taste Booking" Icon={TasteIcon} />

        <SidebarItem to="/dashboard/timeline" label="Booking Timeline" Icon={TimelineIcon} />

        <SidebarItem to="/dashboard/details" label="Booking Details" Icon={DetailsIcon} />

        <SidebarItem to="/dashboard/messages" label="Messages & Updates" Icon={MessageIcon} />

        <SidebarItem to="/dashboard/previous" label="Previous Bookings" Icon={HistoryIcon} />

        <SidebarItem to="/dashboard/saved" label="Saved Packages" Icon={BookmarkIcon} />

        <SidebarItem to="/dashboard/support" label="Support & Help" Icon={HelpIcon} />
      </div>
    </div>
  )
}

export default Sidebar
