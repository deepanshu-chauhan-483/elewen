import { NavLink } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'

const getIconStroke = isActive => (isActive ? '#591902' : '#FAFAFA')

const DashboardIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke={strokeColor} />
      <rect x="9" y="2" width="5" height="3" rx="1" stroke={strokeColor} />
      <rect x="9" y="8" width="5" height="6" rx="1" stroke={strokeColor} />
      <rect x="2" y="10" width="5" height="4" rx="1" stroke={strokeColor} />
    </svg>
  )
}

const TimelineIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3495_1583)">
        <path
          d="M8.00016 4.00065V8.00065L10.6668 9.33398M14.6668 8.00065C14.6668 11.6825 11.6821 14.6673 8.00016 14.6673C4.31826 14.6673 1.3335 11.6825 1.3335 8.00065C1.3335 4.31875 4.31826 1.33398 8.00016 1.33398C11.6821 1.33398 14.6668 4.31875 14.6668 8.00065Z"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <defs>
        <clipPath id="clip0_3495_1583">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const DetailsIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.3335 4.00065H4.00016M1.3335 6.66732H4.00016M1.3335 9.33398H4.00016M1.3335 12.0007H4.00016M10.0002 1.33398V14.6673M10.0002 4.66732H13.3335M10.0002 8.00065H13.3335M10.0002 11.334H13.3335M4.00016 1.33398H12.0002C12.7365 1.33398 13.3335 1.93094 13.3335 2.66732V13.334C13.3335 14.0704 12.7365 14.6673 12.0002 14.6673H4.00016C3.26378 14.6673 2.66683 14.0704 2.66683 13.334V2.66732C2.66683 1.93094 3.26378 1.33398 4.00016 1.33398Z"
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MessageIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3495_1591)">
        <path
          d="M1.99462 10.8951C2.09265 11.1424 2.11447 11.4133 2.05729 11.6731L1.34729 13.8664C1.32441 13.9777 1.33033 14.0929 1.36447 14.2012C1.39862 14.3095 1.45987 14.4073 1.5424 14.4853C1.62494 14.5633 1.72603 14.6189 1.83609 14.6469C1.94615 14.6748 2.06153 14.6742 2.17129 14.6451L4.44662 13.9798C4.69177 13.9312 4.94564 13.9524 5.17929 14.0411C6.60288 14.7059 8.21553 14.8466 9.73272 14.4383C11.2499 14.0299 12.5741 13.0989 13.4718 11.8094C14.3694 10.5198 14.7827 8.95472 14.6388 7.39015C14.4949 5.82557 13.8031 4.36209 12.6853 3.25791C11.5676 2.15373 10.0958 1.47981 8.52954 1.35504C6.96333 1.23028 5.40338 1.6627 4.12492 2.57601C2.84646 3.48931 1.93164 4.82481 1.54189 6.34687C1.15213 7.86894 1.31247 9.47975 1.99462 10.8951Z"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <defs>
        <clipPath id="clip0_3495_1591">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const HistoryIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 8C2 9.18669 2.35189 10.3467 3.01118 11.3334C3.67047 12.3201 4.60754 13.0892 5.7039 13.5433C6.80026 13.9974 8.00666 14.1162 9.17054 13.8847C10.3344 13.6532 11.4035 13.0818 12.2426 12.2426C13.0818 11.4035 13.6532 10.3344 13.8847 9.17054C14.1162 8.00666 13.9974 6.80026 13.5433 5.7039C13.0892 4.60754 12.3201 3.67047 11.3334 3.01118C10.3467 2.35189 9.18669 2 8 2C6.32263 2.00631 4.71265 2.66082 3.50667 3.82667L2 5.33333M5.33333 5.33333H2V2M8 4.66667V8L10.6667 9.33333"
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const BookmarkIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.3333 14V9.33333C11.3333 9.15652 11.2631 8.98695 11.1381 8.86193C11.013 8.7369 10.8435 8.66667 10.6667 8.66667H5.33333C5.15652 8.66667 4.98695 8.7369 4.86193 8.86193C4.7369 8.98695 4.66667 9.15652 4.66667 9.33333V14M4.66667 2V4.66667C4.66667 4.84348 4.7369 5.01305 4.86193 5.13807C4.98695 5.2631 5.15652 5.33333 5.33333 5.33333H10M10.1333 2C10.485 2.00501 10.8205 2.14878 11.0667 2.4L13.6 4.93333C13.8512 5.17951 13.995 5.51497 14 5.86667V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H10.1333Z"
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const HelpIcon = ({ isActive }) => {
  const strokeColor = getIconStroke(isActive)

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3495_1603)">
        <path
          d="M8.00016 10.6673V8.00065M8.00016 5.33398H8.00683M14.6668 8.00065C14.6668 11.6825 11.6821 14.6673 8.00016 14.6673C4.31826 14.6673 1.3335 11.6825 1.3335 8.00065C1.3335 4.31875 4.31826 1.33398 8.00016 1.33398C11.6821 1.33398 14.6668 4.31875 14.6668 8.00065Z"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <defs>
        <clipPath id="clip0_3495_1603">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

// 🔹 REUSABLE NAV ITEM

const SidebarItem = ({ to, label, Icon, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all ${isActive ? 'bg-[#E7E0DA]' : ''}`
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

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 5L15 15M15 5L5 15" stroke="#591902" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export default function Sidebar({ isMobileOpen = false, onMobileClose = () => {} }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity md:hidden ${
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-0 z-40 flex h-screen w-screen flex-col transition-transform duration-300 md:left-0 md:top-0 md:h-screen md:w-[260px] md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: DASHBOARD.COLORS.SIDEBAR_BG,
        }}
      >
        <div className="flex h-[63px] items-center justify-between bg-[#FAFAFA] px-6 md:hidden">
          <h1 className="text-3xl font-serif text-[#591902]">ELEWEN</h1>
          <button type="button" aria-label="Close sidebar" onClick={onMobileClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="hidden bg-[#FAFAFA] py-4 pl-5 h-[66px] md:block border-r-[0.5px] border-[#591902]">
          <h1 className="text-3xl font-serif text-[#591902]">ELEWEN</h1>
        </div>

        <div className="flex flex-col gap-1 px-4 pt-6">
          <SidebarItem
            to="/user-dashboard/active-booking"
            label="Active Booking"
            Icon={DashboardIcon}
            onClick={onMobileClose}
          />
          <SidebarItem
            to="/user-dashboard/timeline"
            label="Booking Timeline"
            Icon={TimelineIcon}
            onClick={onMobileClose}
          />
          <SidebarItem
            to="/user-dashboard/details"
            label="Booking Details"
            Icon={DetailsIcon}
            onClick={onMobileClose}
          />
          <SidebarItem
            to="/user-dashboard/messages"
            label="Messages & Updates"
            Icon={MessageIcon}
            onClick={onMobileClose}
          />
          <SidebarItem
            to="/user-dashboard/previous"
            label="Previous Bookings"
            Icon={HistoryIcon}
            onClick={onMobileClose}
          />
          <SidebarItem
            to="/user-dashboard/saved"
            label="Saved Packages"
            Icon={BookmarkIcon}
            onClick={onMobileClose}
          />
          <SidebarItem
            to="/user-dashboard/support"
            label="Support & Help"
            Icon={HelpIcon}
            onClick={onMobileClose}
          />
        </div>
      </aside>
    </>
  )
}
