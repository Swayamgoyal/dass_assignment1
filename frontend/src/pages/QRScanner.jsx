import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import OrganizerNav from '../components/OrganizerNav'
import { organizerAPI, eventAPI } from '../services/api'
import './QRScanner.css'

export default function QRScanner() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [qrInput, setQrInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [mode, setMode] = useState('camera') // 'camera' | 'manual'
  const scannerRef = useRef(null)
  const scannerInstanceRef = useRef(null)
  const processingRef = useRef(false) // prevent double-scan

  useEffect(() => {
    loadEvent()
    return () => stopCamera()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const res = await eventAPI.getById(eventId)
      setEvent(res.data.data || res.data)
    } catch {
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    setCameraError('')
    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerInstanceRef.current = html5QrCode

      const config = { fps: 15, qrbox: undefined, disableFlip: false }

      const onSuccess = (decodedText) => {
        if (!processingRef.current) {
          processingRef.current = true
          handleQRData(decodedText)
        }
      }
      const onFailure = () => {}

      try {
        // Try rear camera first
        await html5QrCode.start({ facingMode: 'environment' }, config, onSuccess, onFailure)
      } catch {
        // Fall back to any available camera
        await html5QrCode.start({ facingMode: 'user' }, config, onSuccess, onFailure)
      }
      setCameraActive(true)
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(
        typeof err === 'string'
          ? err
          : err?.message || 'Could not access camera. Please allow camera permissions or use manual entry.'
      )
    }
  }

  const stopCamera = async () => {
    try {
      if (scannerInstanceRef.current?.isScanning) {
        await scannerInstanceRef.current.stop()
      }
      scannerInstanceRef.current = null
      setCameraActive(false)
    } catch {}
  }

  const handleQRData = async (qrData) => {
    setProcessing(true)
    setError('')
    setResult(null)

    try {
      const res = await organizerAPI.scanQR({ qrData: qrData.trim() })
      const data = res.data.data || res.data
      setResult({
        success: true,
        message: res.data.message || 'Attendance marked!',
        participant: data.participant,
        ticketId: data.ticketId,
        event: data.event,
        markedAt: data.markedAt,
      })
      setHistory((prev) => [
        {
          ticketId: data.ticketId,
          name: `${data.participant?.firstName || ''} ${data.participant?.lastName || ''}`,
          time: new Date().toLocaleTimeString(),
          status: 'success',
        },
        ...prev,
      ])
      setQrInput('')
    } catch (err) {
      console.error('QR Scan Error:', err.response || err)
      const msg = err.response?.data?.message || err.message || 'Scan failed'
      const alreadyMarked = msg.toLowerCase().includes('already marked')
      setResult({
        success: false,
        message: msg,
        participant: err.response?.data?.data?.participant,
        markedAt: err.response?.data?.data?.markedAt,
        alreadyMarked,
      })
      setHistory((prev) => [
        {
          ticketId: qrData.substring(0, 20) + '...',
          name: alreadyMarked ? 'Already scanned' : msg,
          time: new Date().toLocaleTimeString(),
          status: alreadyMarked ? 'duplicate' : 'error',
        },
        ...prev,
      ])
    } finally {
      setProcessing(false)
      // Allow next scan after a short delay
      setTimeout(() => { processingRef.current = false }, 2000)
    }
  }

  const handleManualScan = () => {
    if (!qrInput.trim()) {
      setError('Please enter QR code data or ticket ID')
      return
    }
    handleQRData(qrInput.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleManualScan()
  }

  const toggleMode = async (newMode) => {
    if (newMode === mode) return
    if (mode === 'camera') await stopCamera()
    setMode(newMode)
    setResult(null)
    setError('')
  }

  // Auto-start camera when switching to camera mode
  useEffect(() => {
    if (mode === 'camera' && !loading) {
      // Small delay to let the DOM render the #qr-reader div
      const timer = setTimeout(() => startCamera(), 300)
      return () => clearTimeout(timer)
    }
  }, [mode, loading])

  if (loading) {
    return (
      <div className="page-wrapper">
        <OrganizerNav />
        <main className="page-content">
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <OrganizerNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>QR Scanner</h1>
            <p className="scanner-event-name">{event?.eventName}</p>
          </div>
          <Link to={`/organizer/events/${eventId}/details`} className="btn btn-secondary">← Back to Event</Link>
        </div>

        <div className="scanner-layout">
          <div className="scanner-main">
            {/* Mode Toggle */}
            <div className="scanner-mode-toggle">
              <button
                className={`mode-btn ${mode === 'camera' ? 'mode-active' : ''}`}
                onClick={() => toggleMode('camera')}
              >
                📷 Camera Scan
              </button>
              <button
                className={`mode-btn ${mode === 'manual' ? 'mode-active' : ''}`}
                onClick={() => toggleMode('manual')}
              >
                ⌨️ Manual Entry
              </button>
            </div>

            {/* Camera Scanner */}
            {mode === 'camera' && (
              <div className="card scan-card">
                <div className="card-header"><h3>📷 Scan QR Code</h3></div>
                <p className="scan-instructions">Point your camera at a participant's QR code. It will scan automatically.</p>

                <div className="camera-container">
                  <div id="qr-reader" ref={scannerRef}></div>
                  {processing && (
                    <div className="camera-overlay">
                      <div className="spinner"></div>
                      <span>Processing...</span>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
                    {cameraError}
                    <button className="btn btn-sm btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={startCamera}>
                      Retry
                    </button>
                  </div>
                )}

                {!cameraActive && !cameraError && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <button className="btn btn-primary" onClick={startCamera}>Start Camera</button>
                  </div>
                )}
              </div>
            )}

            {/* Manual Entry */}
            {mode === 'manual' && (
              <div className="card scan-card">
                <div className="card-header"><h3>⌨️ Manual Entry</h3></div>
                <p className="scan-instructions">Paste the QR code data or ticket ID below and press Scan (or Enter).</p>

                <div className="scan-input-row">
                  <input
                    type="text"
                    className="form-input scan-input"
                    placeholder="Paste QR data or ticket ID..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <button className="btn btn-primary scan-btn" onClick={handleManualScan} disabled={processing}>
                    {processing ? 'Scanning...' : '🔍 Scan'}
                  </button>
                </div>

                {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`card scan-result ${result.success ? 'result-success' : result.alreadyMarked ? 'result-warning' : 'result-error'}`}>
                <div className="result-icon">
                  {result.success ? '✅' : result.alreadyMarked ? '⚠️' : '❌'}
                </div>
                <div className="result-body">
                  <h3 className="result-title">{result.message}</h3>
                  {result.participant && (
                    <div className="result-details">
                      <p><strong>Name:</strong> {result.participant.firstName} {result.participant.lastName}</p>
                      <p><strong>Email:</strong> {result.participant.email}</p>
                      {result.ticketId && <p><strong>Ticket:</strong> {result.ticketId}</p>}
                      {result.markedAt && <p><strong>Time:</strong> {new Date(result.markedAt).toLocaleString()}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="scanner-sidebar">
            <div className="card">
              <div className="card-header">
                <h3>Scan History</h3>
                <span className="badge">{history.filter((h) => h.status === 'success').length} scanned</span>
              </div>
              {history.length === 0 ? (
                <p className="empty-history">No scans yet. Scanned entries will appear here.</p>
              ) : (
                <div className="history-list">
                  {history.map((item, i) => (
                    <div key={i} className={`history-item history-${item.status}`}>
                      <div className="history-status-dot"></div>
                      <div className="history-info">
                        <span className="history-name">{item.name}</span>
                        <span className="history-ticket">{item.ticketId}</span>
                      </div>
                      <span className="history-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
