import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import OrganizerNav from '../components/OrganizerNav'
import { organizerAPI, eventAPI } from '../services/api'
import './OrganizerDashboard.css'

const STATUS_COLORS = {
  Draft: 'badge-neutral',
  Published: 'badge-info',
  Ongoing: 'badge-warning',
  Completed: 'badge-success',
  Closed: 'badge-danger',
}

export default function OrganizerDashboard() {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [recentRegs, setRecentRegs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventsFilter, setEventsFilter] = useState('all')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [dashRes, eventsRes] = await Promise.all([
        organizerAPI.getDashboard(),
        eventAPI.getOrganizerEvents(),
      ])
      const d = dashRes.data.data || dashRes.data
      setStats(d.stats || d)
      setRecentRegs(d.recentRegistrations || [])
      setEvents(eventsRes.data.data || eventsRes.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((e) => {
    if (eventsFilter === 'all') return true
    return e.status === eventsFilter
  })

  if (loading) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          <div className="loading-page"><div className="spinner spinner-lg"></div><p>Loading dashboard...</p></div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Organizer Dashboard</h1>
          <Link to="/organizer/create-event" className="btn btn-primary">➕ Create Event</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{stats?.totalEvents ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📢</div>
            <div className="stat-label">Published</div>
            <div className="stat-value">{stats?.publishedEvents ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔴</div>
            <div className="stat-label">Ongoing</div>
            <div className="stat-value">{stats?.ongoingEvents ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats?.completedEvents ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-label">Registrations</div>
            <div className="stat-value">{stats?.totalRegistrations ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Revenue</div>
            <div className="stat-value">₹{stats?.totalRevenue ?? 0}</div>
          </div>
        </div>

        {/* Events Carousel */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>My Events</h3>
            <div className="filter-tabs">
              {['all', 'Draft', 'Published', 'Ongoing', 'Completed', 'Closed'].map((f) => (
                <button key={f} className={`tab ${eventsFilter === f ? 'active' : ''}`} onClick={() => setEventsFilter(f)}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No events found</h3>
              <p>{eventsFilter === 'all' ? 'Create your first event to get started' : `No ${eventsFilter} events`}</p>
              {eventsFilter === 'all' && (
                <Link to="/organizer/create-event" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  ➕ Create Event
                </Link>
              )}
            </div>
          ) : (
            <div className="events-carousel">
              {filteredEvents.map((event) => (
                <div className="event-card" key={event._id}>
                  <div className="event-card-header">
                    <span className={`badge ${STATUS_COLORS[event.status] || 'badge-neutral'}`}>{event.status}</span>
                    <span className="event-type-tag">{event.eventType}</span>
                  </div>
                  <h4 className="event-card-title">{event.eventName}</h4>
                  <div className="event-card-meta">
                    <span>📅 {new Date(event.eventStartDate).toLocaleDateString()}</span>
                    <span>🎫 {event.currentRegistrations || 0}{event.registrationLimit ? `/${event.registrationLimit}` : ''}</span>
                    {event.registrationFee > 0 && <span>💰 ₹{event.registrationFee}</span>}
                  </div>
                  {event.eventTags && event.eventTags.length > 0 && (
                    <div className="event-card-tags">
                      {event.eventTags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="event-card-actions">
                    <Link to={`/organizer/events/${event._id}/details`} className="btn btn-secondary btn-sm">View</Link>
                    {event.status === 'Draft' && (
                      <Link to={`/organizer/events/${event._id}/edit`} className="btn btn-primary btn-sm">Edit</Link>
                    )}
                    <Link to={`/organizer/events/${event._id}/registrations`} className="btn btn-secondary btn-sm">Registrations</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        {recentRegs.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Recent Registrations</h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegs.map((reg, i) => (
                    <tr key={reg._id || i}>
                      <td><strong>{reg.participantId?.firstName} {reg.participantId?.lastName}</strong></td>
                      <td>{reg.participantId?.email}</td>
                      <td>{reg.eventId?.eventName}</td>
                      <td><span className="badge badge-info">{reg.eventId?.eventType || reg.registrationType}</span></td>
                      <td>{new Date(reg.createdAt || reg.registrationDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
