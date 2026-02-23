import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Login from './pages/Login'
import ParticipantRegister from './pages/ParticipantRegister'
import Unauthorized from './pages/Unauthorized'

// Admin pages
import AdminDashboard from './pages/AdminDashboard'
import ManageOrganizers from './pages/ManageOrganizers'
import CreateOrganizer from './pages/CreateOrganizer'
import ManagePasswordResets from './pages/ManagePasswordResets'
import ModerateEvents from './pages/ModerateEvents'
import SystemAnalytics from './pages/SystemAnalytics'
import AuditLogs from './pages/AuditLogs'

// Organizer pages
import OrganizerDashboard from './pages/OrganizerDashboard'
import CreateEvent from './pages/CreateEvent'
import OrganizerEventDetails from './pages/OrganizerEventDetails'
import ManageRegistrations from './pages/ManageRegistrations'
import EventAnalytics from './pages/EventAnalytics'
import OngoingEvents from './pages/OngoingEvents'
import OrganizerProfile from './pages/OrganizerProfile'
import QRScanner from './pages/QRScanner'

// Participant pages
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import BrowseEvents from './pages/BrowseEvents'
import EventDetails from './pages/EventDetails'
import EventRegistration from './pages/EventRegistration'
import ParticipantProfile from './pages/ParticipantProfile'
import Clubs from './pages/Clubs'
import OrganizerDetail from './pages/OrganizerDetail'
import TicketView from './pages/TicketView'
import MyTeams from './pages/MyTeams'
import TeamChat from './pages/TeamChat'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* ===== Public Routes ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<ParticipantRegister />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ===== Admin Routes ===== */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/organizers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageOrganizers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/organizers/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateOrganizer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/password-resets"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManagePasswordResets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ModerateEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          {/* ===== Organizer Routes ===== */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/create-event"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events/:eventId/edit"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events/:eventId/details"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerEventDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events/:eventId/registrations"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <ManageRegistrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events/:eventId/analytics"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <EventAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events/:eventId/scanner"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <QRScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/ongoing-events"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OngoingEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/profile"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerProfile />
              </ProtectedRoute>
            }
          />

          {/* ===== Participant Routes ===== */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse-events"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <BrowseEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <EventDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/register"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <EventRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ticket/:ticketId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <TicketView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-teams"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MyTeams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-chat/:teamId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <TeamChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <Clubs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs/:organizerId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <OrganizerDetail />
              </ProtectedRoute>
            }
          />

          {/* ===== Default & Catch-all ===== */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App

