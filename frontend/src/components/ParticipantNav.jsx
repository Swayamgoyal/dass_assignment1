import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../redux/authSlice'
import { authAPI } from '../services/api'
import './ParticipantNav.css'

export default function ParticipantNav() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // ignore
    }
    dispatch(logout())
    navigate('/login')
  }

  const links = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/browse-events', icon: '🔍', label: 'Browse Events' },
    { to: '/my-teams', icon: '👥', label: 'My Teams' },
    { to: '/clubs', icon: '🏢', label: 'Clubs / Organizers' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <nav className="participant-nav">
      <div className="pnav-brand">
        <div className="pnav-logo">F</div>
        <span className="pnav-title">Felicity</span>
      </div>

      <div className="pnav-user">
        <div className="pnav-avatar">{(user?.firstName || 'U')[0]}</div>
        <div className="pnav-user-info">
          <span className="pnav-user-name">{user?.firstName} {user?.lastName}</span>
          <span className="pnav-user-role">Participant</span>
        </div>
      </div>

      <div className="pnav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `pnav-link ${isActive ? 'active' : ''}`}
          >
            <span className="pnav-link-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="pnav-footer">
        <button className="pnav-logout" onClick={handleLogout}>
          <span className="pnav-link-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
