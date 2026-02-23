import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './SystemAnalytics.css'

export default function SystemAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const res = await adminAPI.getSystemAnalytics()
      setData(res.data.data || res.data)
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <AdminNav />
        <main className="page-content"><div className="loading-page"><div className="spinner spinner-lg"></div></div></main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-wrapper">
        <AdminNav />
        <main className="page-content"><div className="empty-state"><h3>No analytics data</h3></div></main>
      </div>
    )
  }

  const { userGrowth, eventTrends, revenueTrend, topPerformers } = data

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>System Analytics</h1>
        </div>

        <div className="sa-grid">
          {/* User Growth */}
          <div className="card">
            <div className="card-header"><h3>User Growth</h3></div>
            {userGrowth?.participants?.length > 0 ? (
              <div className="sa-bar-chart">
                {userGrowth.participants.map((p, i) => (
                  <div key={i} className="sa-bar-group">
                    <div className="sa-bar-label">{p._id || p.month || `Month ${i + 1}`}</div>
                    <div className="sa-bar-row">
                      <div className="sa-mini-bar" style={{ width: `${Math.min(100, (p.count / Math.max(...userGrowth.participants.map((x) => x.count))) * 100)}%`, background: 'var(--primary)' }}></div>
                      <span>{p.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sa-empty">No data yet</p>
            )}
          </div>

          {/* Event Trends by Category */}
          <div className="card">
            <div className="card-header"><h3>Events by Category</h3></div>
            {eventTrends?.byCategory?.length > 0 ? (
              <div className="sa-bar-chart">
                {eventTrends.byCategory.map((cat, i) => (
                  <div key={i} className="sa-bar-group">
                    <div className="sa-bar-label">{cat._id || 'Unknown'}</div>
                    <div className="sa-bar-row">
                      <div className="sa-mini-bar" style={{ width: `${Math.min(100, (cat.count / Math.max(...eventTrends.byCategory.map((x) => x.count))) * 100)}%`, background: 'var(--accent)' }}></div>
                      <span>{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sa-empty">No data yet</p>
            )}
          </div>

          {/* Revenue Trend */}
          <div className="card">
            <div className="card-header"><h3>Revenue Trend</h3></div>
            {revenueTrend?.length > 0 ? (
              <div className="sa-bar-chart">
                {revenueTrend.map((r, i) => (
                  <div key={i} className="sa-bar-group">
                    <div className="sa-bar-label">{r._id || r.month || `Period ${i + 1}`}</div>
                    <div className="sa-bar-row">
                      <div className="sa-mini-bar" style={{ width: `${Math.min(100, (r.revenue / Math.max(...revenueTrend.map((x) => x.revenue || 1))) * 100)}%`, background: 'var(--success)' }}></div>
                      <span>₹{r.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sa-empty">No revenue data</p>
            )}
          </div>

          {/* Events by Month */}
          <div className="card">
            <div className="card-header"><h3>Events by Month</h3></div>
            {eventTrends?.byMonth?.length > 0 ? (
              <div className="sa-bar-chart">
                {eventTrends.byMonth.map((m, i) => (
                  <div key={i} className="sa-bar-group">
                    <div className="sa-bar-label">{m._id || `Month ${i + 1}`}</div>
                    <div className="sa-bar-row">
                      <div className="sa-mini-bar" style={{ width: `${Math.min(100, (m.count / Math.max(...eventTrends.byMonth.map((x) => x.count))) * 100)}%`, background: 'var(--warning)' }}></div>
                      <span>{m.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sa-empty">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="sa-performers">
          <div className="card">
            <div className="card-header"><h3>Top Events</h3></div>
            {topPerformers?.events?.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Event</th><th>Registrations</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {topPerformers.events.map((e, i) => (
                      <tr key={i}>
                        <td>{e.eventName || e._id}</td>
                        <td>{e.currentRegistrations || e.registrations || e.count || 0}</td>
                        <td>₹{e.revenue || e.total || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sa-empty">No data</p>
            )}
          </div>

          <div className="card">
            <div className="card-header"><h3>Top Organizers</h3></div>
            {topPerformers?.organizers?.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Organizer</th><th>Events</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {topPerformers.organizers.map((o, i) => (
                      <tr key={i}>
                        <td>{o.organizer?.organizerName || o.organizerName || o._id}</td>
                        <td>{o.eventCount || o.count || 0}</td>
                        <td>₹{o.totalRevenue || o.revenue || o.total || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sa-empty">No data</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
