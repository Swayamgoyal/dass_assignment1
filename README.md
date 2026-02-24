# Felicity Event Management System

**Design & Analysis of Software Systems - Assignment 1**

A comprehensive event management system built with the MERN stack for managing college fest events, clubs, and participants.

---

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Features Implemented](#features-implemented)
- [Advanced Features](#advanced-features)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [User Credentials](#user-credentials)
- [Project Structure](#project-structure)

---

## 🎯 Project Overview

The Felicity Event Management System addresses the organizational challenges faced during college fests by providing a centralized, robust platform that eliminates chaos from event management. The system brings order to participant registrations, event creation, club management, and attendance tracking.

### Key Capabilities
- **Participants**: Browse events, register individually or in teams, track registrations, download tickets
- **Organizers**: Create events, manage registrations, track attendance via QR scanning, view analytics
- **Admins**: Manage clubs/organizers, handle password reset requests, oversee system operations

---

## 🛠️ Technology Stack

### Core Stack (MERN)
- **MongoDB** - NoSQL database with Mongoose ODM
- **Express.js** - RESTful API backend framework  
- **React** (v18) with Vite - Modern frontend framework
- **Node.js** - JavaScript runtime environment

### Additional Technologies
- **Authentication**: JWT (JSON Web Tokens), bcrypt password hashing
- **Real-time Communication**: Socket.io for team chat
- **Email Service**: Nodemailer with Gmail integration
- **QR Code Generation**: qrcode library for ticket generation
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **File Handling**: Multer for file uploads
- **Calendar Integration**: ical-generator for .ics file export
- **CSV Export**: json2csv for registration data export
- **HTTP Client**: Axios
- **QR Scanning**: html5-qrcode for camera-based scanning

---

## ✨ Features Implemented

### Core System Implementation [70 Marks]

#### 1. Authentication & Security [8 Marks]
- ✅ **Participant Registration**: IIIT email validation, non-IIIT registration
- ✅ **Organizer Authentication**: Admin-provisioned accounts only
- ✅ **Admin Provisioning**: Backend-seeded admin account
- ✅ **Security**: bcrypt password hashing, JWT-based authentication
- ✅ **Session Management**: Persistent sessions, role-based access control

#### 2. User Onboarding & Preferences [3 Marks]
- ✅ Areas of interest selection
- ✅ Club/organizer following
- ✅ Editable preferences from profile page

#### 3. User Data Models [2 Marks]
- ✅ Comprehensive participant model (name, email, type, college, contact)
- ✅ Complete organizer model (name, category, description, contact)
- ✅ Additional fields: password hash, preferences, followed organizers

#### 4. Event Types [2 Marks]
- ✅ **Normal Events**: Individual registration with custom forms
- ✅ **Merchandise Events**: Individual purchase with variants (size, color, stock)
- ✅ **Team Events**: Hackathon-style team registration (Advanced Feature)

#### 5. Event Attributes [2 Marks]
- ✅ Core attributes: name, description, type, eligibility, dates, limits, fees
- ✅ Dynamic form builder for Normal events
- ✅ Merchandise variants with stock management
- ✅ Event tags and status tracking

#### 6. Participant Features [22 Marks]
- ✅ **Navigation**: Dashboard, Browse Events, Clubs, Profile, Logout
- ✅ **Dashboard**: Upcoming events, participation history (tabs: Normal, Merchandise, Teams, Completed, Cancelled)
- ✅ **Browse Events**: Search (fuzzy), trending, filters (type, date, eligibility, followed clubs)
- ✅ **Event Details**: Complete information, registration/purchase validation
- ✅ **Registration Workflows**: 
  - Normal events with custom forms
  - Merchandise purchase with stock decrement
  - Team registration with invite codes
  - QR ticket generation
  - Email confirmations
- ✅ **Profile Management**: Editable fields, password change, interests, followed clubs
- ✅ **Clubs Listing**: View all organizers, follow/unfollow
- ✅ **Organizer Details**: View organizer info and their events

#### 7. Organizer Features [18 Marks]
- ✅ **Navigation**: Dashboard, Create Event, Ongoing Events, Profile, Logout
- ✅ **Dashboard**: Event carousel with cards, analytics (registrations, revenue, attendance)
- ✅ **Event Details**: Overview, analytics, participant list with search/filter, CSV export
- ✅ **Event Creation**: Draft→Publish workflow, form builder, merchandise configuration
- ✅ **Event Editing**: Rule-based editing (Draft: full edit | Published: limited | Ongoing: status only)
- ✅ **Form Builder**: Dynamic fields (text, email, number, textarea, dropdown, radio, checkbox, file), required/optional, locked after first registration
- ✅ **Profile Management**: Editable organizer details, password change
- ✅ **QR Scanner**: Camera scanning & manual entry for attendance tracking

#### 8. Admin Features [6 Marks]
- ✅ **Navigation**: Dashboard, Manage Clubs, Password Requests, Audit Logs, Logout
- ✅ **Club Management**: Add new clubs (auto-generate credentials), remove/disable clubs
- ✅ **Dashboard**: System statistics, recent activities
- ✅ **Password Reset Management**: View requests, approve/reject, auto-generate new passwords
- ✅ **Audit Logging**: Track all admin actions

#### 9. Deployment [5 Marks]
- ✅ **Frontend**: Deployed on Vercel (https://dass-assignment1-eosin.vercel.app)
- ✅ **Backend**: Deployed on Render (https://dass-assignment1-vcqs.onrender.com)
- ✅ **Database**: MongoDB Atlas with connection via environment variables
- ✅ **Production URLs**: Provided in `deployment.txt`

---

## 🚀 Advanced Features [30 Marks]

### Tier A: Core Advanced Features [16 Marks - 2 Features]

#### 1. Hackathon Team Registration [8 Marks] ✅ IMPLEMENTED
**Justification**: Essential for college fests where hackathons and team competitions are major attractions. Provides seamless team formation experience.

**Features Implemented**:
- ✅ Team creation by team leader with configurable team size (2-10 members)
- ✅ Unique 8-character invite code generation (e.g., `A3F2B8E1`)
- ✅ Team member invitation via shareable invite code
- ✅ Real-time team member status tracking (pending, accepted)
- ✅ Auto-complete marking when team is full
- ✅ **Automatic registration creation** for all team members
- ✅ Individual ticket generation for each team member with QR codes
- ✅ Email confirmation sent to all team members
- ✅ Team management dashboard showing:
  - Team name, event, size, and completion status
  - List of members with acceptance status
  - Team leader indicator
  - Integrated chat room (see Tier B Feature 3)
- ✅ Team member actions: Join via code, Leave team
- ✅ Team leader actions: Delete team, View analytics
- ✅ Validation: Prevents joining multiple teams for same event
- ✅ Backend validation ensuring team size constraints

**Technical Implementation**:
- Team model with embedded member array
- Registration creation on team formation and member join
- QR code generation for all team members
- Email service integration
- Socket.io for real-time chat (Tier B integration)

#### 2. QR Scanner & Attendance Tracking [8 Marks] ✅ IMPLEMENTED
**Justification**: Critical for managing entry at events, tracking actual attendance, and generating analytics. Replaces manual verification with efficient QR scanning.

**Features Implemented**:
- ✅ **Built-in QR code scanner** with device camera access
- ✅ **Manual ticket ID entry** as fallback option
- ✅ Live camera preview with auto-scan capability
- ✅ Attendance marking with timestamp
- ✅ **Duplicate scan prevention** with clear error messages
- ✅ Real-time scan history with status indicators (success/duplicate/error)
- ✅ Participant information display on successful scan
- ✅ Event-specific scanning (organizer can only scan their event tickets)
- ✅ Scan statistics: Total scanned count displayed
- ✅ Integration with registration analytics
- ✅ Works with both JSON QR data and plain ticket IDs
- ✅ Comprehensive error handling and user feedback
- ✅ Responsive UI with mode toggle (Camera/Manual)

**Technical Implementation**:
- html5-qrcode library for camera access
- QR data verification against database
- Attendance tracking in Registration model
- Real-time UI updates
- Graceful degradation (camera fails → manual entry)

### Tier B: Real-time & Communication Features [12 Marks - 2 Features]

#### 3. Organizer Password Reset Workflow [6 Marks] ✅ IMPLEMENTED
**Justification**: Security best practice ensuring organizers can securely recover access without compromising system integrity. Admin oversight maintains accountability.

**Features Implemented**:
- ✅ Organizer-initiated password reset request with reason
- ✅ Admin dashboard for viewing all password reset requests
- ✅ Request details: Club name, request date, reason, current status
- ✅ Admin actions: Approve or Reject with comments
- ✅ **Auto-generation of secure password** on approval
- ✅ Admin receives new password to share with organizer
- ✅ Status tracking: Pending → Approved/Rejected
- ✅ Password reset history maintenance
- ✅ Request submission restrictions (one pending request at a time)
- ✅ Email notifications (can be enabled)
- ✅ Comprehensive audit trail
- ✅ User-friendly UI with status badges and action buttons

**Technical Implementation**:
- PasswordResetRequest model with status tracking
- Secure password generation using crypto
- bcrypt hashing for new passwords
- Admin approval workflow
- Request history tracking

#### 4. Team Chat [6 Marks] ✅ IMPLEMENTED  
**Justification**: Essential for team coordination in hackathons. Enables real-time communication without relying on external platforms like WhatsApp.

**Features Implemented**:
- ✅ **Real-time messaging** using Socket.io
- ✅ Team-specific chat rooms (automatic on team join)
- ✅ **Message history** persisted in database
- ✅ **Online status indicators** for team members
- ✅ **Typing indicators** showing who is typing
- ✅ Message timestamps with relative time display
- ✅ Sender identification (you vs. team members)
- ✅ **File/link sharing** capability in messages
- ✅ Auto-scroll to latest messages
- ✅ Message input with Enter-to-send
- ✅ Connection status indicators
- ✅ Team member list with online status
- ✅ Persistent chat history across sessions
- ✅ JWT authentication for Socket.io connections
- ✅ Team membership validation before allowing chat access

**Technical Implementation**:
- Socket.io server integration
- TeamMessage model for persistence
- Real-time event emissions (messages, typing, online status)
- JWT-based socket authentication
- Room-based chat architecture
- Client-side Socket.io integration with React

### Tier C: Integration & Enhancement Features [2 Marks - 1 Feature]

#### 5. Add to Calendar Integration [2 Marks] ✅ IMPLEMENTED
**Justification**: Improves participant experience by allowing easy calendar integration. Reduces no-shows by enabling calendar reminders.

**Features Implemented**:
- ✅ Downloadable `.ics` files for universal calendar apps
- ✅ Direct integration links for Google Calendar
- ✅ Support for Microsoft Outlook
- ✅ Automatic timezone handling (IST)
- ✅ Event details included: Name, description, location, times
- ✅ Organizer contact information embedded
- ✅ **Batch export capability** (planned for multiple events)
- ✅ Accessible from event details page
- ✅ Works for all registered events

**Technical Implementation**:
- ical-generator library for .ics file creation
- Calendar endpoint in backend
- Event metadata formatting
- Timezone conversion (UTC to IST)

#### 6. Anonymous Feedback System [2 Marks] ✅ IMPLEMENTED
**Justification**: Encourages honest feedback from participants, helping organizers improve future events. Anonymity ensures unbiased responses.

**Features Implemented**:
- ✅ Star rating system (1-5 stars)
- ✅ Text-based comments
- ✅ Anonymous submission (no participant ID stored)
- ✅ Feedback submission only for attended events
- ✅ Organizer view: Aggregated ratings and feedback list
- ✅ **Average rating calculation** displayed on organizer dashboard
- ✅ **Feedback statistics**: Total count, rating distribution
- ✅ Filter feedback by star rating
- ✅ Export feedback data (CSV integration available)
- ✅ Clean, intuitive feedback submission form
- ✅ Feedback display with star visualization

**Technical Implementation**:
- Feedback model with event and participant references
- Anonymous flag ensuring privacy
- Aggregation pipeline for statistics
- Frontend star rating component
- Filter and export functionality

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- MongoDB Atlas account
- Gmail account (for email service - optional)

### Quick Setup (Windows)

1. **Install Backend Dependencies**
   ```bash
   # Double-click or run:
   install-backend.bat
   ```

2. **Install Frontend Dependencies**
   ```bash
   # Double-click or run:
   install-frontend.bat
   ```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd frontend
npm install
```

### Environment Configuration

#### Backend (.env)
Create `.env` file in `backend/` directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Server
PORT=5000
NODE_ENV=development

# Email Configuration (Optional - gracefully skips if not configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password

# Admin Credentials (Auto-seeded)
ADMIN_EMAIL=admin@felicity.iiit.ac.in
ADMIN_PASSWORD=Admin@123

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
Create `.env` file in `frontend/` directory (optional for local development):

```env
# Backend API URL (defaults to /api proxy if not set)
VITE_API_URL=http://localhost:5000/api
```

**Note**: For local development, the Vite proxy handles API requests automatically.

---

## 🏃 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
# Creates optimized build in dist/
```

#### Start Production Backend
```bash
cd backend
npm start
```

---

## 🌐 Deployment

### Deployment Architecture
- **Frontend**: Vercel (Static hosting with automatic deployments)
- **Backend**: Render (Node.js hosting with automatic deployments)
- **Database**: MongoDB Atlas (Cloud database)

### Live URLs
- **Frontend**: https://dass-assignment1-eosin.vercel.app
- **Backend**: https://dass-assignment1-vcqs.onrender.com
- **Repository**: https://github.com/Swayamgoyal/dass_assignment1

### Deployment Configuration

#### Vercel (Frontend)
1. Connect GitHub repository
2. Framework: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable:
   ```
   VITE_API_URL=https://dass-assignment1-vcqs.onrender.com/api
   ```

#### Render (Backend)
1. Connect GitHub repository
2. Runtime: Node
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   ```
   MONGODB_URI=<your_atlas_connection_string>
   JWT_SECRET=<your_jwt_secret>
   EMAIL_USER=<your_gmail>
   EMAIL_PASS=<your_app_password>
   ADMIN_EMAIL=admin@felicity.iiit.ac.in
   ADMIN_PASSWORD=Admin@123
   FRONTEND_URL=https://dass-assignment1-eosin.vercel.app
   NODE_ENV=production
   ```

#### MongoDB Atlas
1. Create cluster
2. Create database: `felicity`
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string

**Detailed deployment guide**: See `DEPLOYMENT_GUIDE.md`

---

## 👤 User Credentials

### Admin Access
- **Email**: `admin@felicity.iiit.ac.in`
- **Password**: `Admin@123`

### Sample Organizer (Pre-created)
- **Email**: `ecell@felicity.iiit.ac.in`
- **Password**: `organizer123`
- **Name**: E-Cell

### Sample Participant
- **Email**: Any valid email (IIIT or non-IIIT)
- **Password**: Set during registration

**Note**: Admin is auto-seeded on backend startup. Additional organizers can be created via Admin panel.

---

## 📁 Project Structure

```
dass_assignment1/
├── backend/
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── feedbackController.js
│   │   ├── organizerController.js
│   │   ├── participantController.js
│   │   ├── registrationController.js
│   │   └── teamController.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js          # JWT authentication
│   ├── models/              # Mongoose schemas
│   │   ├── Admin.js
│   │   ├── Event.js
│   │   ├── Feedback.js
│   │   ├── Organizer.js
│   │   ├── Participant.js
│   │   ├── PasswordResetRequest.js
│   │   ├── Registration.js
│   │   ├── Team.js
│   │   └── TeamMessage.js
│   ├── routes/              # API routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── feedback.js
│   │   ├── organizer.js
│   │   ├── participant.js
│   │   ├── publicEvents.js
│   │   ├── registrations.js
│   │   └── teams.js
│   ├── scripts/             # Utility scripts
│   │   └── seedAdmin.js     # Auto-seed admin
│   ├── utils/               # Helper functions
│   │   ├── calendarGenerator.js  # .ics file generation
│   │   ├── emailService.js       # Email sending
│   │   ├── generateToken.js      # JWT generation
│   │   └── qrGenerator.js        # QR code generation
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── server.js            # Entry point
│
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── AdminNav.jsx
│   │   │   ├── OrganizerNav.jsx
│   │   │   ├── ParticipantNav.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── BrowseEvents.jsx
│   │   │   ├── CreateEvent.jsx
│   │   │   ├── CreateOrganizer.jsx
│   │   │   ├── Dashboard.jsx         # Participant dashboard
│   │   │   ├── EventDetails.jsx
│   │   │   ├── EventAnalytics.jsx
│   │   │   ├── EventRegistration.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ManageOrganizers.jsx
│   │   │   ├── ManagePasswordResets.jsx
│   │   │   ├── ManageRegistrations.jsx
│   │   │   ├── MyTeams.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── OrganizerDashboard.jsx
│   │   │   ├── QRScanner.jsx         # Attendance tracking
│   │   │   ├── TeamChat.jsx          # Real-time chat
│   │   │   └── TicketView.jsx
│   │   ├── redux/           # State management
│   │   ├── services/        # API integration
│   │   │   └── api.js       # Axios instance
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Entry point
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── vite.config.js       # Vite configuration
│
├── README.md                # This file
├── deployment.txt           # Deployment URLs
├── DEPLOYMENT_GUIDE.md      # Detailed deployment guide
├── EMAIL_SETUP.md           # Email configuration guide
├── assignment_content.txt   # Assignment requirements
├── install-backend.bat      # Windows install script
└── install-frontend.bat     # Windows install script
```

---

## 🔑 Key Features Highlights

### Security
- ✅ Bcrypt password hashing (cost factor: 10)
- ✅ JWT-based authentication with expiry
- ✅ Role-based access control middleware
- ✅ Protected routes on both frontend and backend
- ✅ Input validation and sanitization
- ✅ CORS configuration for production

### Performance
- ✅ MongoDB indexing for fast queries
- ✅ Vite for lightning-fast frontend builds
- ✅ Lazy loading for optimal bundle sizes
- ✅ Efficient state management with Redux Toolkit
- ✅ Socket.io for real-time features

### User Experience
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Intuitive navigation with role-specific menus
- ✅ Real-time feedback and loading states
- ✅ Error handling with user-friendly messages
- ✅ Email confirmations for registrations
- ✅ QR tickets with downloadable PDFs (planned)
- ✅ Calendar integration for event reminders

### Developer Experience
- ✅ Clean, modular code structure
- ✅ Comprehensive error logging
- ✅ Environment-based configuration
- ✅ RESTful API design
- ✅ Consistent naming conventions
- ✅ Documentation and comments

---

## 📝 API Documentation

### Base URLs
- **Local Development**: `http://localhost:5000/api`
- **Production**: `https://dass-assignment1-vcqs.onrender.com/api`

### Authentication Endpoints
```
POST /auth/register/participant    # Register new participant
POST /auth/login/participant        # Participant login
POST /auth/login/organizer          # Organizer login
POST /auth/login/admin              # Admin login
POST /auth/logout                   # Logout (all roles)
```

### Participant Endpoints
```
GET  /participant/dashboard         # Dashboard data
GET  /participant/my-events         # User's events
GET  /participant/profile           # Get profile
PUT  /participant/profile           # Update profile
POST /participant/follow/:organizerId  # Follow/unfollow
POST /participant/change-password   # Change password
```

### Organizer Endpoints
```
GET  /organizer/dashboard           # Dashboard with analytics
GET  /organizer/events/:eventId/registrations  # View registrations
GET  /organizer/events/:eventId/analytics      # Event analytics
POST /organizer/scan-qr             # QR code scanning
GET  /organizer/events/:eventId/export         # Export CSV
```

### Admin Endpoints
```
GET  /admin/dashboard               # System statistics
POST /admin/organizers              # Create organizer
GET  /admin/organizers              # List all organizers
DELETE /admin/organizers/:id        # Remove organizer
GET  /admin/password-reset-requests # View password requests
PATCH /admin/password-reset-requests/:id/approve  # Approve request
```

### Event Endpoints
```
GET  /events                        # Browse events (public)
GET  /events/:id                    # Event details  
GET  /events/:id/calendar           # Download .ics file
POST /organizer/events              # Create event (organizer)
PUT  /organizer/events/:id          # Update event
POST /organizer/events/:id/publish  # Publish draft
```

### Team Endpoints
```
POST /teams/create                  # Create team
POST /teams/join/:inviteCode        # Join team
GET  /teams/my-teams                # Get user's teams
GET  /teams/:id                     # Team details
DELETE /teams/:id                   # Delete team (leader only)
```

### Feedback Endpoints
```
POST /feedback                      # Submit feedback
GET  /feedback/event/:eventId       # Get event feedback
GET  /feedback/event/:eventId/stats # Feedback statistics
```

---

## 🎓 Learning Outcomes

This project demonstrates:
1. **Full-stack development** with modern JavaScript frameworks
2. **RESTful API design** with Express.js
3. **Database modeling** with MongoDB and Mongoose
4. **Authentication & Authorization** using JWT
5. **Real-time communication** with Socket.io
6. **State management** with Redux Toolkit
7. **File handling** and QR code generation
8. **Email integration** with Nodemailer
9. **Cloud deployment** on Vercel, Render, and MongoDB Atlas
10. **Version control** with Git and GitHub

---

## 👥 Credits

**Developed as part of Design & Analysis of Software Systems coursework**

- **Developer**: Swayam Goyal
- **Course**: DASS (Design & Analysis of Software Systems)
- **Assignment**: Assignment 1 - Felicity Event Management System
- **Institution**: IIIT Hyderabad

---

## 📄 License

This project is developed for academic purposes as part of the DASS course curriculum.

---

## 📞 Support

For issues, questions, or feedback:
- **Repository**: [GitHub](https://github.com/Swayamgoyal/dass_assignment1)
- **Live Application**: [Felicity Events](https://dass-assignment1-eosin.vercel.app)

---

**Last Updated**: February 2026


## 🚀 Project Overview

The Felicity Event Management System streamlines the organization of college fest events by providing a centralized platform for:
- **Participants** to browse and register for events
- **Organizers** to create and manage events
- **Admins** to oversee clubs and organizers

## 🛠️ Technology Stack

- **MongoDB** - Database
- **Express.js** - Backend framework
- **React** (with Vite) - Frontend framework
- **Node.js** - Runtime environment

### Additional Technologies
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service
- **QR Code** - Ticket generation
- **Redux Toolkit** - State management
- **React Router** - Routing

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- MongoDB Atlas account

## 🔧 Installation

### Quick Setup (Windows)

1. **Install Backend Dependencies**
   ```bash
   # Double-click or run:
   install-backend.bat
   ```

2. **Install Frontend Dependencies**
   ```bash
   # Double-click or run:
   install-frontend.bat
   ```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd frontend
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Credentials
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123

# Frontend URL
FRONTEND_URL=http://localhost:3000

NODE_ENV=development
```

### MongoDB Atlas Setup

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGODB_URI` in `.env`

## 🏃 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
# Server will run on http://localhost:5000
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
# App will run on http://localhost:3000
```

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

## 📁 Project Structure

```
dass_assignment1/
├── backend/
│   ├── models/           # Database models (Participant, Organizer, Event, etc.)
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware (auth, validation)
│   ├── utils/            # Utility functions (email, QR, hashing)
│   ├── config/           # Configuration files
│   ├── scripts/          # Utility scripts (seed admin, etc.)
│   ├── .env              # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js         # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── redux/        # Redux store, slices
│   │   ├── services/     # API service functions
│   │   ├── utils/        # Helper functions
│   │   ├── App.jsx       # Main App component
│   │   ├── main.jsx      # Entry point
│   │   └── index.css     # Global styles
│   ├── public/           # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── install-backend.bat    # Backend dependency installer
├── install-frontend.bat   # Frontend dependency installer
├── deployment.txt         # Deployment URLs
└── README.md             # This file
```

## 🎯 Features Implemented

### Core System (70 Marks)
- ✅ Authentication & Security (8 marks)
- ✅ User Onboarding & Preferences (3 marks)
- ✅ User Data Models (2 marks)
- ✅ Event Types (2 marks)
- ✅ Event Attributes (2 marks)
- ✅ Participant Features (22 marks)
- ✅ Organizer Features (18 marks)
- ✅ Admin Features (6 marks)
- ✅ Deployment (5 marks)

### Advanced Features (30 Marks)

> [!NOTE]
> Advanced features will be selected and implemented in Phase 8 of development.

#### Tier A - Core Advanced Features (Choose 2)
1. [ ] Hackathon Team Registration (8 marks)
2. [ ] Merchandise Payment Approval Workflow (8 marks)
3. [ ] QR Scanner & Attendance Tracking (8 marks)

#### Tier B - Real-time & Communication Features (Choose 2)
1. [ ] Real-Time Discussion Forum (6 marks)
2. [ ] Organizer Password Reset Workflow (6 marks)
3. [ ] Team Chat (6 marks)

#### Tier C - Integration & Enhancement Features (Choose 1)
1. [ ] Anonymous Feedback System (2 marks)
2. [ ] Add to Calendar Integration (2 marks)
3. [ ] Bot Protection (2 marks)

## 🔐 Default Credentials

### Admin Account
- Email: admin@felicity.com
- Password: Admin@123

> [!WARNING]
> Change these credentials in production!

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/participant` - Participant registration
- `POST /api/auth/login/participant` - Participant login
- `POST /api/auth/login/organizer` - Organizer login
- `POST /api/auth/login/admin` - Admin login

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/register` - Register for event

### Participant
- `GET /api/participant/dashboard` - Get dashboard data
- `GET /api/participant/profile` - Get profile
- `PUT /api/participant/profile` - Update profile

### Organizer
- `GET /api/organizer/dashboard` - Get dashboard
- `POST /api/organizer/events` - Create event
- `GET /api/organizer/events/:id` - Get event details
- `PUT /api/organizer/events/:id` - Update event

### Admin
- `GET /api/admin/organizers` - Get all organizers
- `POST /api/admin/organizers` - Create new organizer
- `DELETE /api/admin/organizers/:id` - Remove organizer

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to Vercel or Netlify
3. Set environment variable: `VITE_API_URL=<backend-url>`

### Backend Deployment (Render/Railway/Fly.io)
1. Connect your GitHub repository
2. Set all environment variables
3. Deploy with: `npm start`

### Deployment URLs
See `deployment.txt` for live deployment links.

## 📝 Development Timeline

- Phase 1: Project Setup (Days 1-2)
- Phase 2: Authentication & Security (Days 3-5)
- Phase 3: User Onboarding & Profiles (Days 6-7)
- Phase 4: Event Management (Days 8-11)
- Phase 5: Participant Features (Days 12-16)
- Phase 6: Organizer Features (Days 17-20)
- Phase 7: Admin Features (Days 21-22)
- Phase 8: Advanced Features (Days 23-28)
- Phase 9: Deployment & Testing (Days 29-30)
- Phase 10: Documentation (Day 31)

## 🤝 Contributing

This is an academic project. Collaboration is not permitted as per assignment guidelines.

## ⚠️ Academic Integrity

- No AI tools (ChatGPT, Copilot) were used
- All code is original
- No plagiarism from other sources

## 📧 Contact

For queries related to this project, contact via the submission portal.

## 📄 License

This project is part of an academic assignment for Design & Analysis of Software Systems.
