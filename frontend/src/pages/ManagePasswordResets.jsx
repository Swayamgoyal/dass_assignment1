import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './ManagePasswordResets.css'

export default function ManagePasswordResets() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [resultModal, setResultModal] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await adminAPI.getPasswordResetRequests()
      setRequests(res.data.data || res.data.requests || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load password reset requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      const res = await adminAPI.approvePasswordReset(id)
      const data = res.data.data || res.data

      setResultModal({
        type: 'approved',
        message: 'Password reset approved!',
        newPassword: data.newPassword || data.password || null,
        organizerName: data.organizerName || '',
      })

      await fetchRequests()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(id)
    try {
      await adminAPI.rejectPasswordReset(id)
      await fetchRequests()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatus = (req) => req.status || 'pending'

  const filtered = requests.filter((req) => {
    if (filter === 'all') return true
    return getStatus(req) === filter
  })

  const pendingCount = requests.filter((r) => getStatus(r) === 'pending').length

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Password Reset Requests</h1>
          {pendingCount > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
              {pendingCount} Pending
            </span>
          )}
        </div>

        {error && <div className="alert alert-error">{error} <button className="alert-dismiss" onClick={() => setError('')}>✕</button></div>}

        {/* Filter tabs */}
        <div className="tabs">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              className={`tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="tab-count">
                {f === 'all' ? requests.length : requests.filter((r) => getStatus(r) === f).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner spinner-lg"></div>
            <p>Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔑</div>
            <h3>{filter === 'all' ? 'No password reset requests' : `No ${filter} requests`}</h3>
            <p>{filter === 'pending' ? 'All caught up! No pending requests.' : 'No requests match this filter.'}</p>
          </div>
        ) : (
          <div className="reset-requests-list">
            {filtered.map((req) => {
              const status = getStatus(req)
              return (
                <div key={req._id} className={`reset-request-card ${status}`}>
                  <div className="rr-header">
                    <div className="rr-info">
                      <h3>{req.organizerId?.organizerName || req.organizerName || req.organizer?.organizerName || 'Unknown Organizer'}</h3>
                      <span className={`badge ${status === 'pending' ? 'badge-warning' : status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                        {status}
                      </span>
                    </div>
                    <span className="rr-date">{formatDate(req.createdAt || req.requestDate)}</span>
                  </div>

                  {req.reason && (
                    <div className="rr-reason">
                      <span className="rr-reason-label">Reason:</span>
                      <span className="rr-reason-text">{req.reason}</span>
                    </div>
                  )}

                  {req.adminComment && (
                    <div className="rr-comment">
                      <span className="rr-reason-label">Admin Comment:</span>
                      <span className="rr-reason-text">{req.adminComment}</span>
                    </div>
                  )}

                  {status === 'pending' && (
                    <div className="rr-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(req._id)}
                        disabled={actionLoading === req._id}
                      >
                        {actionLoading === req._id ? 'Processing...' : '✓ Approve'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(req._id)}
                        disabled={actionLoading === req._id}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Result modal for approved resets */}
        {resultModal && (
          <div className="modal-overlay" onClick={() => setResultModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Password Reset Approved</h2>
                <button className="modal-close" onClick={() => setResultModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                {resultModal.newPassword ? (
                  <>
                    <p>A new password has been generated. Share it with the organizer:</p>
                    <div className="credentials-box" style={{ marginTop: '1rem' }}>
                      <div className="credential-row">
                        <span className="credential-label">Organizer</span>
                        <span className="credential-value">{resultModal.organizerName}</span>
                      </div>
                      <div className="credential-row">
                        <span className="credential-label">New Password</span>
                        <span className="credential-value password-value">{resultModal.newPassword}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => navigator.clipboard.writeText(resultModal.newPassword)}
                    >
                      📋 Copy Password
                    </button>
                  </>
                ) : (
                  <p>Password reset has been approved. The organizer will receive their new credentials.</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setResultModal(null)}>Done</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
