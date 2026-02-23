import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { publicEventAPI } from '../services/api'
import './BrowseEvents.css'

export default function BrowseEvents() {
  const [events, setEvents] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    eligibility: '',
    fee: '',
    sort: 'newest',
    dateFrom: '',
    dateTo: '',
  })
  const [activeFilter, setActiveFilter] = useState('all') // all | trending | followed

  useEffect(() => {
    loadTrending()
  }, [])

  useEffect(() => {
    loadEvents()
  }, [search, filters, activeFilter])

  const loadTrending = async () => {
    try {
      const res = await publicEventAPI.getTrending()
      setTrending(res.data.data || [])
    } catch {
      // ignore
    }
  }

  const loadEvents = async () => {
    setLoading(true)
    try {
      if (activeFilter === 'trending') {
        const res = await publicEventAPI.getTrending()
        setEvents(res.data.data || [])
      } else if (activeFilter === 'followed') {
        const res = await publicEventAPI.getFollowed()
        setEvents(res.data.data || [])
      } else {
        const params = { ...filters }
        if (search) params.search = search
        Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
        const res = await publicEventAPI.browse(params)
        setEvents(res.data.data || [])
      }
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Browse Events</h1>
        </div>

        {/* Trending strip */}
        {trending.length > 0 && (
          <div className="trending-strip">
            <h3>🔥 Trending Now</h3>
            <div className="trending-scroll">
              {trending.map((e) => (
                <Link to={`/events/${e._id}`} key={e._id} className="trending-chip">
                  {e.eventName}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="browse-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search events, organizers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row">
            <div className="filter-tabs">
              <button className={`tab ${activeFilter === 'all' ? 'tab-active' : ''}`} onClick={() => setActiveFilter('all')}>All Events</button>
              <button className={`tab ${activeFilter === 'trending' ? 'tab-active' : ''}`} onClick={() => setActiveFilter('trending')}>Trending</button>
              <button className={`tab ${activeFilter === 'followed' ? 'tab-active' : ''}`} onClick={() => setActiveFilter('followed')}>Followed Clubs</button>
            </div>
            <div className="filter-selects">
              <select className="form-input filter-select" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                <option value="">All Types</option>
                <option value="Normal">Normal</option>
                <option value="Merchandise">Merchandise</option>
              </select>
              <select className="form-input filter-select" value={filters.eligibility} onChange={(e) => handleFilterChange('eligibility', e.target.value)}>
                <option value="">All Eligibility</option>
                <option value="All">Everyone</option>
                <option value="IIIT">IIIT Only</option>
                <option value="Non-IIIT">Non-IIIT</option>
              </select>
              <select className="form-input filter-select" value={filters.fee} onChange={(e) => handleFilterChange('fee', e.target.value)}>
                <option value="">Any Fee</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
              <select className="form-input filter-select" value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
                <option value="newest">Newest</option>
                <option value="deadline">Deadline Soon</option>
                <option value="trending">Trending</option>
              </select>
            </div>
            <div className="filter-dates">
              <input type="date" className="form-input filter-date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
              <span className="date-sep">to</span>
              <input type="date" className="form-input filter-date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No events found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <Link to={`/events/${event._id}`} key={event._id} className="event-card card">
                <div className="event-card-top">
                  <span className={`badge badge-${event.eventType === 'Merchandise' ? 'warning' : 'primary'}`}>{event.eventType}</span>
                  {event.registrationFee > 0 ? (
                    <span className="event-fee">₹{event.registrationFee}</span>
                  ) : (
                    <span className="event-fee free">Free</span>
                  )}
                </div>
                <h3 className="event-card-title">{event.eventName}</h3>
                <p className="event-card-desc">{event.eventDescription?.substring(0, 80) || 'No description'}...</p>
                <div className="event-card-meta">
                  <span className="event-org">{event.organizerId?.organizerName || 'Unknown'}</span>
                  <span className="event-date">{event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : ''}</span>
                </div>
                <div className="event-card-footer">
                  <span className={`badge badge-sm badge-${event.eligibility === 'All' ? 'success' : 'info'}`}>{event.eligibility}</span>
                  {event.eventTags?.slice(0, 2).map((t) => <span key={t} className="event-tag">{t}</span>)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
