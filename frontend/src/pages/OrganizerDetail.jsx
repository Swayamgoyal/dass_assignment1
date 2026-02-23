import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { onboardingAPI, participantAPI, publicEventAPI } from '../services/api'
import './OrganizerDetail.css'

export default function OrganizerDetail() {
  const { organizerId } = useParams()
  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    loadData()
  }, [organizerId])

  const loadData = async () => {
    try {
      const [orgRes, eventsRes, profileRes] = await Promise.all([
        onboardingAPI.getData().catch(() => ({ data: { data: { organizers: [] } } })),
        publicEventAPI.browse({ organizer: organizerId }).catch(() => ({ data: { data: [] } })),
        participantAPI.getProfile().catch(() => ({ data: { data: {} } })),
      ])
      // Find the organizer from the onboarding list
      const allOrgs = orgRes.data.data?.organizers || orgRes.data.organizers || []
      const orgData = allOrgs.find((o) => o._id === organizerId)
      setOrganizer(orgData || null)
      setEvents(eventsRes.data.data || [])

      const profile = profileRes.data.data || profileRes.data || {}
      const followed = (profile.followedClubs || []).map((c) => c._id || c)
      setIsFollowing(followed.includes(organizerId))
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      const res = await participantAPI.toggleFollow(organizerId)
      setIsFollowing(res.data.data?.isFollowing ?? !isFollowing)
    } catch {
      // ignore
    }
  }

  const now = new Date()
  const upcomingEvents = events.filter((e) => e.status === 'Published' || e.status === 'Ongoing' || new Date(e.eventStartDate) >= now)
  const pastEvents = events.filter((e) => e.status === 'Completed' || e.status === 'Closed')

  const displayEvents = tab === 'upcoming' ? upcomingEvents : pastEvents

  if (loading) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content"><div className="loading-page"><div className="spinner spinner-lg"></div></div></main>
      </div>
    )
  }

  if (!organizer) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content"><div className="empty-state"><h3>Organizer not found</h3></div></main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <Link to="/clubs" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Back to Clubs</Link>

        <div className="od-header card">
          <div className="od-header-main">
            <div className="od-avatar">{(organizer.organizerName || 'O')[0]}</div>
            <div className="od-header-info">
              <h1>{organizer.organizerName}</h1>
              <span className="badge badge-primary">{organizer.category}</span>
              <p className="od-desc">{organizer.description || 'No description'}</p>
              {organizer.contactEmail && <p className="od-contact">📧 {organizer.contactEmail}</p>}
            </div>
          </div>
          <button className={`btn ${isFollowing ? 'btn-danger' : 'btn-primary'}`} onClick={handleFollow}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </div>

        {/* Events */}
        <div className="tabs" style={{ marginTop: '1.5rem' }}>
          <button className={`tab ${tab === 'upcoming' ? 'tab-active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming ({upcomingEvents.length})</button>
          <button className={`tab ${tab === 'past' ? 'tab-active' : ''}`} onClick={() => setTab('past')}>Past ({pastEvents.length})</button>
        </div>

        {displayEvents.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '1rem' }}>
            <p>No {tab} events.</p>
          </div>
        ) : (
          <div className="events-grid" style={{ marginTop: '1rem' }}>
            {displayEvents.map((event) => (
              <Link to={`/events/${event._id}`} key={event._id} className="event-card card">
                <div className="event-card-top">
                  <span className={`badge badge-${event.eventType === 'Merchandise' ? 'warning' : 'primary'}`}>{event.eventType}</span>
                  <span className={`badge badge-${event.status === 'Published' || event.status === 'Ongoing' ? 'success' : 'default'}`}>{event.status}</span>
                </div>
                <h3 className="event-card-title">{event.eventName}</h3>
                <p className="event-card-desc">{event.eventDescription?.substring(0, 80)}...</p>
                <div className="event-card-meta">
                  <span>{event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : ''}</span>
                  <span>{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
