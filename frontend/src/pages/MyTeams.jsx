import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { teamAPI } from '../services/api'
import './MyTeams.css'

export default function MyTeams() {
  const [searchParams] = useSearchParams()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Create team
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ eventId: '', teamName: '', teamSize: 2 })

  // Join team
  const [showJoin, setShowJoin] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  // Team detail modal
  const [selectedTeam, setSelectedTeam] = useState(null)

  useEffect(() => {
    loadTeams()
    
    // Auto-fill event ID from URL params
    const eventIdParam = searchParams.get('eventId')
    if (eventIdParam) {
      setCreateForm(prev => ({ ...prev, eventId: eventIdParam }))
      setShowCreate(true)
    }
  }, [searchParams])

  const loadTeams = async () => {
    try {
      const res = await teamAPI.getMyTeams()
      setTeams(res.data.data || [])
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setMsg({ type: '', text: '' })
    if (!createForm.eventId.trim() || !createForm.teamName.trim()) {
      setMsg({ type: 'error', text: 'Event ID and team name are required' })
      return
    }
    try {
      await teamAPI.create(createForm)
      setMsg({ type: 'success', text: 'Team created!' })
      setShowCreate(false)
      setCreateForm({ eventId: '', teamName: '', teamSize: 2 })
      loadTeams()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create team' })
    }
  }

  const handleJoin = async () => {
    setMsg({ type: '', text: '' })
    if (!inviteCode.trim()) {
      setMsg({ type: 'error', text: 'Please enter an invite code' })
      return
    }
    try {
      await teamAPI.join(inviteCode.trim())
      setMsg({ type: 'success', text: 'Joined team successfully!' })
      setShowJoin(false)
      setInviteCode('')
      loadTeams()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to join team' })
    }
  }

  const handleLeave = async (teamId) => {
    if (!confirm('Are you sure you want to leave this team?')) return
    try {
      await teamAPI.leave(teamId)
      setMsg({ type: 'success', text: 'Left team' })
      setSelectedTeam(null)
      loadTeams()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to leave team' })
    }
  }

  const handleDelete = async (teamId) => {
    if (!confirm('Delete this team? This cannot be undone.')) return
    try {
      await teamAPI.delete(teamId)
      setMsg({ type: 'success', text: 'Team deleted' })
      setSelectedTeam(null)
      loadTeams()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete team' })
    }
  }

  const viewTeamDetails = async (teamId) => {
    try {
      const res = await teamAPI.getDetails(teamId)
      setSelectedTeam(res.data.data || null)
    } catch {
      setMsg({ type: 'error', text: 'Failed to load team details' })
    }
  }

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <div className="page-header">
          <h1>My Teams</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>+ Create Team</button>
            <button className="btn btn-secondary" onClick={() => setShowJoin(!showJoin)}>🔗 Join Team</button>
          </div>
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* Create Team Form */}
        {showCreate && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><h3>Create New Team</h3></div>
            <div className="form-grid">
              <div className="form-group">
                <label>Event ID</label>
                <input type="text" className="form-input" placeholder="Paste the team event ID" value={createForm.eventId} onChange={(e) => setCreateForm({ ...createForm, eventId: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Team Name</label>
                <input type="text" className="form-input" placeholder="Your team name" value={createForm.teamName} onChange={(e) => setCreateForm({ ...createForm, teamName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Team Size</label>
                <input type="number" className="form-input" min={2} max={10} value={createForm.teamSize} onChange={(e) => setCreateForm({ ...createForm, teamSize: parseInt(e.target.value) || 2 })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Join Team Form */}
        {showJoin && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><h3>Join Team</h3></div>
            <div className="form-group">
              <label>Invite Code</label>
              <input type="text" className="form-input" placeholder="Enter invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleJoin}>Join</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowJoin(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Teams List */}
        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No teams yet</h3>
            <p>Create a team for team events or join one using an invite code.</p>
          </div>
        ) : (
          <div className="teams-grid">
            {teams.map((team) => {
              const accepted = (team.members || []).filter((m) => m.status === 'accepted')
              return (
                <div key={team._id} className="team-card card" onClick={() => viewTeamDetails(team._id)}>
                  <div className="team-card-header">
                    <h3>{team.teamName}</h3>
                    <span className={`badge badge-${team.registrationStatus === 'complete' ? 'success' : 'warning'}`}>
                      {team.registrationStatus === 'complete' ? 'Complete' : 'Forming'}
                    </span>
                  </div>
                  <p className="team-event">{team.eventId?.eventName || 'Unknown Event'}</p>
                  <div className="team-meta">
                    <span>👥 {accepted.length}/{team.teamSize} members</span>
                    <span>📋 {team.inviteCode}</span>
                  </div>
                  {team.eventId?.eventStartDate && (
                    <span className="team-date">Event: {new Date(team.eventId.eventStartDate).toLocaleDateString()}</span>
                  )}
                  <Link to={`/team-chat/${team._id}`} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    💬 Team Chat
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* Team Detail Modal */}
        {selectedTeam && (
          <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>{selectedTeam.teamName}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTeam(null)}>✕</button>
              </div>

              <div className="detail-rows">
                <div className="detail-row">
                  <span className="detail-label">Event</span>
                  <span className="detail-value">{selectedTeam.eventId?.eventName || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`badge badge-${selectedTeam.registrationStatus === 'complete' ? 'success' : 'warning'}`}>
                      {selectedTeam.registrationStatus === 'complete' ? 'Complete' : 'Forming'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Invite Code</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedTeam.inviteCode}
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => { navigator.clipboard.writeText(selectedTeam.inviteCode); setMsg({ type: 'success', text: 'Invite code copied!' }) }}>Copy</button>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Leader</span>
                  <span className="detail-value">{selectedTeam.teamLeaderId?.firstName} {selectedTeam.teamLeaderId?.lastName}</span>
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem' }}>Members ({(selectedTeam.members || []).filter((m) => m.status === 'accepted').length}/{selectedTeam.teamSize})</h4>
              <div className="team-members-list">
                {(selectedTeam.members || []).map((m, i) => (
                  <div key={i} className="team-member-row">
                    <div className="team-member-info">
                      <span className="team-member-name">{m.participantId?.firstName} {m.participantId?.lastName}</span>
                      <span className="team-member-email">{m.participantId?.email}</span>
                    </div>
                    <span className={`badge badge-${m.status === 'accepted' ? 'success' : 'warning'} badge-sm`}>{m.status}</span>
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <Link to={`/team-chat/${selectedTeam._id}`} className="btn btn-primary btn-sm">💬 Team Chat</Link>
                <button className="btn btn-warning btn-sm" onClick={() => handleLeave(selectedTeam._id)}>Leave Team</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedTeam._id)}>Delete Team</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
