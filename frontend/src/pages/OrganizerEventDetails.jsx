import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import OrganizerNav from '../components/OrganizerNav'
import { eventAPI } from '../services/api'
import './OrganizerEventDetails.css'

const STATUS_COLORS = {
  Draft: 'badge-neutral',
  Published: 'badge-info',
  Ongoing: 'badge-warning',
  Completed: 'badge-success',
  Closed: 'badge-danger',
}

export default function OrganizerEventDetails() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await eventAPI.getById(eventId)
      setEvent(res.data.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (action) => {
    setActionLoading(true)
    try {
      switch (action) {
        case 'publish': await eventAPI.publish(eventId); break
        case 'ongoing': await eventAPI.markOngoing(eventId); break
        case 'completed': await eventAPI.markCompleted(eventId); break
        case 'close': await eventAPI.close(eventId); break
        case 'delete': await eventAPI.delete(eventId); navigate('/organizer/dashboard'); return
      }
      await loadEvent()
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          <div className="loading-page"><div className="spinner spinner-lg"></div><p>Loading event...</p></div>
        </main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          <div className="empty-state"><h3>Event not found</h3></div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>{event.eventName}</h1>
            <div className="event-detail-badges">
              <span className={`badge ${STATUS_COLORS[event.status]}`}>{event.status}</span>
              <span className="badge badge-info">{event.eventType}</span>
              {event.isTeamEvent && <span className="badge badge-neutral">Team (max {event.maxTeamSize})</span>}
              {event.flagged && <span className="badge badge-danger">Flagged</span>}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/organizer/dashboard')}>← Back</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Status Actions */}
        <div className="status-actions-bar">
          {event.status === 'Draft' && (
            <>
              <Link to={`/organizer/events/${eventId}/edit`} className="btn btn-secondary">✏️ Edit</Link>
              <button className="btn btn-success" onClick={() => handleStatusChange('publish')} disabled={actionLoading}>📢 Publish</button>
              <button className="btn btn-danger" onClick={() => handleStatusChange('delete')} disabled={actionLoading}>🗑 Delete</button>
            </>
          )}
          {event.status === 'Published' && (
            <>
              <Link to={`/organizer/events/${eventId}/edit`} className="btn btn-secondary">✏️ Edit (Limited)</Link>
              <button className="btn btn-warning" onClick={() => handleStatusChange('ongoing')} disabled={actionLoading}>🔴 Mark Ongoing</button>
              <button className="btn btn-success" onClick={() => handleStatusChange('completed')} disabled={actionLoading}>✅ Mark Completed</button>
              <button className="btn btn-danger" onClick={() => handleStatusChange('close')} disabled={actionLoading}>🔒 Close</button>
            </>
          )}
          {event.status === 'Ongoing' && (
            <>
              <button className="btn btn-success" onClick={() => handleStatusChange('completed')} disabled={actionLoading}>✅ Mark Completed</button>
              <button className="btn btn-danger" onClick={() => handleStatusChange('close')} disabled={actionLoading}>🔒 Close</button>
            </>
          )}
          {event.status === 'Completed' && (
            <button className="btn btn-danger" onClick={() => handleStatusChange('close')} disabled={actionLoading}>🔒 Close</button>
          )}
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <Link to={`/organizer/events/${eventId}/registrations`} className="action-card">
            <span className="action-icon">🎫</span>
            <span className="action-label">Registrations</span>
            <span className="action-desc">{event.currentRegistrations || 0} registered</span>
          </Link>
          <Link to={`/organizer/events/${eventId}/analytics`} className="action-card">
            <span className="action-icon">📊</span>
            <span className="action-label">Analytics</span>
            <span className="action-desc">View detailed stats</span>
          </Link>
          <Link to={`/organizer/events/${eventId}/scanner`} className="action-card">
            <span className="action-icon">📷</span>
            <span className="action-label">QR Scanner</span>
            <span className="action-desc">Check-in attendees</span>
          </Link>
        </div>

        {/* Event Overview */}
        <div className="detail-grid">
          <div className="card">
            <div className="card-header"><h3>Event Details</h3></div>
            <div className="detail-rows">
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-value">{event.eventDescription}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Eligibility</span>
                <span className="detail-value">{event.eligibility}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registration Fee</span>
                <span className="detail-value">{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registration Limit</span>
                <span className="detail-value">{event.registrationLimit || 'Unlimited'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Registrations</span>
                <span className="detail-value">{event.currentRegistrations || 0}</span>
              </div>
              {event.eventTags && event.eventTags.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Tags</span>
                  <span className="detail-value">
                    <div className="event-card-tags">
                      {event.eventTags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                    </div>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Schedule</h3></div>
            <div className="detail-rows">
              <div className="detail-row">
                <span className="detail-label">Start Date</span>
                <span className="detail-value">{new Date(event.eventStartDate).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">End Date</span>
                <span className="detail-value">{new Date(event.eventEndDate).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registration Deadline</span>
                <span className="detail-value">{new Date(event.registrationDeadline).toLocaleString()}</span>
              </div>
              {event.publishedAt && (
                <div className="detail-row">
                  <span className="detail-label">Published At</span>
                  <span className="detail-value">{new Date(event.publishedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Merchandise Details */}
        {event.eventType === 'Merchandise' && event.merchandiseDetails && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header"><h3>Merchandise: {event.merchandiseDetails.itemName}</h3></div>
            <div className="detail-rows">
              <div className="detail-row">
                <span className="detail-label">Purchase Limit</span>
                <span className="detail-value">{event.merchandiseDetails.purchaseLimitPerParticipant || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reg-only Allowed</span>
                <span className="detail-value">{event.merchandiseDetails.allowRegistrationOnly ? `Yes (₹${event.merchandiseDetails.registrationOnlyFee})` : 'No'}</span>
              </div>
            </div>
            {event.merchandiseDetails.variants && (
              <div className="table-container" style={{ marginTop: '0.75rem' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Size</th><th>Color</th><th>Stock</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    {event.merchandiseDetails.variants.map((v, i) => (
                      <tr key={i}>
                        <td>{v.size || '-'}</td>
                        <td>{v.color || '-'}</td>
                        <td>{v.stock}</td>
                        <td>₹{v.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Custom Form preview */}
        {event.eventType === 'Normal' && event.customForm && event.customForm.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header">
              <h3>Custom Registration Form ({event.customForm.length} fields)</h3>
              {event.formLocked && <span className="badge badge-warning">Locked</span>}
            </div>
            <div className="review-fields-list">
              {event.customForm.map((f, i) => (
                <div key={i} className="review-field-item">
                  <span className="review-field-num">#{i + 1}</span>
                  <span><strong>{f.fieldLabel}</strong> — {f.fieldType}{f.isRequired ? ' (Required)' : ''}</span>
                  {f.options && f.options.length > 0 && (
                    <span className="review-field-opts">Options: {f.options.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
