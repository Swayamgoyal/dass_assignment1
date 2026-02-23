import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { registrationAPI } from '../services/api'
import './TicketView.css'

export default function TicketView() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  const loadTicket = async () => {
    try {
      const res = await registrationAPI.getByTicket(ticketId)
      setTicket(res.data.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket not found')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return
    try {
      await registrationAPI.cancel(ticket._id)
      loadTicket()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel')
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

  if (!ticket) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="empty-state"><h3>Ticket not found</h3></div>
        </main>
      </div>
    )
  }

  const event = ticket.eventId || {}
  const participant = ticket.participantId || {}

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back to Dashboard</Link>

        <div className="ticket-container">
          <div className="ticket-card">
            {/* Ticket Header */}
            <div className="ticket-header">
              <div className="ticket-event-name">{event.eventName || 'Event'}</div>
              <span className={`badge badge-${ticket.status === 'Active' ? 'success' : ticket.status === 'Pending' ? 'warning' : 'danger'}`}>
                {ticket.status}
              </span>
            </div>

            {/* QR Section */}
            <div className="ticket-qr-section">
              {ticket.qrCode ? (
                <img src={ticket.qrCode} alt="QR Code" className="ticket-qr-image" />
              ) : (
                <div className="ticket-qr-placeholder">
                  <span>QR</span>
                </div>
              )}
              <div className="ticket-id-display">
                <span className="ticket-id-label">Ticket ID</span>
                <span className="ticket-id-value">{ticket.ticketId}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="ticket-divider"></div>

            {/* Details */}
            <div className="ticket-details">
              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Participant</span>
                <span className="ticket-detail-value">{participant.firstName} {participant.lastName}</span>
              </div>
              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Email</span>
                <span className="ticket-detail-value">{participant.email}</span>
              </div>
              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Event Type</span>
                <span className="ticket-detail-value">{event.eventType}</span>
              </div>
              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Registration Type</span>
                <span className="ticket-detail-value">{ticket.registrationType}</span>
              </div>
              {event.eventStartDate && (
                <div className="ticket-detail-row">
                  <span className="ticket-detail-label">Event Date</span>
                  <span className="ticket-detail-value">{new Date(event.eventStartDate).toLocaleDateString()} — {new Date(event.eventEndDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Registered</span>
                <span className="ticket-detail-value">{new Date(ticket.registeredAt).toLocaleString()}</span>
              </div>
              {ticket.merchandiseVariant && (
                <>
                  <div className="ticket-detail-row">
                    <span className="ticket-detail-label">Merchandise</span>
                    <span className="ticket-detail-value">{ticket.merchandiseVariant.size} / {ticket.merchandiseVariant.color}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span className="ticket-detail-label">Qty × Price</span>
                    <span className="ticket-detail-value">{ticket.merchandiseVariant.quantity} × ₹{ticket.merchandiseVariant.price}</span>
                  </div>
                </>
              )}
              {ticket.teamId && (
                <div className="ticket-detail-row">
                  <span className="ticket-detail-label">Team</span>
                  <span className="ticket-detail-value">{ticket.teamId.teamName || ticket.teamId}</span>
                </div>
              )}
              <div className="ticket-detail-row">
                <span className="ticket-detail-label">Attendance</span>
                <span className="ticket-detail-value">
                  {ticket.attendance?.marked ? (
                    <span style={{ color: 'var(--success)' }}>✓ Marked at {new Date(ticket.attendance.markedAt).toLocaleString()}</span>
                  ) : (
                    <span style={{ color: 'var(--gray-400)' }}>Not yet</span>
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            {ticket.status === 'Active' && !ticket.attendance?.marked && (
              <div className="ticket-actions">
                <button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel Registration</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
