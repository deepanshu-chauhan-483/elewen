import { NavLink } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'
import { SIDEBAR_ITEMS } from './Sidebar'

export default function MobileDashboardMenuSection() {
  return (
    <section className="mt-6 md:hidden" aria-label="Dashboard menu">
      <div
        className="overflow-hidden rounded-2xl px-3 py-4"
        style={{ backgroundColor: DASHBOARD.COLORS.SIDEBAR_BG }}
      >
        <nav className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
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
                      color: isActive
                        ? DASHBOARD.COLORS.ACTIVE_TEXT
                        : DASHBOARD.COLORS.SIDEBAR_TEXT,
                    }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </section>
  )
}
