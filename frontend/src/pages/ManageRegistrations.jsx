import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import OrganizerNav from '../components/OrganizerNav'
import { organizerAPI } from '../services/api'
import './ManageRegistrations.css'

export default function ManageRegistrations() {
  const { eventId } = useParams()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [eventId])

  const fetchRegistrations = async () => {
    try {
      const res = await organizerAPI.getEventRegistrations(eventId)
      setRegistrations(res.data.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (regId) => {
    setActionLoading(regId)
    try {
      await organizerAPI.approveRegistration(eventId, regId)
      await fetchRegistrations()
    } catch (err) {
      setError(err.response?.data?.message || 'Approve failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (regId) => {
    setActionLoading(regId)
    try {
      await organizerAPI.rejectRegistration(eventId, regId)
      await fetchRegistrations()
    } catch (err) {
      setError(err.response?.data?.message || 'Reject failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAttendance = async (regId) => {
    setActionLoading(regId)
    try {
      await organizerAPI.markAttendance(eventId, regId)
      await fetchRegistrations()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await organizerAPI.exportRegistrations(eventId)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-${eventId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const filtered = registrations.filter((reg) => {
    const name = `${reg.participantId?.firstName || ''} ${reg.participantId?.lastName || ''}`.toLowerCase()
    const email = (reg.participantId?.email || '').toLowerCase()
    const ticketId = (reg.ticketId || '').toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || ticketId.includes(search.toLowerCase())
    const matchStatus = !statusFilter || reg.status === statusFilter
    const matchType = !typeFilter || reg.registrationType === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const counts = {
    total: registrations.length,
    active: registrations.filter((r) => r.status === 'Active').length,
    pending: registrations.filter((r) => r.status === 'Pending').length,
    rejected: registrations.filter((r) => r.status === 'Rejected').length,
    cancelled: registrations.filter((r) => r.status === 'Cancelled').length,
    attended: registrations.filter((r) => r.attendance?.marked).length,
  }

  const statusColor = (s) => {
    if (s === 'Active') return 'badge-success'
    if (s === 'Pending') return 'badge-warning'
    if (s === 'Rejected') return 'badge-danger'
    if (s === 'Cancelled') return 'badge-neutral'
    return 'badge-info'
  }

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Manage Registrations</h1>
            <Link to={`/organizer/events/${eventId}/details`} className="breadcrumb-link">← Back to Event</Link>
          </div>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : '📥 Export CSV'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error} <button className="alert-dismiss" onClick={() => setError('')}>✕</button></div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{counts.total}</div></div>
          <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value" style={{ color: 'var(--success)' }}>{counts.active}</div></div>
          <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{counts.pending}</div></div>
          <div className="stat-card"><div className="stat-label">Attended</div><div className="stat-value" style={{ color: 'var(--primary)' }}>{counts.attended}</div></div>
          <div className="stat-card"><div className="stat-label">Rejected</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{counts.rejected}</div></div>
        </div>

        {/* Filters */}
        <div className="filters-row">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by name, email, or ticket ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select className="form-select" style={{ maxWidth: '160px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Normal">Normal</option>
            <option value="Merchandise">Merchandise</option>
            <option value="MerchRegOnly">Reg Only</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h3>No registrations found</h3>
            <p>{search || statusFilter ? 'Try adjusting your filters' : 'No one has registered yet'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Ticket ID</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Fees Paid</th>
                  <th>Team</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => (
                  <tr key={reg._id}>
                    <td><strong>{reg.participantId?.firstName} {reg.participantId?.lastName}</strong></td>
                    <td>{reg.participantId?.email}</td>
                    <td><code className="ticket-code">{reg.ticketId || '-'}</code></td>
                    <td><span className="badge badge-info">{reg.registrationType || '-'}</span></td>
                    <td>{new Date(reg.createdAt || reg.registrationDate).toLocaleDateString()}</td>
                    <td><span className={`badge ${statusColor(reg.status)}`}>{reg.status}</span></td>
                    <td>
                      {reg.registrationType === 'Merchandise'
                        ? `₹${(reg.merchandiseVariant?.price || 0) * (reg.merchandiseVariant?.quantity || 1)}`
                        : reg.registrationType === 'MerchRegOnly'
                        ? `₹${reg.eventId?.registrationFee || 0}`
                        : `₹${reg.eventId?.registrationFee || 0}`}
                    </td>
                    <td>{reg.teamId?.teamName || '-'}</td>
                    <td>
                      {reg.attendance?.marked ? (
                        <span className="badge badge-success">✓ Present</span>
                      ) : (
                        <span className="badge badge-neutral">—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        {reg.status === 'Pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(reg._id)} disabled={actionLoading === reg._id}>✓</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(reg._id)} disabled={actionLoading === reg._id}>✕</button>
                          </>
                        )}
                        {reg.status === 'Active' && !reg.attendance?.marked && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleMarkAttendance(reg._id)} disabled={actionLoading === reg._id}>
                            📋 Attend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
