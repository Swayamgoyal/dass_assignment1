import { useState, useEffect } from 'react'
import OrganizerNav from '../components/OrganizerNav'
import { organizerAPI } from '../services/api'
import './OrganizerProfile.css'

export default function OrganizerProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' })

  // Password reset request
  const [resetRequests, setResetRequests] = useState([])
  const [resetReason, setResetReason] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)

  // Webhook
  const [testingWebhook, setTestingWebhook] = useState(false)

  useEffect(() => {
    loadProfile()
    loadResetRequests()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await organizerAPI.getProfile()
      const data = res.data.data || res.data
      setProfile(data)
      setForm({
        organizerName: data.organizerName || '',
        category: data.category || '',
        description: data.description || '',
        contactEmail: data.contactEmail || '',
        contactNumber: data.contactNumber || '',
        discordWebhook: data.discordWebhook || '',
      })
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const loadResetRequests = async () => {
    try {
      const res = await organizerAPI.getMyPasswordResetRequests()
      setResetRequests(res.data.data || [])
    } catch {
      // ignore
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      const res = await organizerAPI.updateProfile(form)
      setProfile(res.data.data || res.data)
      setEditing(false)
      setMsg({ type: 'success', text: 'Profile updated successfully' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestWebhook = async () => {
    setTestingWebhook(true)
    setMsg({ type: '', text: '' })
    try {
      await organizerAPI.testWebhook()
      setMsg({ type: 'success', text: 'Test message sent to Discord!' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Webhook test failed' })
    } finally {
      setTestingWebhook(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMsg({ type: '', text: '' })
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    try {
      await organizerAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    }
  }

  const handleResetRequest = async () => {
    if (!resetReason.trim()) {
      setMsg({ type: 'error', text: 'Please provide a reason for password reset' })
      return
    }
    try {
      await organizerAPI.requestPasswordReset({ reason: resetReason })
      setMsg({ type: 'success', text: 'Password reset request submitted! Admin will review it.' })
      setResetReason('')
      setShowResetForm(false)
      loadResetRequests()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' })
    }
  }

  const categories = ['Technical', 'Cultural', 'Sports', 'Academic', 'Social', 'Other']

  if (loading) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content"><div className="loading-page"><div className="spinner spinner-lg"></div></div></main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Organization Profile</h1>
          {!editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>}
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* Profile Card */}
        <div className="profile-layout">
          <div className="card profile-card">
            <div className="profile-avatar">{(profile?.organizerName || 'O')[0].toUpperCase()}</div>
            <h2 className="profile-name">{profile?.organizerName}</h2>
            <span className={`badge badge-${profile?.status === 'Active' ? 'success' : 'warning'}`}>{profile?.status}</span>
            <p className="profile-category">{profile?.category}</p>
            <div className="profile-meta">
              <p><strong>Username:</strong> {profile?.username}</p>
              <p><strong>Created:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="profile-details">
            {/* Editable Fields */}
            <div className="card">
              <div className="card-header">
                <h3>Organization Details</h3>
                {editing && (
                  <div className="header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Organization Name</label>
                  {editing ? (
                    <input type="text" className="form-input" value={form.organizerName}
                      onChange={(e) => setForm({ ...form, organizerName: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.organizerName || '-'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Category</label>
                  {editing ? (
                    <select className="form-input" value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <p className="field-value">{profile?.category || '-'}</p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  {editing ? (
                    <textarea className="form-input" rows={3} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.description || 'No description'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  {editing ? (
                    <input type="email" className="form-input" value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.contactEmail || '-'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  {editing ? (
                    <input type="text" className="form-input" value={form.contactNumber}
                      onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.contactNumber || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Discord Webhook */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header"><h3>Discord Webhook</h3></div>
              <p className="section-desc">Configure a Discord webhook to receive notifications about registrations and events.</p>
              {editing ? (
                <div className="form-group">
                  <input type="url" className="form-input" placeholder="https://discord.com/api/webhooks/..."
                    value={form.discordWebhook}
                    onChange={(e) => setForm({ ...form, discordWebhook: e.target.value })} />
                </div>
              ) : (
                <p className="field-value webhook-url">
                  {profile?.discordWebhook ? (
                    <>{profile.discordWebhook.substring(0, 50)}...</>
                  ) : 'Not configured'}
                </p>
              )}
              {profile?.discordWebhook && (
                <button className="btn btn-secondary btn-sm" onClick={handleTestWebhook} disabled={testingWebhook}>
                  {testingWebhook ? 'Sending...' : '🔔 Test Webhook'}
                </button>
              )}
            </div>

            {/* Password Reset Request */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h3>Password Management</h3>
                {!showResetForm && (
                  <button className="btn btn-warning btn-sm" onClick={() => setShowResetForm(true)}>Request Password Reset</button>
                )}
              </div>

              {showResetForm && (
                <div className="reset-form">
                  <p className="section-desc">Submit a request to the admin to reset your password. Provide a reason below.</p>
                  <div className="form-group">
                    <textarea className="form-input" rows={3} placeholder="Reason for password reset..."
                      value={resetReason} onChange={(e) => setResetReason(e.target.value)} />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowResetForm(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleResetRequest}>Submit Request</button>
                  </div>
                </div>
              )}

              {resetRequests.length > 0 && (
                <div className="reset-requests-list">
                  <h4>My Reset Requests</h4>
                  {resetRequests.map((req) => (
                    <div key={req._id} className="reset-request-item">
                      <div className="reset-request-info">
                        <span className={`badge badge-${req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'danger'}`}>
                          {req.status}
                        </span>
                        <span className="reset-reason">{req.reason}</span>
                      </div>
                      <span className="reset-date">{new Date(req.requestedAt || req.createdAt).toLocaleDateString()}</span>
                      {req.status === 'approved' && req.newPassword && (
                        <div className="new-password-box">
                          <strong>New Password:</strong> <code>{req.newPassword}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
