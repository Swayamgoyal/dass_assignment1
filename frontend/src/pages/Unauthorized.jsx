import { Link } from 'react-router-dom'
import './Unauthorized.css'

export default function Unauthorized() {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <Link to="/login" className="btn btn-primary">Back to Login</Link>
      </div>
    </div>
  )
}
