import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import api, { publicEventAPI, feedbackAPI } from '../services/api'
import './EventDetails.css'

export default function EventDetails() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState([])
  const [fbStats, setFbStats] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [fbForm, setFbForm] = useState({ rating: 5, comment: '' })
  const [fbMsg, setFbMsg] = useState('')

  useEffect(() => {
    loadEvent()
    loadFeedback()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await publicEventAPI.getDetails(eventId)
      setEvent(res.data.data || res.data)
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const loadFeedback = async () => {
    try {
      const [fbRes, statsRes] = await Promise.all([
        feedbackAPI.getEventFeedback(eventId),
        feedbackAPI.getEventFeedbackStats(eventId),
      ])
      setFeedback(fbRes.data.data || [])
      setFbStats(statsRes.data.data || null)
    } catch {
      // ignore
    }
  }

  const handleSubmitFeedback = async () => {
    try {
      await feedbackAPI.submit({ eventId, rating: fbForm.rating, comment: fbForm.comment })
      setFbMsg('Feedback submitted!')
      setFbForm({ rating: 5, comment: '' })
      loadFeedback()
    } catch (err) {
      setFbMsg(err.response?.data?.message || 'Failed to submit feedback')
    }
  }

  const handleCalendar = async (format) => {
    try {
      if (format === 'ics') {
        const res = await publicEventAPI.getCalendar(eventId)
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = `${event?.eventName || 'event'}.ics`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        // Google / Outlook: backend returns a URL via ?format=
        const res = await api.get(`/events/${eventId}/calendar?format=${format}`)
        if (res.data?.url) window.open(res.data.url, '_blank')
      }
    } catch {
      // ignore
    }
  }

  const isDeadlinePassed = event?.registrationDeadline && new Date(event.registrationDeadline) < new Date()
  const isFull = event?.registrationLimit && (event?.currentRegistrations >= event?.registrationLimit)

  if (loading) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content"><div className="loading-page"><div className="spinner spinner-lg"></div></div></main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content"><div className="empty-state"><h3>Event not found</h3></div></main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>{event.eventName}</h1>
            <div className="ed-badges">
              <span className={`badge badge-${event.eventType === 'Merchandise' ? 'warning' : 'primary'}`}>{event.eventType}</span>
              <span className={`badge badge-${event.status === 'Published' || event.status === 'Ongoing' ? 'success' : 'default'}`}>{event.status}</span>
              <span className={`badge badge-${event.eligibility === 'All' ? 'success' : 'info'}`}>{event.eligibility}</span>
              {event.isTeamEvent && <span className="badge badge-info">👥 Team Event (Max {event.maxTeamSize})</span>}
            </div>
          </div>
          <Link to="/browse-events" className="btn btn-secondary">← Back</Link>
        </div>

        <div className="ed-layout">
          {/* Main info */}
          <div className="ed-main">
            <div className="card">
              <div className="card-header"><h3>About</h3></div>
              <p className="ed-description">{event.eventDescription || 'No description provided.'}</p>
              {event.eventTags?.length > 0 && (
                <div className="ed-tags">
                  {event.eventTags.map((t) => <span key={t} className="event-tag">{t}</span>)}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header"><h3>Schedule</h3></div>
              <div className="detail-rows">
                <div className="detail-row"><span className="detail-label">Start Date</span><span className="detail-value">{new Date(event.eventStartDate).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-label">End Date</span><span className="detail-value">{new Date(event.eventEndDate).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-label">Registration Deadline</span><span className="detail-value">{event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : 'N/A'}</span></div>
                <div className="detail-row">
                  <span className="detail-label">Add to Calendar</span>
                  <span className="detail-value" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCalendar('ics')}>📅 .ics</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCalendar('google')}>📅 Google</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCalendar('outlook')}>📅 Outlook</button>
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Form Preview */}
            {event.customForm?.length > 0 && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header"><h3>Registration Form Fields</h3></div>
                <div className="form-preview-list">
                  {event.customForm.map((field, i) => (
                    <div key={i} className="form-preview-item">
                      <span className="fprev-label">{field.fieldLabel}</span>
                      <span className="fprev-type badge">{field.fieldType}</span>
                      {field.isRequired && <span className="fprev-req">Required</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merchandise Variants */}
            {event.eventType === 'Merchandise' && event.merchandiseDetails?.variants?.length > 0 && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header"><h3>Available Merchandise</h3></div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Size</th><th>Color</th><th>Price</th><th>Stock</th></tr>
                    </thead>
                    <tbody>
                      {event.merchandiseDetails.variants.map((v, i) => (
                        <tr key={i}>
                          <td>{v.size || '-'}</td>
                          <td>{v.color || '-'}</td>
                          <td>₹{v.price}</td>
                          <td>{v.stock > 0 ? v.stock : <span style={{ color: 'var(--danger)' }}>Out of stock</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {(event.status === 'Completed' || event.status === 'Closed') && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <h3>Feedback</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowFeedback(!showFeedback)}>
                    {showFeedback ? 'Hide' : 'Leave Feedback'}
                  </button>
                </div>

                {fbStats && (
                  <div className="fb-stats">
                    <div className="fb-avg">
                      <span className="fb-avg-num">{fbStats.averageRating?.toFixed(1) || 'N/A'}</span>
                      <span className="fb-avg-star">★</span>
                      <span className="fb-avg-count">({fbStats.totalFeedbacks} reviews)</span>
                    </div>
                    <div className="fb-dist">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="fb-dist-row">
                          <span>{star}★</span>
                          <div className="fb-dist-bar">
                            <div className="fb-dist-fill" style={{
                              width: `${fbStats.totalFeedbacks > 0 ? ((fbStats.ratingDistribution?.[star] || 0) / fbStats.totalFeedbacks * 100) : 0}%`
                            }}></div>
                          </div>
                          <span>{fbStats.ratingDistribution?.[star] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showFeedback && (
                  <div className="fb-form">
                    <div className="fb-rating-select">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} className={`fb-star ${fbForm.rating >= s ? 'active' : ''}`} onClick={() => setFbForm({ ...fbForm, rating: s })}>★</button>
                      ))}
                    </div>
                    <textarea className="form-input" rows={3} placeholder="Share your experience..." value={fbForm.comment} onChange={(e) => setFbForm({ ...fbForm, comment: e.target.value })} />
                    <button className="btn btn-primary btn-sm" onClick={handleSubmitFeedback}>Submit Feedback</button>
                    {fbMsg && <p className="fb-msg">{fbMsg}</p>}
                  </div>
                )}

                {feedback.length > 0 && (
                  <div className="fb-list">
                    {feedback.map((fb) => (
                      <div key={fb._id} className="fb-item">
                        <div className="fb-item-stars">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</div>
                        <p className="fb-item-comment">{fb.comment}</p>
                        <span className="fb-item-date">{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="ed-sidebar">
            <div className="card ed-register-card">
              <h3>Registration</h3>
              <div className="ed-price">
                {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
              </div>
              <div className="detail-rows" style={{ margin: '0.75rem 0' }}>
                <div className="detail-row"><span className="detail-label">Limit</span><span className="detail-value">{event.registrationLimit || 'Unlimited'}</span></div>
                {event.isTeamEvent && <div className="detail-row"><span className="detail-label">Team Size</span><span className="detail-value">Up to {event.maxTeamSize}</span></div>}
              </div>

              {isDeadlinePassed ? (
                <div className="ed-blocked">Registration deadline has passed</div>
              ) : isFull ? (
                <div className="ed-blocked">Event is full</div>
              ) : event.status === 'Published' || event.status === 'Ongoing' ? (
                event.isTeamEvent ? (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/my-teams?eventId=${eventId}`)}>
                    👥 Form / Join a Team
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/events/${eventId}/register`)}>
                    {event.eventType === 'Merchandise' ? 'Purchase / Register' : 'Register Now'}
                  </button>
                )
              ) : (
                <div className="ed-blocked">Registration not available</div>
              )}
            </div>

            {/* Organizer Info */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <h4>Organizer</h4>
              <Link to={`/clubs/${event.organizerId?._id}`} className="ed-org-link">
                <div className="ed-org-avatar">{(event.organizerId?.organizerName || 'O')[0]}</div>
                <div>
                  <div className="ed-org-name">{event.organizerId?.organizerName}</div>
                  <div className="ed-org-cat">{event.organizerId?.category}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
