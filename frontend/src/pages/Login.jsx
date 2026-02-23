import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../redux/authSlice'
import { authAPI } from '../services/api'
import './Login.css'

const ROLES = [
  { key: 'participant', label: 'Participant', icon: '👤' },
  { key: 'organizer', label: 'Organizer', icon: '🏢' },
  { key: 'admin', label: 'Admin', icon: '⚙️' },
]

export default function Login() {
  const [activeRole, setActiveRole] = useState('participant')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      let response
      if (activeRole === 'participant') {
        response = await authAPI.loginParticipant(formData)
      } else if (activeRole === 'organizer') {
        response = await authAPI.loginOrganizer(formData)
      } else {
        response = await authAPI.loginAdmin(formData)
      }

      const { token, user } = response.data
      dispatch(loginSuccess({ token, user: { ...user, role: activeRole } }))

      // Redirect based on role
      if (activeRole === 'participant') {
        if (user.onboardingCompleted === false) {
          navigate('/onboarding')
        } else {
          navigate('/dashboard')
        }
      } else if (activeRole === 'organizer') {
        navigate('/organizer/dashboard')
      } else {
        navigate('/admin/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-branding">
          <div className="branding-content">
            <h1>🎉 Felicity</h1>
            <p className="branding-subtitle">Event Management System</p>
            <div className="branding-features">
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>Manage events seamlessly</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎫</span>
                <span>Easy registration & ticketing</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time analytics & insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <h2>Sign In</h2>
            <p className="login-subtitle">Choose your role and enter credentials</p>

            {/* Role selector */}
            <div className="role-selector">
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  className={`role-btn ${activeRole === role.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRole(role.key)
                    setError('')
                  }}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-label">{role.label}</span>
                </button>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder={activeRole === 'participant' ? 'you@iiit.ac.in or personal email' : 'Enter your email'}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In'}
              </button>
            </form>

            {activeRole === 'participant' && (
              <p className="login-footer">
                Don't have an account? <Link to="/register">Register here</Link>
              </p>
            )}

            {activeRole === 'organizer' && (
              <p className="login-footer login-note">
                Organizer accounts are created by the Admin. Contact your administrator for access.
              </p>
            )}

            {activeRole === 'admin' && (
              <p className="login-footer login-note">
                Admin account is provisioned by the system.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
