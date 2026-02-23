import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import OrganizerNav from '../components/OrganizerNav'
import { eventAPI } from '../services/api'
import './CreateEvent.css'

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
]

const EMPTY_VARIANT = { size: '', color: '', stock: '', price: '' }

const EMPTY_FORM_FIELD = {
  fieldType: 'text',
  fieldLabel: '',
  fieldPlaceholder: '',
  isRequired: false,
  options: [],
}

export default function CreateEvent() {
  const { eventId } = useParams()
  const isEdit = !!eventId
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: basic, 2: details, 3: form/merch, 4: review
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [existingStatus, setExistingStatus] = useState(null)
  const [formLocked, setFormLocked] = useState(false)

  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    eventType: 'Normal',
    eligibility: '',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationLimit: '',
    registrationFee: '',
    eventTags: [],
    isTeamEvent: false,
    maxTeamSize: 2,
  })

  const [customForm, setCustomForm] = useState([])
  const [merchandiseDetails, setMerchandiseDetails] = useState({
    itemName: '',
    variants: [{ ...EMPTY_VARIANT }],
    purchaseLimitPerParticipant: 1,
    allowRegistrationOnly: false,
    registrationOnlyFee: '',
  })

  // Load existing event for edit mode
  useEffect(() => {
    if (isEdit) {
      loadEvent()
    }
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await eventAPI.getById(eventId)
      const ev = res.data.data || res.data
      setExistingStatus(ev.status)
      setFormLocked(ev.formLocked || false)

      setFormData({
        eventName: ev.eventName || '',
        eventDescription: ev.eventDescription || '',
        eventType: ev.eventType || 'Normal',
        eligibility: ev.eligibility || '',
        registrationDeadline: ev.registrationDeadline ? ev.registrationDeadline.slice(0, 16) : '',
        eventStartDate: ev.eventStartDate ? ev.eventStartDate.slice(0, 16) : '',
        eventEndDate: ev.eventEndDate ? ev.eventEndDate.slice(0, 16) : '',
        registrationLimit: ev.registrationLimit ?? '',
        registrationFee: ev.registrationFee ?? '',
        eventTags: ev.eventTags || [],
        isTeamEvent: ev.isTeamEvent || false,
        maxTeamSize: ev.maxTeamSize || 2,
      })

      if (ev.customForm && ev.customForm.length > 0) {
        setCustomForm(ev.customForm)
      }

      if (ev.merchandiseDetails) {
        setMerchandiseDetails({
          itemName: ev.merchandiseDetails.itemName || '',
          variants: ev.merchandiseDetails.variants?.length > 0 ? ev.merchandiseDetails.variants : [{ ...EMPTY_VARIANT }],
          purchaseLimitPerParticipant: ev.merchandiseDetails.purchaseLimitPerParticipant || 1,
          allowRegistrationOnly: ev.merchandiseDetails.allowRegistrationOnly || false,
          registrationOnlyFee: ev.merchandiseDetails.registrationOnlyFee || '',
        })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // ===== Custom Form Builder =====
  const addFormField = () => {
    setCustomForm((prev) => [
      ...prev,
      { ...EMPTY_FORM_FIELD, fieldId: `field_${Date.now()}`, order: prev.length },
    ])
  }

  const updateFormField = (index, key, value) => {
    setCustomForm((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [key]: value }
      return updated
    })
  }

  const removeFormField = (index) => {
    setCustomForm((prev) => prev.filter((_, i) => i !== index))
  }

  const moveFormField = (index, direction) => {
    setCustomForm((prev) => {
      const updated = [...prev]
      const target = index + direction
      if (target < 0 || target >= updated.length) return prev
      ;[updated[index], updated[target]] = [updated[target], updated[index]]
      return updated.map((f, i) => ({ ...f, order: i }))
    })
  }

  // ===== Merchandise Variants =====
  const addVariant = () => {
    setMerchandiseDetails((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...EMPTY_VARIANT, variantId: `var_${Date.now()}` }],
    }))
  }

  const updateVariant = (index, key, value) => {
    setMerchandiseDetails((prev) => {
      const variants = [...prev.variants]
      variants[index] = { ...variants[index], [key]: value }
      return { ...prev, variants }
    })
  }

  const removeVariant = (index) => {
    setMerchandiseDetails((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  // ===== Submit =====
  const validate = () => {
    if (!formData.eventName.trim()) return 'Event name is required'
    if (!formData.eventDescription.trim()) return 'Event description is required'
    if (!formData.eligibility.trim()) return 'Eligibility is required'
    if (!formData.registrationDeadline) return 'Registration deadline is required'
    if (!formData.eventStartDate) return 'Start date is required'
    if (!formData.eventEndDate) return 'End date is required'
    if (new Date(formData.eventEndDate) <= new Date(formData.eventStartDate)) return 'End date must be after start date'
    if (formData.eventType === 'Merchandise') {
      if (!merchandiseDetails.itemName.trim()) return 'Merchandise item name is required'
      if (merchandiseDetails.variants.length === 0) return 'At least one variant is required'
      for (const v of merchandiseDetails.variants) {
        if (!v.price || v.price <= 0) return 'All variants must have a positive price'
        if (!v.stock || v.stock <= 0) return 'All variants must have positive stock'
      }
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        eventName: formData.eventName.trim(),
        eventDescription: formData.eventDescription.trim(),
        eventType: formData.eventType,
        eligibility: formData.eligibility.trim(),
        registrationDeadline: formData.registrationDeadline,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        registrationLimit: formData.registrationLimit ? Number(formData.registrationLimit) : null,
        registrationFee: formData.registrationFee ? Number(formData.registrationFee) : 0,
        eventTags: formData.eventTags,
        isTeamEvent: formData.isTeamEvent,
        maxTeamSize: formData.isTeamEvent ? Number(formData.maxTeamSize) : 1,
      }

      if (customForm.length > 0 && !formLocked) {
        payload.customForm = customForm.map((f, i) => ({
          ...f,
          fieldId: f.fieldId || `field_${i}`,
          order: i,
        }))
      }

      if (formData.eventType === 'Merchandise') {
        payload.merchandiseDetails = {
          itemName: merchandiseDetails.itemName.trim(),
          variants: merchandiseDetails.variants.map((v, i) => ({
            variantId: v.variantId || `var_${i}`,
            size: v.size,
            color: v.color,
            stock: Number(v.stock),
            price: Number(v.price),
          })),
          purchaseLimitPerParticipant: Number(merchandiseDetails.purchaseLimitPerParticipant) || 1,
          allowRegistrationOnly: merchandiseDetails.allowRegistrationOnly,
          registrationOnlyFee: merchandiseDetails.allowRegistrationOnly ? Number(merchandiseDetails.registrationOnlyFee) : 0,
        }
      }

      if (isEdit) {
        // For published events, only send allowed fields
        if (isPublished) {
          const allowedPayload = {
            eventDescription: payload.eventDescription,
            eventTags: payload.eventTags,
            registrationDeadline: payload.registrationDeadline,
            registrationLimit: payload.registrationLimit,
            eventEndDate: payload.eventEndDate,
          }
          // Allow merchandise stock/price updates
          if (payload.merchandiseDetails) {
            allowedPayload.merchandiseDetails = payload.merchandiseDetails
          }
          await eventAPI.update(eventId, allowedPayload)
        } else {
          await eventAPI.update(eventId, payload)
        }
      } else {
        await eventAPI.create(payload)
      }

      navigate('/organizer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!eventId) return
    setLoading(true)
    try {
      await eventAPI.publish(eventId)
      navigate('/organizer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish event')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndPublish = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        eventName: formData.eventName.trim(),
        eventDescription: formData.eventDescription.trim(),
        eventType: formData.eventType,
        eligibility: formData.eligibility.trim(),
        registrationDeadline: formData.registrationDeadline,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        registrationLimit: formData.registrationLimit ? Number(formData.registrationLimit) : null,
        registrationFee: formData.registrationFee ? Number(formData.registrationFee) : 0,
        eventTags: formData.eventTags,
        isTeamEvent: formData.isTeamEvent,
        maxTeamSize: formData.isTeamEvent ? Number(formData.maxTeamSize) : 1,
      }
      if (customForm.length > 0) {
        payload.customForm = customForm.map((f, i) => ({ ...f, fieldId: f.fieldId || `field_${i}`, order: i }))
      }
      if (formData.eventType === 'Merchandise') {
        payload.merchandiseDetails = {
          itemName: merchandiseDetails.itemName.trim(),
          variants: merchandiseDetails.variants.map((v, i) => ({
            variantId: v.variantId || `var_${i}`, size: v.size, color: v.color, stock: Number(v.stock), price: Number(v.price),
          })),
          purchaseLimitPerParticipant: Number(merchandiseDetails.purchaseLimitPerParticipant) || 1,
          allowRegistrationOnly: merchandiseDetails.allowRegistrationOnly,
          registrationOnlyFee: merchandiseDetails.allowRegistrationOnly ? Number(merchandiseDetails.registrationOnlyFee) : 0,
        }
      }
      // Create then publish
      const createRes = await eventAPI.create(payload)
      const newId = createRes.data.data?._id || createRes.data.event?._id || createRes.data._id
      await eventAPI.publish(newId)
      navigate('/organizer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save & publish event')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          <div className="loading-page"><div className="spinner spinner-lg"></div><p>Loading event...</p></div>
        </main>
      </div>
    )
  }

  const isPublished = existingStatus && existingStatus !== 'Draft'

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <h1>{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/organizer/dashboard')}>← Back</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {isPublished && (
          <div className="alert alert-info">
            This event is <strong>{existingStatus}</strong>. Only limited fields can be edited.
          </div>
        )}

        {/* Step indicator */}
        <div className="step-indicator">
          {['Basic Info', 'Dates & Limits', formData.eventType === 'Merchandise' ? 'Merchandise' : 'Custom Form', 'Review'].map((label, i) => (
            <button
              key={i}
              className={`step-dot ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}
              onClick={() => setStep(i + 1)}
            >
              <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          ))}
        </div>

        <div className="create-event-form card">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <h2>Basic Information</h2>
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input name="eventName" className="form-input" placeholder="Enter event name" value={formData.eventName} onChange={handleChange} disabled={isPublished} />
              </div>
              <div className="form-group">
                <label className="form-label">Event Description *</label>
                <textarea name="eventDescription" className="form-textarea" rows={4} placeholder="Describe your event..." value={formData.eventDescription} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Event Type *</label>
                  <select name="eventType" className="form-select" value={formData.eventType} onChange={handleChange} disabled={isPublished}>
                    <option value="Normal">Normal (Individual)</option>
                    <option value="Merchandise">Merchandise</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Eligibility *</label>
                  <input name="eligibility" className="form-input" placeholder="e.g., Open to all, IIIT only" value={formData.eligibility} onChange={handleChange} disabled={isPublished} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tags-input-container">
                  <div className="tags-chips">
                    {formData.eventTags.map((tag, i) => (
                      <span key={i} className="tag-chip">
                        {tag}
                        <button type="button" className="tag-chip-remove" onClick={() => setFormData((prev) => ({ ...prev, eventTags: prev.eventTags.filter((_, idx) => idx !== i) }))}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input
                    className="form-input tags-text-input"
                    placeholder={formData.eventTags.length === 0 ? 'Type a tag and press Enter...' : 'Add another tag...'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = e.target.value.trim()
                        if (val && !formData.eventTags.includes(val)) {
                          setFormData((prev) => ({ ...prev, eventTags: [...prev.eventTags, val] }))
                          e.target.value = ''
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="form-check-row">
                <label className="form-check">
                  <input type="checkbox" name="isTeamEvent" checked={formData.isTeamEvent} onChange={handleChange} disabled={isPublished} />
                  <span>Team-based event</span>
                </label>
                {formData.isTeamEvent && (
                  <div className="form-group" style={{ maxWidth: '150px', marginBottom: 0 }}>
                    <label className="form-label">Max Team Size</label>
                    <input type="number" name="maxTeamSize" className="form-input" min={2} max={10} value={formData.maxTeamSize} onChange={handleChange} disabled={isPublished} />
                  </div>
                )}
              </div>
              <div className="form-nav">
                <div></div>
                <button className="btn btn-primary" onClick={() => setStep(2)}>Next →</button>
              </div>
            </div>
          )}

          {/* Step 2: Dates & Limits */}
          {step === 2 && (
            <div className="form-step">
              <h2>Schedule & Limits</h2>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Event Start *</label>
                  <input type="datetime-local" name="eventStartDate" className="form-input" value={formData.eventStartDate} onChange={handleChange} disabled={isPublished} />
                </div>
                <div className="form-group">
                  <label className="form-label">Event End *</label>
                  <input type="datetime-local" name="eventEndDate" className="form-input" value={formData.eventEndDate} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Registration Deadline *</label>
                <input type="datetime-local" name="registrationDeadline" className="form-input" value={formData.registrationDeadline} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Registration Limit</label>
                  <input type="number" name="registrationLimit" className="form-input" placeholder="Leave empty for unlimited" min={1} value={formData.registrationLimit} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Fee (₹)</label>
                  <input type="number" name="registrationFee" className="form-input" placeholder="0 for free" min={0} value={formData.registrationFee} onChange={handleChange} disabled={isPublished} />
                </div>
              </div>
              <div className="form-nav">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Next →</button>
              </div>
            </div>
          )}

          {/* Step 3: Custom Form / Merchandise */}
          {step === 3 && formData.eventType === 'Normal' && (
            <div className="form-step">
              <h2>Custom Registration Form</h2>
              <p className="form-hint" style={{ marginBottom: '1rem' }}>
                Build a custom registration form. These fields will be shown to participants during registration.
                {formLocked && <strong style={{ color: 'var(--danger)' }}> (Form is locked — registrations have been received)</strong>}
              </p>

              {customForm.map((field, idx) => (
                <div className="form-builder-field" key={field.fieldId || idx}>
                  <div className="fb-field-header">
                    <span className="fb-field-num">#{idx + 1}</span>
                    <div className="fb-field-actions">
                      <button type="button" className="btn-icon" onClick={() => moveFormField(idx, -1)} disabled={idx === 0 || formLocked}>↑</button>
                      <button type="button" className="btn-icon" onClick={() => moveFormField(idx, 1)} disabled={idx === customForm.length - 1 || formLocked}>↓</button>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => removeFormField(idx)} disabled={formLocked}>✕</button>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Field Label</label>
                      <input className="form-input" placeholder="e.g., T-shirt Size" value={field.fieldLabel} onChange={(e) => updateFormField(idx, 'fieldLabel', e.target.value)} disabled={formLocked} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Type</label>
                      <select className="form-select" value={field.fieldType} onChange={(e) => updateFormField(idx, 'fieldType', e.target.value)} disabled={formLocked}>
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Placeholder</label>
                      <input className="form-input" placeholder="Placeholder text" value={field.fieldPlaceholder} onChange={(e) => updateFormField(idx, 'fieldPlaceholder', e.target.value)} disabled={formLocked} />
                    </div>
                    <div className="form-group">
                      <label className="form-check" style={{ marginTop: '1.75rem' }}>
                        <input type="checkbox" checked={field.isRequired} onChange={(e) => updateFormField(idx, 'isRequired', e.target.checked)} disabled={formLocked} />
                        <span>Required</span>
                      </label>
                    </div>
                  </div>
                  {['dropdown', 'radio', 'checkbox'].includes(field.fieldType) && (
                    <div className="form-group">
                      <label className="form-label">Options (comma separated)</label>
                      <input className="form-input" placeholder="Option 1, Option 2, Option 3" value={(field.options || []).join(', ')} onChange={(e) => updateFormField(idx, 'options', e.target.value.split(',').map((o) => o.trim()).filter(Boolean))} disabled={formLocked} />
                    </div>
                  )}
                </div>
              ))}

              {!formLocked && (
                <button type="button" className="btn btn-secondary" onClick={addFormField} style={{ marginTop: '0.5rem' }}>
                  ➕ Add Field
                </button>
              )}

              <div className="form-nav">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>Next →</button>
              </div>
            </div>
          )}

          {step === 3 && formData.eventType === 'Merchandise' && (
            <div className="form-step">
              <h2>Merchandise Details</h2>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input className="form-input" placeholder="e.g., Felicity T-Shirt" value={merchandiseDetails.itemName} onChange={(e) => setMerchandiseDetails((p) => ({ ...p, itemName: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Limit per Participant</label>
                  <input type="number" className="form-input" min={1} value={merchandiseDetails.purchaseLimitPerParticipant} onChange={(e) => setMerchandiseDetails((p) => ({ ...p, purchaseLimitPerParticipant: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-check" style={{ marginTop: '1.75rem' }}>
                    <input type="checkbox" checked={merchandiseDetails.allowRegistrationOnly} onChange={(e) => setMerchandiseDetails((p) => ({ ...p, allowRegistrationOnly: e.target.checked }))} />
                    <span>Allow registration-only (without purchase)</span>
                  </label>
                </div>
              </div>
              {merchandiseDetails.allowRegistrationOnly && (
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Registration-only Fee (₹)</label>
                  <input type="number" className="form-input" min={0} value={merchandiseDetails.registrationOnlyFee} onChange={(e) => setMerchandiseDetails((p) => ({ ...p, registrationOnlyFee: e.target.value }))} />
                </div>
              )}

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Variants</h3>
              {merchandiseDetails.variants.map((v, idx) => (
                <div className="variant-row" key={idx}>
                  <input className="form-input" placeholder="Size (e.g., M)" value={v.size} onChange={(e) => updateVariant(idx, 'size', e.target.value)} />
                  <input className="form-input" placeholder="Color" value={v.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} />
                  <input type="number" className="form-input" placeholder="Stock" min={0} value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} />
                  <input type="number" className="form-input" placeholder="Price ₹" min={0} value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} />
                  <button type="button" className="btn-icon btn-icon-danger" onClick={() => removeVariant(idx)} disabled={merchandiseDetails.variants.length <= 1}>✕</button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={addVariant} style={{ marginTop: '0.5rem' }}>
                ➕ Add Variant
              </button>

              <div className="form-nav">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>Next →</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="form-step">
              <h2>Review & Submit</h2>
              <div className="review-section">
                <h3>Basic Info</h3>
                <div className="review-grid">
                  <div className="review-item"><span className="review-label">Name</span><span>{formData.eventName}</span></div>
                  <div className="review-item"><span className="review-label">Type</span><span className="badge badge-info">{formData.eventType}</span></div>
                  <div className="review-item"><span className="review-label">Eligibility</span><span>{formData.eligibility}</span></div>
                  <div className="review-item"><span className="review-label">Team Event</span><span>{formData.isTeamEvent ? `Yes (max ${formData.maxTeamSize})` : 'No'}</span></div>
                </div>
              </div>

              <div className="review-section">
                <h3>Schedule & Limits</h3>
                <div className="review-grid">
                  <div className="review-item"><span className="review-label">Start</span><span>{formData.eventStartDate ? new Date(formData.eventStartDate).toLocaleString() : '-'}</span></div>
                  <div className="review-item"><span className="review-label">End</span><span>{formData.eventEndDate ? new Date(formData.eventEndDate).toLocaleString() : '-'}</span></div>
                  <div className="review-item"><span className="review-label">Deadline</span><span>{formData.registrationDeadline ? new Date(formData.registrationDeadline).toLocaleString() : '-'}</span></div>
                  <div className="review-item"><span className="review-label">Limit</span><span>{formData.registrationLimit || 'Unlimited'}</span></div>
                  <div className="review-item"><span className="review-label">Fee</span><span>{formData.registrationFee ? `₹${formData.registrationFee}` : 'Free'}</span></div>
                </div>
              </div>

              {formData.eventTags.length > 0 && (
                <div className="review-section">
                  <h3>Tags</h3>
                  <div className="event-card-tags">
                    {formData.eventTags.map((t, i) => (
                      <span key={i} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.eventType === 'Normal' && customForm.length > 0 && (
                <div className="review-section">
                  <h3>Custom Form ({customForm.length} fields)</h3>
                  <div className="review-fields-list">
                    {customForm.map((f, i) => (
                      <div key={i} className="review-field-item">
                        <span className="review-field-num">#{i + 1}</span>
                        <span><strong>{f.fieldLabel || 'Untitled'}</strong> — {f.fieldType}{f.isRequired ? ' (Required)' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.eventType === 'Merchandise' && (
                <div className="review-section">
                  <h3>Merchandise: {merchandiseDetails.itemName}</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr><th>Size</th><th>Color</th><th>Stock</th><th>Price</th></tr>
                      </thead>
                      <tbody>
                        {merchandiseDetails.variants.map((v, i) => (
                          <tr key={i}>
                            <td>{v.size || '-'}</td><td>{v.color || '-'}</td><td>{v.stock}</td><td>₹{v.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="form-nav">
                <button className="btn btn-secondary" onClick={() => setStep(3)}>← Back</button>
                <div className="form-nav-right">
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner"></span> Saving...</> : isEdit ? 'Update Event' : 'Save as Draft'}
                  </button>
                  {isEdit && existingStatus === 'Draft' && (
                    <button className="btn btn-success" onClick={handlePublish} disabled={loading}>
                      Publish Event
                    </button>
                  )}
                  {!isEdit && (
                    <button className="btn btn-success" onClick={handleSaveAndPublish} disabled={loading}>
                      Save & Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
