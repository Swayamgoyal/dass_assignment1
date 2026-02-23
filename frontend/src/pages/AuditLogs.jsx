import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { adminAPI } from '../services/api'
import './AuditLogs.css'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const res = await adminAPI.getAuditLogs()
      setLogs(res.data.data || [])
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false
    if (targetFilter && log.targetType !== targetFilter) return false
    return true
  })

  const uniqueActions = [...new Set(logs.map((l) => l.action).filter(Boolean))]
  const uniqueTargets = [...new Set(logs.map((l) => l.targetType).filter(Boolean))]

  return (
    <div className="page-wrapper">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Audit Logs</h1>
          <span className="badge">{logs.length} entries</span>
        </div>

        <div className="audit-filters">
          <select className="form-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="form-input" value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}>
            <option value="">All Targets</option>
            {uniqueTargets.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : (
          <div className="audit-list">
            {filtered.length === 0 ? (
              <div className="empty-state"><p>No audit logs found.</p></div>
            ) : (
              filtered.map((log) => (
                <div key={log._id} className="audit-item card">
                  <div className="audit-item-header">
                    <span className={`badge badge-${log.action?.includes('delete') || log.action?.includes('reject') ? 'danger' : log.action?.includes('create') || log.action?.includes('approve') ? 'success' : 'primary'}`}>
                      {log.action}
                    </span>
                    <span className="audit-time">{new Date(log.createdAt || log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="audit-item-body">
                    <span className="audit-target">{log.targetType}: <strong>{log.targetId}</strong></span>
                    {log.adminId && <span className="audit-admin">by {log.adminId.username || log.adminId.email || log.adminId}</span>}
                    {log.details && <span className="audit-details">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
