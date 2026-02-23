import { useState, useEffect } from 'react'
import ParticipantNav from '../components/ParticipantNav'
import { useDispatch } from 'react-redux'
import { updateUser } from '../redux/authSlice'
import { participantAPI } from '../services/api'
import './ParticipantProfile.css'

export default function ParticipantProfile() {
  const dispatch = useDispatch()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [form, setForm] = useState({})

  // Password change
  const [showPwd, setShowPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await participantAPI.getProfile()
      const data = res.data.data || res.data
      setProfile(data)
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        contactNumber: data.contactNumber || '',
        collegeOrganization: data.collegeOrganization || '',
        areasOfInterest: data.areasOfInterest || [],
      })
    } catch {
      setMsg({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      const res = await participantAPI.updateProfile(form)
      const updated = res.data.data || res.data
      setProfile(updated)
      dispatch(updateUser(updated))
      setEditing(false)
      setMsg({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwdMsg({ type: '', text: '' })
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    try {
      await participantAPI.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      })
      setPwdMsg({ type: 'success', text: 'Password changed successfully' })
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPwd(false)
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed' })
    }
  }

  const removeInterest = (interest) => {
    setForm((prev) => ({ ...prev, areasOfInterest: prev.areasOfInterest.filter((i) => i !== interest) }))
  }

  const [newInterest, setNewInterest] = useState('')

  const addInterest = () => {
    const trimmed = newInterest.trim()
    if (trimmed && !form.areasOfInterest.includes(trimmed)) {
      setForm((prev) => ({ ...prev, areasOfInterest: [...prev.areasOfInterest, trimmed] }))
      setNewInterest('')
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content"><div className="loading-page"><div className="spinner spinner-lg"></div></div></main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <div className="page-header">
          <h1>My Profile</h1>
          {!editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>}
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="pp-layout">
          {/* Info Card */}
          <div className="card pp-info-card">
            <div className="pp-avatar">{(profile?.firstName || 'U')[0]}{(profile?.lastName || '')[0]}</div>
            <h2>{profile?.firstName} {profile?.lastName}</h2>
            <span className={`badge badge-${profile?.participantType === 'IIIT' ? 'primary' : 'secondary'}`}>
              {profile?.participantType}
            </span>
            <p className="pp-email">{profile?.email}</p>
            {profile?.followedClubs?.length > 0 && (
              <div className="pp-followed">
                <h4>Following</h4>
                <div className="pp-followed-list">
                  {profile.followedClubs.map((club) => (
                    <span key={club._id || club} className="badge">{club.organizerName || club}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pp-details">
            {/* Editable fields */}
            <div className="card">
              <div className="card-header">
                <h3>Personal Information</h3>
                {editing && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  {editing ? (
                    <input type="text" className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.firstName}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  {editing ? (
                    <input type="text" className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.lastName}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Email <span className="non-editable">(non-editable)</span></label>
                  <p className="field-value">{profile?.email}</p>
                </div>
                <div className="form-group">
                  <label>Participant Type <span className="non-editable">(non-editable)</span></label>
                  <p className="field-value">{profile?.participantType}</p>
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  {editing ? (
                    <input type="text" className="form-input" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.contactNumber || '-'}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>College / Organization</label>
                  {editing ? (
                    <input type="text" className="form-input" value={form.collegeOrganization} onChange={(e) => setForm({ ...form, collegeOrganization: e.target.value })} />
                  ) : (
                    <p className="field-value">{profile?.collegeOrganization || '-'}</p>
                  )}
                </div>
              </div>

              {/* Interests */}
              <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                <label>Areas of Interest</label>
                <div className="interest-chips">
                  {(editing ? form.areasOfInterest : profile?.areasOfInterest || []).map((i) => (
                    <span key={i} className="chip chip-active">
                      {i}
                      {editing && <button className="chip-remove" onClick={() => removeInterest(i)}>×</button>}
                    </span>
                  ))}
                  {(!editing && (!profile?.areasOfInterest || profile.areasOfInterest.length === 0)) && (
                    <span className="field-value">No interests set</span>
                  )}
                </div>
                {editing && (
                  <div className="add-interest-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type an interest and press Add"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest() } }}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={addInterest}>Add</button>
                  </div>
                )}
              </div>
            </div>

            {/* Security */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h3>Security</h3>
                {!showPwd && <button className="btn btn-warning btn-sm" onClick={() => setShowPwd(true)}>Change Password</button>}
              </div>
              {pwdMsg.text && <div className={`alert alert-${pwdMsg.type}`} style={{ marginBottom: '0.75rem' }}>{pwdMsg.text}</div>}
              {showPwd && (
                <form onSubmit={handlePasswordChange} className="pwd-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" className="form-input" value={pwdForm.currentPassword} onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" className="form-input" value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" className="form-input" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} required />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPwd(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
