import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/coupons', label: 'Coupons', icon: '🎟' },
  { to: '/events', label: 'Events', icon: '📅' },
  { to: '/spa', label: 'Spa', icon: '🧖' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col flex-shrink-0"
        style={{ backgroundColor: '#1a2035' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ borderColor: '#243050' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg"
            style={{ backgroundColor: '#c69c6d', color: '#1a2035' }}
          >
            S
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Senator Hotel</p>
            <p className="text-xs" style={{ color: '#c69c6d' }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-navy font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: '#c69c6d', color: '#1a2035' } : {}
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: '#243050' }}
        >
          <p className="text-xs text-gray-500 truncate px-2 mb-2">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <span className="text-base">↩</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
