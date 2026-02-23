import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './ModerateEvents.css'

export default function ModerateEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [flagModal, setFlagModal] = useState(null)
  const [flagReason, setFlagReason] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const res = await adminAPI.getAllEvents()
      setEvents(res.data.data || [])
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const handleFlag = async () => {
    if (!flagModal) return
    try {
      await adminAPI.flagEvent(flagModal._id, { reason: flagReason })
      setMsg({ type: 'success', text: `"${flagModal.eventName}" flagged` })
      setFlagModal(null)
      setFlagReason('')
      loadEvents()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to flag' })
    }
  }

  const handleUnflag = async (event) => {
    try {
      await adminAPI.unflagEvent(event._id)
      setMsg({ type: 'success', text: `"${event.eventName}" unflagged` })
      loadEvents()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to unflag' })
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    try {
      await adminAPI.deleteEvent(deleteModal._id)
      setMsg({ type: 'success', text: `"${deleteModal.eventName}" deleted` })
      setDeleteModal(null)
      loadEvents()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    }
  }

  const filtered = events.filter((e) => {
    if (search) {
      const s = search.toLowerCase()
      if (!e.eventName?.toLowerCase().includes(s) && !e.organizerId?.organizerName?.toLowerCase().includes(s)) return false
    }
    if (statusFilter && e.status !== statusFilter) return false
    if (typeFilter && e.eventType !== typeFilter) return false
    if (flaggedOnly && !e.flagged) return false
    return true
  })

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Moderate Events</h1>
          <span className="badge">{events.length} total</span>
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="mod-controls">
          <div className="search-bar">
            <input type="text" placeholder="Search events or organizers..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mod-filters">
            <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
            <select className="form-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="Normal">Normal</option>
              <option value="Merchandise">Merchandise</option>
            </select>
            <label className="toggle-label">
              <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
              <span>Flagged only</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Flagged</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No events found</td></tr>
                ) : (
                  filtered.map((event) => (
                    <tr key={event._id} className={event.flagged ? 'row-flagged' : ''}>
                      <td className="event-name-cell">{event.eventName}</td>
                      <td>{event.organizerId?.organizerName || '-'}</td>
                      <td><span className="badge">{event.eventType}</span></td>
                      <td>
                        <span className={`badge badge-${event.status === 'Published' || event.status === 'Ongoing' ? 'success' : event.status === 'Draft' ? 'warning' : 'default'}`}>
                          {event.status}
                        </span>
                      </td>
                      <td>
                        {event.flagged ? <span className="badge badge-danger">🚩 Flagged</span> : <span className="badge">Clean</span>}
                      </td>
                      <td>{new Date(event.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-btns">
                          {event.flagged ? (
                            <button className="btn btn-success btn-sm" onClick={() => handleUnflag(event)}>Unflag</button>
                          ) : (
                            <button className="btn btn-warning btn-sm" onClick={() => setFlagModal(event)}>Flag</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(event)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Flag Modal */}
        {flagModal && (
          <div className="modal-overlay" onClick={() => setFlagModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>Flag Event</h3></div>
              <p>Flag "{flagModal.eventName}" for moderation?</p>
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>Reason (optional)</label>
                <textarea className="form-input" rows={2} value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setFlagModal(null)}>Cancel</button>
                <button className="btn btn-warning" onClick={handleFlag}>Flag Event</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModal && (
          <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>Delete Event</h3></div>
              <p>Permanently delete "{deleteModal.eventName}"? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
