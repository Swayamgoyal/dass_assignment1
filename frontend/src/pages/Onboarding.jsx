import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { updateUser } from '../redux/authSlice'
import { onboardingAPI } from '../services/api'
import './Onboarding.css'

export default function Onboarding() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({ areasOfInterest: [], organizers: [] })
  const [selectedInterests, setSelectedInterests] = useState([])
  const [selectedClubs, setSelectedClubs] = useState([])
  const [step, setStep] = useState(1)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await onboardingAPI.getData()
      setData(res.data.data || res.data)
    } catch {
      // continue
    } finally {
      setLoading(false)
    }
  }

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const toggleClub = (clubId) => {
    setSelectedClubs((prev) =>
      prev.includes(clubId) ? prev.filter((c) => c !== clubId) : [...prev, clubId]
    )
  }

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      const res = await onboardingAPI.complete({
        areasOfInterest: selectedInterests,
        followedClubs: selectedClubs,
      })
      if (res.data.user) dispatch(updateUser(res.data.user))
      navigate('/dashboard')
    } catch {
      // continue
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    try {
      const res = await onboardingAPI.skip()
      if (res.data.user) dispatch(updateUser(res.data.user))
    } catch {
      // ignore
    }
    navigate('/dashboard')
  }

  if (loading) {
    return <div className="onboarding-page"><div className="spinner spinner-lg"></div></div>
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome to Felicity! 🎉</h1>
          <p>Personalize your experience. You can always change these later.</p>
          <div className="onboarding-steps">
            <div className={`ob-step ${step >= 1 ? 'active' : ''}`}>1. Interests</div>
            <div className={`ob-step ${step >= 2 ? 'active' : ''}`}>2. Follow Clubs</div>
          </div>
        </div>

        {step === 1 && (
          <div className="onboarding-section">
            <h2>Select your interests</h2>
            <p className="ob-subtitle">Choose topics that interest you to get personalized event recommendations.</p>
            <div className="interest-grid">
              {data.areasOfInterest && data.areasOfInterest.length > 0 ? (
                data.areasOfInterest.map((cat) => (
                  <div key={cat.category} className="interest-category">
                    <h4>{cat.category}</h4>
                    <div className="interest-chips">
                      {cat.items.map((item) => (
                        <button
                          key={item}
                          className={`chip ${selectedInterests.includes(item) ? 'chip-active' : ''}`}
                          onClick={() => toggleInterest(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="interest-chips">
                  {['Technology', 'Music', 'Sports', 'Art', 'Gaming', 'Dance', 'Literature', 'Photography', 'Film', 'Quiz', 'Coding', 'Robotics'].map((item) => (
                    <button
                      key={item}
                      className={`chip ${selectedInterests.includes(item) ? 'chip-active' : ''}`}
                      onClick={() => toggleInterest(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="ob-actions">
              <button className="btn btn-secondary" onClick={handleSkip}>Skip for now</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-section">
            <h2>Follow Clubs & Organizers</h2>
            <p className="ob-subtitle">Follow organizers to get notified about their events.</p>
            <div className="clubs-grid">
              {data.organizers && data.organizers.length > 0 ? (
                data.organizers.map((org) => (
                  <div
                    key={org._id}
                    className={`club-card ${selectedClubs.includes(org._id) ? 'club-selected' : ''}`}
                    onClick={() => toggleClub(org._id)}
                  >
                    <div className="club-avatar">{(org.organizerName || 'C')[0]}</div>
                    <div className="club-info">
                      <span className="club-name">{org.organizerName}</span>
                      <span className="club-category">{org.category}</span>
                    </div>
                    <div className="club-check">{selectedClubs.includes(org._id) ? '✓' : '+'}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p>No organizers available yet.</p>
                </div>
              )}
            </div>
            <div className="ob-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={handleComplete} disabled={submitting}>
                {submitting ? 'Saving...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
