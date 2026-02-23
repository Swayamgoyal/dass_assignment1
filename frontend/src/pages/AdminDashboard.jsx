import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard()
      setDashboard(res.data.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <AdminNav />
        <main className="page-content">
          <div className="loading-page">
            <div className="spinner spinner-lg"></div>
            <p>Loading dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-label">Total Clubs/Organizers</div>
            <div className="stat-value">{dashboard?.stats?.totalOrganizers ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{dashboard?.stats?.totalEvents ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-label">Total Participants</div>
            <div className="stat-value">{dashboard?.stats?.totalParticipants ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-label">Total Registrations</div>
            <div className="stat-value">{dashboard?.stats?.totalRegistrations ?? 0}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/admin/organizers/create" className="action-card">
              <span className="action-icon">➕</span>
              <span className="action-label">Create New Club/Organizer</span>
              <span className="action-desc">Add a new club or organizer account</span>
            </Link>
            <Link to="/admin/organizers" className="action-card">
              <span className="action-icon">🏢</span>
              <span className="action-label">Manage Clubs</span>
              <span className="action-desc">View, edit, or remove organizers</span>
            </Link>
            <Link to="/admin/password-resets" className="action-card">
              <span className="action-icon">🔑</span>
              <span className="action-label">Password Resets</span>
              <span className="action-desc">Handle organizer password requests</span>
            </Link>
          </div>
        </div>

        {/* Recent organizers */}
        {dashboard?.recentOrganizers && dashboard.recentOrganizers.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h3>Recent Organizers</h3>
              <Link to="/admin/organizers" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOrganizers.slice(0, 5).map((org) => (
                    <tr key={org._id}>
                      <td><strong>{org.organizerName || org.name}</strong></td>
                      <td>{org.category || '-'}</td>
                      <td>{org.contactEmail || org.email}</td>
                      <td>
                        <span className={`badge ${org.status === 'active' || org.isApproved ? 'badge-success' : org.status === 'suspended' ? 'badge-danger' : 'badge-warning'}`}>
                          {org.status || (org.isApproved ? 'Active' : 'Pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending password resets count */}
        {dashboard?.pendingPasswordResets > 0 && (
          <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
            ⚠️ You have <strong>{dashboard.pendingPasswordResets}</strong> pending password reset request(s).{' '}
            <Link to="/admin/password-resets">Review now</Link>
          </div>
        )}
      </main>
    </div>
  )
}
