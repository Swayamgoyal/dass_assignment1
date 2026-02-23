import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../redux/authSlice'
import { authAPI } from '../services/api'
import './AdminNav.css'

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/organizers', label: 'Manage Clubs', icon: '🏢' },
  { path: '/admin/events', label: 'Moderate Events', icon: '🛡️' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  { path: '/admin/password-resets', label: 'Password Resets', icon: '🔑' },
]

export default function AdminNav() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // ignore
    }
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">🎉 Felicity</h2>
        <span className="sidebar-role">Admin Panel</span>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">⚙️</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.email || 'Admin'}</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </nav>
  )
}
