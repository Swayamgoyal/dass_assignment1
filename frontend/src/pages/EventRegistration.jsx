import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ParticipantNav from '../components/ParticipantNav'
import { publicEventAPI, registrationAPI } from '../services/api'
import './EventRegistration.css'

export default function EventRegistration() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null) // { ticketId, registration }

  // Normal form responses
  const [formResponses, setFormResponses] = useState({})

  // Merchandise
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [registrationOnly, setRegistrationOnly] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await publicEventAPI.getDetails(eventId)
      setEvent(res.data.data || res.data)
    } catch {
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (fieldId, value) => {
    setFormResponses((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = { eventId }

      if (event.eventType === 'Normal') {
        // Build form responses object keyed by fieldId
        payload.formResponses = {}
        if (event.customForm?.length > 0) {
          event.customForm.forEach((field) => {
            payload.formResponses[field.fieldId] = formResponses[field.fieldId] || ''
          })
          // Validate required fields
          for (const field of event.customForm) {
            if (field.isRequired && !formResponses[field.fieldId]) {
              setError(`"${field.fieldLabel}" is required`)
              setSubmitting(false)
              return
            }
          }
        }
      } else if (event.eventType === 'Merchandise') {
        if (registrationOnly) {
          payload.registrationOnly = true
        } else {
          if (!selectedVariant) {
            setError('Please select a merchandise variant')
            setSubmitting(false)
            return
          }
          payload.merchandiseVariant = {
            variantId: selectedVariant.variantId,
            size: selectedVariant.size,
            color: selectedVariant.color,
            price: selectedVariant.price,
            quantity,
          }
        }
      }

      const res = await registrationAPI.register(payload)
      const data = res.data.data || res.data
      setSuccess({ ticketId: data.ticketId || res.data.ticketId, registration: data.registration || data })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content"><div className="loading-page"><div className="spinner spinner-lg"></div></div></main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="page-wrapper">
        <ParticipantNav />
        <main className="page-content">
          <div className="reg-success-card card">
            <div className="reg-success-icon">✅</div>
            <h2>Registration Successful!</h2>
            <p>You have been registered for <strong>{event?.eventName}</strong></p>
            {success.ticketId && (
              <div className="reg-ticket-box">
                <span className="reg-ticket-label">Your Ticket ID</span>
                <span className="reg-ticket-id">{success.ticketId}</span>
              </div>
            )}
            <div className="reg-success-actions">
              {success.ticketId && (
                <Link to={`/ticket/${success.ticketId}`} className="btn btn-primary">View Ticket</Link>
              )}
              <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <ParticipantNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>{event?.eventType === 'Merchandise' ? 'Purchase / Register' : 'Register for Event'}</h1>
            <p className="reg-event-name">{event?.eventName}</p>
          </div>
          <Link to={`/events/${eventId}`} className="btn btn-secondary">← Back</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="reg-layout">
          <div className="reg-form-area">
            {/* Normal Event - Custom Form */}
            {event?.eventType === 'Normal' && (
              <div className="card">
                <div className="card-header"><h3>Registration Form</h3></div>
                {event.customForm?.length > 0 ? (
                  <div className="reg-fields">
                    {event.customForm.map((field, i) => (
                      <div key={i} className="form-group">
                        <label>
                          {field.fieldLabel}
                          {field.isRequired && <span className="req-star"> *</span>}
                        </label>
                        {renderFormField(field, formResponses[field.fieldId] || '', (val) => handleFormChange(field.fieldId, val))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="reg-no-form">No additional information required. Click register to proceed.</p>
                )}
              </div>
            )}

            {/* Merchandise Event */}
            {event?.eventType === 'Merchandise' && (
              <div className="card">
                <div className="card-header"><h3>Select Merchandise</h3></div>

                {event.merchandiseDetails?.allowRegistrationOnly && (
                  <div className="reg-only-toggle">
                    <label className="toggle-label">
                      <input type="checkbox" checked={registrationOnly} onChange={(e) => setRegistrationOnly(e.target.checked)} />
                      <span>Register only (without merchandise) — ₹{event.merchandiseDetails.registrationOnlyFee || event.registrationFee || 0}</span>
                    </label>
                  </div>
                )}

                {!registrationOnly && (
                  <>
                    <div className="variant-grid">
                      {event.merchandiseDetails?.variants?.map((v, i) => (
                        <div
                          key={i}
                          className={`variant-card ${selectedVariant === v ? 'variant-selected' : ''} ${v.stock <= 0 ? 'variant-oos' : ''}`}
                          onClick={() => v.stock > 0 && setSelectedVariant(v)}
                        >
                          <div className="variant-size">{v.size || '-'}</div>
                          <div className="variant-color">{v.color || '-'}</div>
                          <div className="variant-price">₹{v.price}</div>
                          <div className="variant-stock">
                            {v.stock > 0 ? `${v.stock} left` : 'Out of stock'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedVariant && (
                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Quantity (max {event.merchandiseDetails?.purchaseLimit || 5})</label>
                        <input
                          type="number"
                          className="form-input"
                          min={1}
                          max={event.merchandiseDetails?.purchaseLimit || 5}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, event.merchandiseDetails?.purchaseLimit || 5)))}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="reg-summary">
            <div className="card">
              <div className="card-header"><h3>Summary</h3></div>
              <div className="detail-rows">
                <div className="detail-row"><span className="detail-label">Event</span><span className="detail-value">{event?.eventName}</span></div>
                <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value">{event?.eventType}</span></div>
                {event?.eventType === 'Merchandise' && !registrationOnly && selectedVariant && (
                  <>
                    <div className="detail-row"><span className="detail-label">Variant</span><span className="detail-value">{selectedVariant.size} / {selectedVariant.color}</span></div>
                    <div className="detail-row"><span className="detail-label">Qty</span><span className="detail-value">{quantity}</span></div>
                    <div className="detail-row"><span className="detail-label">Total</span><span className="detail-value" style={{ fontWeight: 700 }}>₹{selectedVariant.price * quantity}</span></div>
                  </>
                )}
                {event?.eventType === 'Merchandise' && registrationOnly && (
                  <div className="detail-row"><span className="detail-label">Total</span><span className="detail-value" style={{ fontWeight: 700 }}>₹{event.merchandiseDetails?.registrationOnlyFee || event.registrationFee || 0}</span></div>
                )}
                {event?.eventType === 'Normal' && (
                  <div className="detail-row"><span className="detail-label">Fee</span><span className="detail-value" style={{ fontWeight: 700 }}>{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span></div>
                )}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : event?.eventType === 'Merchandise' && !registrationOnly ? 'Purchase' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function renderFormField(field, value, onChange) {
  switch (field.fieldType) {
    case 'text':
      return <input type="text" className="form-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.fieldPlaceholder || ''} />
    case 'textarea':
      return <textarea className="form-input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.fieldPlaceholder || ''} />
    case 'number':
      return <input type="number" className="form-input" value={value} onChange={(e) => onChange(e.target.value)} />
    case 'email':
      return <input type="email" className="form-input" value={value} onChange={(e) => onChange(e.target.value)} />
    case 'phone':
      return <input type="tel" className="form-input" value={value} onChange={(e) => onChange(e.target.value)} />
    case 'dropdown':
      return (
        <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    case 'checkbox':
      return (
        <label className="toggle-label">
          <input type="checkbox" checked={value === 'true' || value === true} onChange={(e) => onChange(e.target.checked.toString())} />
          <span>{field.fieldPlaceholder || field.fieldLabel}</span>
        </label>
      )
    case 'file':
      return <input type="file" className="form-input" onChange={(e) => onChange(e.target.files[0]?.name || '')} />
    default:
      return <input type="text" className="form-input" value={value} onChange={(e) => onChange(e.target.value)} />
  }
}
