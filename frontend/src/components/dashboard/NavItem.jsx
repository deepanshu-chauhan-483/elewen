import { NavLink } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'

const NavItem = ({ item }) => {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
          isActive ? 'bg-[#E7E0DA]' : ''
        }`
      }
      style={({ isActive }) => ({
        color: isActive ? DASHBOARD.COLORS.ACTIVE_TEXT : DASHBOARD.COLORS.SIDEBAR_TEXT,
      })}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export default NavItem
