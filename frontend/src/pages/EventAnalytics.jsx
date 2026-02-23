import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import OrganizerNav from '../components/OrganizerNav'
import { organizerAPI } from '../services/api'
import './EventAnalytics.css'

export default function EventAnalytics() {
  const { eventId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalytics()
  }, [eventId])

  const loadAnalytics = async () => {
    try {
      const res = await organizerAPI.getEventAnalytics(eventId)
      setData(res.data.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          <div className="loading-page"><div className="spinner spinner-lg"></div><p>Loading analytics...</p></div>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="empty-state"><h3>No analytics data available</h3></div>
        </main>
      </div>
    )
  }

  const { eventInfo, overview, demographics, registrationTimeline, merchandiseBreakdown, teamCompletion } = data

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>Event Analytics</h1>
            <p className="analytics-event-name">{eventInfo?.eventName}</p>
          </div>
          <Link to={`/organizer/events/${eventId}/details`} className="btn btn-secondary">← Back to Event</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Overview Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-label">Total Registrations</div>
            <div className="stat-value">{overview?.totalRegistrations ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-label">Active</div>
            <div className="stat-value">{overview?.activeRegistrations ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Revenue</div>
            <div className="stat-value">₹{overview?.totalRevenue ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-label">Attendance</div>
            <div className="stat-value">{overview?.attendanceMarked ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Attendance Rate</div>
            <div className="stat-value">{overview?.attendanceRate != null ? `${overview.attendanceRate.toFixed(1)}%` : 'N/A'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-label">Fill Rate</div>
            <div className="stat-value">{overview?.fillRate != null ? `${overview.fillRate.toFixed(1)}%` : 'N/A'}</div>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Registration Breakdown */}
          <div className="card">
            <div className="card-header"><h3>Registration Breakdown</h3></div>
            <div className="breakdown-bars">
              <BreakdownBar label="Active" value={overview?.activeRegistrations || 0} total={overview?.totalRegistrations || 1} color="var(--success)" />
              <BreakdownBar label="Cancelled" value={overview?.cancelledRegistrations || 0} total={overview?.totalRegistrations || 1} color="var(--gray-400)" />
              <BreakdownBar label="Rejected" value={overview?.rejectedRegistrations || 0} total={overview?.totalRegistrations || 1} color="var(--danger)" />
            </div>
            <div className="detail-rows" style={{ marginTop: '1rem' }}>
              <div className="detail-row">
                <span className="detail-label">Avg Revenue / Registration</span>
                <span className="detail-value">₹{(overview?.avgRevenuePerRegistration ?? 0).toFixed(2)}</span>
              </div>
              {eventInfo?.eventType === 'Merchandise' && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Merch Purchases</span>
                    <span className="detail-value">{overview?.merchPurchaseCount ?? 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Merch Revenue</span>
                    <span className="detail-value">₹{overview?.merchRevenue ?? 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reg-Only Count</span>
                    <span className="detail-value">{overview?.merchRegOnlyCount ?? 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reg-Only Revenue</span>
                    <span className="detail-value">₹{overview?.regOnlyRevenue ?? 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Demographics */}
          <div className="card">
            <div className="card-header"><h3>Demographics</h3></div>
            <div className="demo-chart">
              <div className="demo-bar-container">
                <div className="demo-segment iiit" style={{ flex: demographics?.iiitParticipants || 0 }}>
                  {demographics?.iiitParticipants > 0 && <span>IIIT: {demographics.iiitParticipants}</span>}
                </div>
                <div className="demo-segment noniiit" style={{ flex: demographics?.nonIiitParticipants || 0 }}>
                  {demographics?.nonIiitParticipants > 0 && <span>Non-IIIT: {demographics.nonIiitParticipants}</span>}
                </div>
              </div>
              <div className="demo-legend">
                <span className="legend-item"><span className="legend-dot iiit"></span> IIIT ({demographics?.iiitParticipants ?? 0})</span>
                <span className="legend-item"><span className="legend-dot noniiit"></span> Non-IIIT ({demographics?.nonIiitParticipants ?? 0})</span>
              </div>
            </div>

            {/* Event Info */}
            <div className="detail-rows" style={{ marginTop: '1rem' }}>
              <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{eventInfo?.status}</span></div>
              <div className="detail-row"><span className="detail-label">Fee</span><span className="detail-value">{eventInfo?.registrationFee > 0 ? `₹${eventInfo.registrationFee}` : 'Free'}</span></div>
              <div className="detail-row"><span className="detail-label">Limit</span><span className="detail-value">{eventInfo?.registrationLimit || 'Unlimited'}</span></div>
            </div>
          </div>
        </div>

        {/* Registration Timeline */}
        {registrationTimeline && registrationTimeline.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header"><h3>Registration Timeline</h3></div>
            <div className="timeline-chart">
              {registrationTimeline.map((day, i) => {
                const maxCount = Math.max(...registrationTimeline.map((d) => d.count))
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                return (
                  <div key={i} className="timeline-bar-wrapper">
                    <div className="timeline-bar" style={{ height: `${Math.max(height, 4)}%` }}>
                      <span className="timeline-count">{day.count}</span>
                    </div>
                    <span className="timeline-date">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Merchandise Breakdown */}
        {merchandiseBreakdown && merchandiseBreakdown.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header"><h3>Merchandise Breakdown</h3></div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Size</th><th>Color</th><th>Sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {merchandiseBreakdown.map((item, i) => (
                    <tr key={i}>
                      <td>{item.size || '-'}</td>
                      <td>{item.color || '-'}</td>
                      <td>{item.count}</td>
                      <td>₹{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Team Completion */}
        {teamCompletion && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header"><h3>Team Completion</h3></div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">Total Teams</div><div className="stat-value">{teamCompletion.totalTeams}</div></div>
              <div className="stat-card"><div className="stat-label">Complete</div><div className="stat-value" style={{ color: 'var(--success)' }}>{teamCompletion.completeTeams}</div></div>
              <div className="stat-card"><div className="stat-label">Incomplete</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{teamCompletion.incompleteTeams}</div></div>
              <div className="stat-card"><div className="stat-label">Max Team Size</div><div className="stat-value">{teamCompletion.maxTeamSize}</div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function BreakdownBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="breakdown-row">
      <div className="breakdown-label">{label}</div>
      <div className="breakdown-track">
        <div className="breakdown-fill" style={{ width: `${pct}%`, background: color }}></div>
      </div>
      <div className="breakdown-count">{value}</div>
    </div>
  )
}
