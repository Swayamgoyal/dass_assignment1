import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './CreateOrganizer.css'

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Literary',
  'Social',
  'Media',
  'Fest Team',
  'Council',
  'Other',
]

export default function CreateOrganizer() {
  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
    loginEmail: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.organizerName.trim()) {
      setError('Organizer name is required')
      return
    }
    if (!formData.category) {
      setError('Category is required')
      return
    }
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required')
      return
    }
    if (!formData.loginEmail.trim()) {
      setError('Login email is required')
      return
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await adminAPI.createOrganizer(formData)
      const data = res.data.data || res.data

      // Show credentials to admin
      setSuccess({
        name: formData.organizerName,
        email: data.loginEmail || data.email || formData.contactEmail,
        password: formData.password,
      })
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create organizer')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page-wrapper">
        <AdminNav />
        <main className="page-content">
          <div className="page-header">
            <h1>Organizer Created!</h1>
          </div>

          <div className="card credentials-card">
            <div className="success-header">
              <span className="success-icon">✅</span>
              <h2>Account Created Successfully</h2>
            </div>

            <p className="credentials-note">
              Please share these credentials with the organizer. The password will not be shown again.
            </p>

            <div className="credentials-box">
              <div className="credential-row">
                <span className="credential-label">Organizer Name</span>
                <span className="credential-value">{success.name}</span>
              </div>
              <div className="credential-row">
                <span className="credential-label">Login Email</span>
                <span className="credential-value">{success.email}</span>
              </div>
              <div className="credential-row">
                <span className="credential-label">Password</span>
                <span className="credential-value password-value">{success.password}</span>
              </div>
            </div>

            <div className="credentials-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const text = `Organizer: ${success.name}\nEmail: ${success.email}\nPassword: ${success.password}`
                  navigator.clipboard.writeText(text)
                }}
              >
                📋 Copy Credentials
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSuccess(null)
                  setFormData({ organizerName: '', category: '', description: '', contactEmail: '', loginEmail: '', password: '' })
                }}
              >
                ➕ Create Another
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/admin/organizers')}
              >
                View All Organizers
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Add New Club / Organizer</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/organizers')}>
            ← Back to List
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card create-org-form-card">
          <p className="form-intro">
            Create a new club or organizer account. The system will auto-generate login credentials
            that you can share with the organizer.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="organizerName">Organizer / Club Name *</label>
              <input
                id="organizerName"
                name="organizerName"
                type="text"
                className="form-input"
                placeholder="e.g., Programming Club"
                value={formData.organizerName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Brief description of the club or organizer"
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactEmail">Contact Email *</label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                className="form-input"
                placeholder="club@example.com"
                value={formData.contactEmail}
                onChange={handleChange}
              />
              <p className="form-hint">This will also be used as the login email unless the system generates one.</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="loginEmail">Login Email *</label>
              <input
                id="loginEmail"
                name="loginEmail"
                type="email"
                className="form-input"
                placeholder="login@example.com"
                value={formData.loginEmail}
                onChange={handleChange}
              />
              <p className="form-hint">The email the organizer will use to log in.</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="text"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="form-hint">Set an initial password. Share it with the organizer securely.</p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/organizers')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner"></span> Creating...</> : 'Create Organizer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
