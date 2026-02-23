import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { participantAPI } from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [historyTab, setHistoryTab] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dashRes, evtRes] = await Promise.all([
        participantAPI.getDashboard(),
        participantAPI.getMyEvents(),
      ])
      setDashboard(dashRes.data.data || dashRes.data)
      setMyEvents(evtRes.data.data || evtRes.data || [])
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const stats = dashboard?.stats || {}
  const upcomingEvents = dashboard?.upcomingEvents || []

  const filteredHistory = myEvents.filter((reg) => {
    if (historyTab === 'all') return true
    if (historyTab === 'normal') return reg.registrationType === 'Normal'
    if (historyTab === 'merchandise') return reg.registrationType === 'Merchandise' || reg.registrationType === 'MerchRegOnly'
    if (historyTab === 'completed') return reg.status === 'Active' && reg.attendance?.marked
    if (historyTab === 'cancelled') return reg.status === 'Cancelled' || reg.status === 'Rejected'
    return true
  })

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
          <h1>My Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">🎫</div><div className="stat-label">Registrations</div><div className="stat-value">{stats.totalRegistrations ?? 0}</div></div>
          <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-label">Upcoming</div><div className="stat-value">{stats.upcomingCount ?? upcomingEvents.length}</div></div>
          <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-label">Total Spent</div><div className="stat-value">₹{stats.totalSpent ?? 0}</div></div>
        </div>

        {/* Main Tabs */}
        <div className="tabs" style={{ marginTop: '1.5rem' }}>
          <button className={`tab ${tab === 'upcoming' ? 'tab-active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming Events</button>
          <button className={`tab ${tab === 'history' ? 'tab-active' : ''}`} onClick={() => setTab('history')}>Participation History</button>
        </div>

        {tab === 'upcoming' && (
          <div className="dashboard-events-list">
            {upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No upcoming events</h3>
                <p>Browse and register for events to see them here.</p>
                <Link to="/browse-events" className="btn btn-primary">Browse Events</Link>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event._id || event.eventId?._id} className="card upcoming-card">
                  <div className="upcoming-info">
                    <h3>{event.eventId?.eventName || event.eventName}</h3>
                    <div className="upcoming-meta">
                      <span className="badge badge-primary">{event.eventId?.eventType || event.eventType}</span>
                      <span className="upcoming-org">{event.eventId?.organizerId?.organizerName || 'Organizer'}</span>
                      <span className="upcoming-date">
                        {event.eventId?.eventStartDate ? new Date(event.eventId.eventStartDate).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {event.ticketId && <span className="ticket-code">{event.ticketId}</span>}
                  </div>
                  <div className="upcoming-actions">
                    <Link to={`/events/${event.eventId?._id || event._id}`} className="btn btn-secondary btn-sm">View</Link>
                    {event.ticketId && <Link to={`/ticket/${event.ticketId}`} className="btn btn-primary btn-sm">Ticket</Link>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'history' && (
          <>
            <div className="tabs sub-tabs">
              {['all', 'normal', 'merchandise', 'completed', 'cancelled'].map((t) => (
                <button key={t} className={`tab ${historyTab === t ? 'tab-active' : ''}`} onClick={() => setHistoryTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="table-container">
              {filteredHistory.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p>No records found.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Type</th>
                      <th>Organizer</th>
                      <th>Status</th>
                      <th>Team</th>
                      <th>Ticket ID</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((reg) => (
                      <tr key={reg._id}>
                        <td>
                          <Link to={`/events/${reg.eventId?._id}`} className="link">{reg.eventId?.eventName || 'N/A'}</Link>
                        </td>
                        <td><span className="badge">{reg.registrationType}</span></td>
                        <td>{reg.eventId?.organizerId?.organizerName || '-'}</td>
                        <td>
                          <span className={`badge badge-${reg.status === 'Active' ? 'success' : reg.status === 'Pending' ? 'warning' : 'danger'}`}>
                            {reg.status}
                          </span>
                        </td>
                        <td>{reg.teamId?.teamName || '-'}</td>
                        <td>
                          {reg.ticketId ? (
                            <Link to={`/ticket/${reg.ticketId}`} className="ticket-code link">{reg.ticketId}</Link>
                          ) : '-'}
                        </td>
                        <td>{new Date(reg.registeredAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
