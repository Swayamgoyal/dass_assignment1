import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { onboardingAPI, participantAPI } from '../services/api'
import './Clubs.css'

export default function Clubs() {
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [followedIds, setFollowedIds] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [orgRes, profileRes] = await Promise.all([
        onboardingAPI.getData().catch(() => ({ data: { data: { organizers: [] } } })),
        participantAPI.getProfile().catch(() => ({ data: { data: {} } })),
      ])
      const allOrgs = orgRes.data.data?.organizers || orgRes.data.organizers || []
      setOrganizers(allOrgs)
      const profile = profileRes.data.data || profileRes.data || {}
      setFollowedIds((profile.followedClubs || []).map((c) => c._id || c))
    } catch {
      // handle
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (orgId) => {
    try {
      const res = await participantAPI.toggleFollow(orgId)
      const data = res.data.data || res.data
      setFollowedIds((data.followedClubs || []).map((c) => c._id || c))
    } catch {
      // ignore
    }
  }

  const filtered = organizers.filter((o) =>
    o.organizerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <div className="page-header">
          <h1>Clubs & Organizers</h1>
        </div>

        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <input type="text" placeholder="Search clubs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No clubs found</h3>
          </div>
        ) : (
          <div className="clubs-grid">
            {filtered.map((org) => (
              <div key={org._id} className="club-list-card card">
                <div className="club-list-header">
                  <div className="club-list-avatar">{(org.organizerName || 'C')[0]}</div>
                  <div className="club-list-info">
                    <Link to={`/clubs/${org._id}`} className="club-list-name">{org.organizerName}</Link>
                    <span className="club-list-category">{org.category}</span>
                  </div>
                </div>
                <p className="club-list-desc">{org.description?.substring(0, 100) || 'No description'}...</p>
                <div className="club-list-footer">
                  <Link to={`/clubs/${org._id}`} className="btn btn-secondary btn-sm">View</Link>
                  <button
                    className={`btn btn-sm ${followedIds.includes(org._id) ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleFollow(org._id)}
                  >
                    {followedIds.includes(org._id) ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
