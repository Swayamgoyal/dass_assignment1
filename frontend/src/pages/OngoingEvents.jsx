import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import OrganizerNav from '../components/OrganizerNav'
import { eventAPI } from '../services/api'
import './OngoingEvents.css'

export default function OngoingEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const res = await eventAPI.getOrganizerEvents()
      const all = res.data.data || res.data || []
      setEvents(all.filter((e) => e.status === 'Ongoing'))
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Ongoing Events</h1>
          <span className="badge badge-success">{events.length} live</span>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎪</div>
            <h3>No ongoing events</h3>
            <p>Events marked as "Ongoing" will appear here. Start by creating and publishing an event.</p>
            <Link to="/organizer/create-event" className="btn btn-primary">Create Event</Link>
          </div>
        ) : (
          <div className="ongoing-grid">
            {events.map((event) => (
              <div key={event._id} className="ongoing-card card">
                <div className="ongoing-card-header">
                  <h3>{event.eventName}</h3>
                  <span className="badge badge-success">Live</span>
                </div>
                <p className="ongoing-desc">{event.eventDescription?.substring(0, 100) || 'No description'}...</p>
                <div className="ongoing-meta">
                  <div className="meta-row">
                    <span className="meta-label">Type</span>
                    <span className="meta-value">{event.eventType}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Eligibility</span>
                    <span className="meta-value">{event.eligibility}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Start</span>
                    <span className="meta-value">{new Date(event.eventStartDate).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">End</span>
                    <span className="meta-value">{new Date(event.eventEndDate).toLocaleDateString()}</span>
                  </div>
                  {event.registrationFee > 0 && (
                    <div className="meta-row">
                      <span className="meta-label">Fee</span>
                      <span className="meta-value">₹{event.registrationFee}</span>
                    </div>
                  )}
                </div>
                <div className="ongoing-actions">
                  <Link to={`/organizer/events/${event._id}/details`} className="btn btn-primary btn-sm">Details</Link>
                  <Link to={`/organizer/events/${event._id}/registrations`} className="btn btn-secondary btn-sm">Registrations</Link>
                  <Link to={`/organizer/events/${event._id}/scanner`} className="btn btn-secondary btn-sm">QR Scanner</Link>
                  <Link to={`/organizer/events/${event._id}/analytics`} className="btn btn-secondary btn-sm">Analytics</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
