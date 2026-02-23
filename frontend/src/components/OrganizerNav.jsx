import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../redux/authSlice'
import { authAPI } from '../services/api'
import './OrganizerNav.css'

const NAV_ITEMS = [
  { path: '/organizer/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/organizer/create-event', label: 'Create Event', icon: '➕' },
  { path: '/organizer/ongoing-events', label: 'Ongoing Events', icon: '🔴' },
  { path: '/organizer/profile', label: 'Profile', icon: '👤' },
]

export default function OrganizerNav() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="sidebar organizer-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">🎉 Felicity</h2>
        <span className="sidebar-role">Organizer Panel</span>
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
          <div className="sidebar-avatar">🏢</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.organizerName || user?.name || 'Organizer'}</div>
            <div className="sidebar-user-role">{user?.category || 'Club'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </nav>
  )
}
