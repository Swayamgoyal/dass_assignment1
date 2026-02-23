import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './ManageOrganizers.css'

export default function ManageOrganizers() {
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchOrganizers()
  }, [])

  const fetchOrganizers = async () => {
    try {
      const res = await adminAPI.getOrganizers()
      setOrganizers(res.data.data || res.data.organizers || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organizers')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (id) => {
    setActionLoading(id)
    try {
      await adminAPI.suspendOrganizer(id)
      await fetchOrganizers()
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async (id) => {
    setActionLoading(id)
    try {
      await adminAPI.unsuspendOrganizer(id)
      await fetchOrganizers()
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id) => {
    setActionLoading(id)
    try {
      await adminAPI.deleteOrganizer(id)
      setDeleteConfirm(null)
      await fetchOrganizers()
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatus = (org) => {
    if (org.status) return org.status.toLowerCase()
    if (org.isSuspended) return 'suspended'
    if (org.isApproved) return 'active'
    return 'pending'
  }

  const filtered = organizers.filter((org) => {
    const name = (org.organizerName || org.name || '').toLowerCase()
    const email = (org.contactEmail || org.email || '').toLowerCase()
    const category = (org.category || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || category.includes(search.toLowerCase())

    if (filter === 'all') return matchSearch
    return matchSearch && getStatus(org) === filter
  })

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Manage Clubs / Organizers</h1>
          <Link to="/admin/organizers/create" className="btn btn-primary">
            ➕ Add New Organizer
          </Link>
        </div>

        {error && <div className="alert alert-error">{error} <button className="alert-dismiss" onClick={() => setError('')}>✕</button></div>}

        {/* Filters row */}
        <div className="filters-row">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {['all', 'active', 'suspended', 'pending'].map((f) => (
              <button
                key={f}
                className={`tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="tab-count">
                    {organizers.filter((o) => f === 'all' || getStatus(o) === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner spinner-lg"></div>
            <p>Loading organizers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No organizers found</h3>
            <p>{search ? 'Try adjusting your search' : 'Add your first organizer to get started'}</p>
            {!search && (
              <Link to="/admin/organizers/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                ➕ Create Organizer
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organizer Name</th>
                  <th>Category</th>
                  <th>Contact Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => {
                  const status = getStatus(org)
                  return (
                    <tr key={org._id}>
                      <td>
                        <div className="org-name-cell">
                          <strong>{org.organizerName || org.name}</strong>
                          {org.description && (
                            <span className="org-desc-preview">{org.description.substring(0, 60)}{org.description.length > 60 ? '...' : ''}</span>
                          )}
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{org.category || '-'}</span></td>
                      <td>{org.contactEmail || org.email}</td>
                      <td>
                        <span className={`badge ${status === 'active' ? 'badge-success' : status === 'suspended' ? 'badge-danger' : 'badge-warning'}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          {status === 'active' && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleSuspend(org._id)}
                              disabled={actionLoading === org._id}
                            >
                              Suspend
                            </button>
                          )}
                          {status === 'suspended' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUnsuspend(org._id)}
                              disabled={actionLoading === org._id}
                            >
                              Unsuspend
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteConfirm(org._id)}
                            disabled={actionLoading === org._id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Deletion</h2>
                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this organizer? This action cannot be undone. All associated events and data will be affected.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={actionLoading === deleteConfirm}
                >
                  {actionLoading === deleteConfirm ? 'Deleting...' : 'Delete Organizer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
