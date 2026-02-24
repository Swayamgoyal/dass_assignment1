# Felicity Event Management System

A comprehensive event management system built with the MERN stack for managing college fest events, clubs, and participants.

## Libraries, Frameworks, and Modules Used

### Backend Dependencies

Core Framework & Runtime
- Node.js (v14+)
  Justification: Enables JavaScript for backend development with excellent async I/O performance and non-blocking event loop for handling concurrent requests efficiently
  
- Express.js (v4.18+)
  Justification: Minimal and flexible framework for building RESTful APIs with robust routing, middleware support, and extensive community ecosystem

Database & ODM
- MongoDB
  Justification: NoSQL document database with flexible schema design perfect for event management with varying attributes. Provides easy horizontal scaling and natural JSON-like document structure matching JavaScript objects
  
- Mongoose (v7.0+)
  Justification: ODM layer providing schema validation, type casting, query building, and business logic hooks. Simplifies database operations and enforces data consistency

Authentication & Security
- jsonwebtoken (JWT)
  Justification: Stateless token-based authentication enabling secure session management across distributed systems without server-side session storage. Scalable for microservices architecture
  
- bcryptjs
  Justification: Industry-standard password hashing with configurable salt rounds. Provides protection against rainbow table attacks and brute-force attempts

Real-time Communication
- Socket.io (v4.6+)
  Justification: Enables real-time bidirectional communication for team chat with automatic fallback to long-polling when WebSockets unavailable. Built-in room management for team-based communication

Email Service
- Nodemailer (v6.9+)
  Justification: Simple SMTP integration for sending registration confirmations and tickets. Supports various email providers with minimal configuration

File Handling & QR Codes
- Multer
  Justification: Middleware for handling multipart/form-data for file uploads including event images and custom form file fields. Memory-efficient streaming for large files
  
- qrcode
  Justification: Generates unique QR codes for event tickets enabling contactless attendance tracking and quick check-ins

Data Export & Calendar
- json2csv
  Justification: Converts registration data to CSV format for organizers' offline analysis, record-keeping, and Excel compatibility
  
- ical-generator
  Justification: Creates iCalendar (.ics) files for universal calendar integration with Google Calendar, Outlook, and Apple Calendar

Environment & CORS
- dotenv
  Justification: Manages environment variables to keep sensitive credentials out of codebase and enable environment-specific configurations
  
- cors
  Justification: Enables Cross-Origin Resource Sharing for secure API access from frontend hosted on different domain/port

### Frontend Dependencies

Core Framework & Build Tool
- React (v18+)
  Justification: Component-based architecture with virtual DOM for efficient updates. Large ecosystem, reusable components, and excellent developer experience with hooks
  
- Vite (v5.4+)
  Justification: Modern build tool offering lightning-fast Hot Module Replacement (HMR) and optimized production builds. Significantly faster than webpack for development

Routing & State Management
- React Router (v6+)
  Justification: Declarative client-side routing with nested routes, protected routes, and navigation guards. Essential for single-page application navigation
  
- Redux Toolkit
  Justification: Centralized state management for user authentication and global app state. Simplifies Redux boilerplate with createSlice and includes Redux Thunk for async logic

HTTP Client
- Axios
  Justification: Promise-based HTTP client with interceptors for automatically adding auth tokens, automatic JSON transformation, and better error handling compared to fetch API

QR Code Scanning
- html5-qrcode
  Justification: Browser-based QR code scanning using device camera without requiring native apps. Works across desktop and mobile devices

UI Styling
- Custom CSS
  Justification: Provides complete design control, zero bundle bloat from unused components, enables custom branding, and offers learning opportunity for CSS skills

## Advanced Features Implementation

### Tier A Features (16 Marks)

#### 1. Hackathon Team Registration (8 Marks)

Feature Selection Justification:
College fests increasingly focus on hackathons and team-based competitions. Traditional event management systems handle only individual registrations, creating coordination chaos for team events. This feature addresses a critical gap by providing seamless team formation and management with invite-based joining.

Design Choices and Technical Decisions:
- Invite Code System: Generated unique 8-character alphanumeric codes for team joining
  Rationale: Reduces friction - team members can join independently without waiting for leader approval. Crypto-random generation ensures uniqueness and easy sharing via messaging apps
  
- Automatic Registration Creation: Each team member gets individual Registration record
  Rationale: Maintains data consistency - team members appear in organizer's registration list and receive individual tickets. Created registration records on both team creation and member join to ensure atomicity

- Individual QR Tickets: Each team member receives unique QR code
  Rationale: Enables fair attendance tracking - individual contributions matter and prevents proxy attendance. Reused existing QR generation utility linked to individual registrations

Implementation Approach:
- Database Design: Team model with embedded members array containing participantId, joinedAt, and status fields
- Transaction Handling: Used Mongoose transactions to ensure atomicity when creating team with simultaneous registration records
- Email Integration: Centralized email service sends confirmations to all team members with team context
- Validation: Backend prevents duplicate teams per event, enforces team size limits, and verifies event is team-type
- Invite Code Management: Stored in Team model with database index for fast lookups
- Dynamic Status: Team completion status calculated based on members.length vs maxSize
- Cleanup: Team leader can delete team which cascades to all member registrations

#### 2. QR Scanner and Attendance Tracking (8 Marks)

Feature Selection Justification:
Manual attendance verification at large events is time-consuming, error-prone, and creates bottlenecks. QR-based scanning provides instant verification and accurate analytics, modernizing event management similar to industry standards used in concerts and flights.

Design Choices and Technical Decisions:
- Dual Input Modes: Camera scanning plus manual ticket ID entry
  Rationale: Provides fallback for camera failures, poor lighting, or damaged QR codes. Backend accepts both JSON QR data and plain ticket IDs using try-catch parsing

- Duplicate Prevention: Clear error messaging when ticket already scanned
  Rationale: Prevents attendance fraud and maintains data integrity. Checks hasAttended flag before marking attendance

- Real-time Scan History: Display last 10 scans with success/error status
  Rationale: Provides immediate feedback for organizers and helps identify scanning issues. Stored in frontend state (not database) as session-specific context

- Event-Specific Scanning: Organizers can only scan tickets for their own events
  Rationale: Security measure preventing cross-event attendance marking and maintaining data privacy. Backend verifies ticket's eventId matches organizer's event

Implementation Approach:
- Frontend: html5-qrcode library provides camera access with auto-scan capabilities
  Challenge: Handling camera permissions across different browsers
  Solution: Graceful error handling with fallback to manual entry mode
  
- Backend Validation Pipeline:
  1. Parse QR data (JSON or plain string)
  2. Find registration by ticketId
  3. Verify registration exists and matches eventId
  4. Check hasAttended flag to prevent duplicates
  5. Update registration with attendance timestamp

- Attendance Timestamp: Stores actual time (not just boolean) for analytics on peak entry times
- Visual Confirmation: Returns participant info on successful scan for organizer verification
- UI Mode Toggle: Camera/Manual switch in single page for better user experience

### Tier B Features (12 Marks)

#### 3. Team Chat (6 Marks)

Feature Selection Justification:
Hackathon teams require constant communication during events. Forcing teams to exchange phone numbers and use external platforms like WhatsApp creates friction and privacy concerns. Integrated chat keeps all event-related communication centralized and provides better context through team registration status visibility.

Design Choices and Technical Decisions:
- Socket.io for Real-time Communication: WebSocket-based messaging instead of polling
  Rationale: Delivers true real-time experience with efficient bandwidth usage and automatic reconnection. Socket.io chosen over raw WebSockets for built-in fallback support and room management

- Persistent Message History: Messages stored in TeamMessage database model
  Rationale: Late-joining members can see discussion context which is critical for asynchronous communication across time zones

- Typing Indicators: Display "X is typing..." when team members type
  Rationale: Creates conversational feel, prevents message collisions, and provides modern chat UX. Emit typing events on input change with 500ms debouncing

- Online Status Indicators: Green dot next to online team members
  Rationale: Team leaders can identify who's available for immediate discussion. Tracks socket connections per team room and emits online users list on join/leave events

Implementation Approach:
- Backend Socket Architecture:
  - JWT authentication middleware validates socket connections
  - Room-based design (one room per team using team._id as room identifier)
  - Event handlers: join-team, send-message, typing, disconnect
  
- Frontend Integration:
  - Socket connection initialized in TeamChat component
  - useEffect hooks for message listeners and cleanup
  - Auto-scroll to latest message on new message receipt
  - Proper socket cleanup on component unmount

- Message Storage: Stores sender's name in message document to avoid extra database joins
- Broadcasting: Emits to entire room (not broadcast) to include sender in updates
- Security: Validates team membership before allowing join-team socket event

#### 4. Organizer Password Reset Workflow (6 Marks)

Feature Selection Justification:
Organizers are long-term users who inevitably forget passwords. Allowing self-service resets without oversight poses security risks since club accounts could be hijacked. This workflow balances user convenience with security through admin verification, especially important since organizers manage sensitive operations like merchandise sales and registrations.

Design Choices and Technical Decisions:
- Admin Approval Required: Reset requests routed to admin dashboard for manual approval
  Rationale: Organizers manage sensitive operations and need identity verification. Better than email-based reset since organizers often use shared club email accounts

- Auto-generated Secure Passwords: System generates passwords on approval using Crypto.randomBytes
  Rationale: Prevents weak passwords and removes burden from admin. Generates 16-character passwords with symbols meeting security requirements

- Request Reason Mandatory: Organizer must provide reason for password reset
  Rationale: Helps admin detect suspicious activity and provides audit trail. Stored in PasswordResetRequest model for future reference

- Single Pending Request Limit: Prevents multiple simultaneous reset requests
  Rationale: Prevents admin dashboard flooding and indicates potential compromised account if multiple requests attempted

Implementation Approach:
- Database Model: PasswordResetRequest with status (pending/approved/rejected), reason, and requestDate fields
- Admin Workflow:
  1. View all pending/historical requests on dashboard
  2. Approve or reject with optional comments
  3. On approval: generate secure password, hash with bcrypt, update organizer record, display password to admin for communication
  
- Security: New passwords use same bcrypt hashing as registration (cost factor 10)
- Audit Trail: Request history preserved (not deleted on approval) for security auditing
- Rejection Handling: Admin can provide reason for rejection which is communicated to organizer
- UI Status Indicators: Color-coded badges (Pending=yellow, Approved=green, Rejected=red) for quick scanning

### Tier C Features (2 Marks)

#### 5. Calendar Integration (2 Marks)

Feature Selection Justification:
Participants register for multiple events and often forget dates leading to no-shows. Calendar integration enables automatic reminders via users' existing calendar applications. Universal .ics format provides compatibility across all major platforms (Google Calendar, Apple Calendar, Outlook, mobile calendars).

Design Choices and Technical Decisions:
- .ics File Generation: Server-side generation using ical-generator library
  Rationale: Universal compatibility across all calendar platforms, no API keys required, works offline. Library handles complex iCalendar format specifications

- On-Demand Generation: Backend endpoint /api/events/:eventId/calendar generates file per request
  Rationale: Avoids storing static .ics files, generates with latest event data ensuring accuracy

- Timezone Handling: Convert UTC database times to IST (India Standard Time)
  Rationale: Events are in India, users expect local times in calendar entries

Implementation Approach:
- Backend Route: GET /api/events/:eventId/calendar
  1. Fetch event details from database
  2. Create calendar using ical-generator
  3. Add event with start/end times, location, description
  4. Set organizer contact information
  5. Return with Content-Type: text/calendar header
  
- Frontend Integration: Download button on event details page triggers GET request with automatic file download

- Event Details Included: Description, organizer contact info added to calendar entry for participant reference
- Reminder Configuration: Sets alarm/reminder 1 day before event start time
- File Naming: Format {eventName}.ics for clarity in user's downloads folder

## Setup and Installation Instructions

### Prerequisites
1. Node.js (v14.0.0 or higher) - Download from https://nodejs.org/
2. npm (v6.0.0 or higher) - Included with Node.js installation
3. MongoDB Atlas Account - Sign up at https://www.mongodb.com/cloud/atlas
4. Gmail Account (Optional) - Required for email notifications

### Step 1: Clone Repository
```bash
git clone https://github.com/Swayamgoyal/dass_assignment1.git
cd dass_assignment1
```

### Step 2: Backend Setup

Install Dependencies:
```bash
cd backend
npm install
```

Configure Environment Variables:
Create a .env file in the backend/ directory with the following content:

```env
# Database Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity?retryWrites=true&w=majority

# JWT Secret (use strong random string - minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Optional - application functions without it)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password

# Admin Credentials (auto-seeded on first startup)
ADMIN_EMAIL=admin@felicity.iiit.ac.in
ADMIN_PASSWORD=Admin@123

# Frontend URL (for CORS configuration)
FRONTEND_URL=http://localhost:3000
```

MongoDB Atlas Configuration Steps:
1. Create a new cluster on MongoDB Atlas
2. Create a database user with read/write permissions
3. Whitelist IP address (use 0.0.0.0/0 for development)
4. Navigate to "Connect" then "Connect your application"
5. Copy connection string and replace username, password, and database name in MONGODB_URI

Gmail App Password Setup (Optional, for email notifications):
1. Enable 2-factor authentication on your Gmail account
2. Navigate to Security settings then App passwords
3. Generate a new app password for "Mail"
4. Use the generated 16-character password in EMAIL_PASS variable

Start Backend Server:
```bash
npm run dev
```

Backend server will start on http://localhost:5000
Admin account is automatically seeded on first run with credentials from .env file

### Step 3: Frontend Setup

Install Dependencies:
```bash
cd ../frontend
npm install
```

Configure Environment Variables (Optional):
Create a .env file in the frontend/ directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

Note: If this file is not created, Vite proxy configuration will automatically forward API requests to http://localhost:5000

Start Frontend Development Server:
```bash
npm run dev
```

Frontend application will start on http://localhost:3000

### Step 4: Access Application

Open your web browser and navigate to http://localhost:3000

Default Admin Login Credentials:
- Email: admin@felicity.iiit.ac.in
- Password: Admin@123

To Register as Participant:
- Click "Register here" link on the login page
- Use any email address (IIIT or non-IIIT domain accepted)
- Complete onboarding preferences after registration

## Production Deployment

Live Application URLs:
- Frontend: https://dass-assignment1-eosin.vercel.app
- Backend: https://dass-assignment1-vcqs.onrender.com

Deployment Platforms:
- Frontend: Vercel (Static hosting with CDN)
- Backend: Render (Node.js hosting with auto-scaling)
- Database: MongoDB Atlas (Cloud-hosted database cluster)

## Troubleshooting

Backend server fails to start:
- Verify MongoDB connection string format in .env file
- Ensure MongoDB Atlas IP whitelist includes your IP address
- Check if PORT 5000 is already in use: netstat -ano | findstr :5000
- Kill existing process if port is occupied

Frontend cannot connect to backend:
- Confirm backend server is running on port 5000
- Verify VITE_API_URL in frontend .env file
- Check CORS settings in backend (FRONTEND_URL variable)
- Clear browser cache and restart development servers

Email notifications not working:
- Email functionality is optional - application continues without it
- Verify you are using Gmail App Password (not regular password)
- Confirm 2-factor authentication is enabled on Gmail account
- Check EMAIL_USER and EMAIL_PASS values in backend .env

Database connection timeout:
- Verify internet connection is stable
- Check MongoDB Atlas cluster is active (not paused)
- Ensure IP address is whitelisted in MongoDB Atlas Network Access
- Verify database user credentials are correct

## Project Structure

```
dass_assignment1/
├── backend/
│   ├── models/              # Mongoose schemas (Participant, Organizer, Event, Team, etc.)
│   ├── routes/              # Express route definitions
│   ├── controllers/         # Business logic and request handlers
│   ├── middleware/          # Authentication and validation middleware
│   ├── utils/               # Helper functions (email, QR generation, tokens)
│   ├── config/              # Configuration files
│   ├── scripts/             # Utility scripts (admin seeding)
│   ├── server.js            # Application entry point
│   ├── package.json         # Dependencies and scripts
│   └── .env                 # Environment variables (not in git)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── redux/           # Redux slices and store configuration
│   │   ├── services/        # API integration functions
│   │   ├── utils/           # Helper utilities
│   │   ├── App.jsx          # Root application component
│   │   ├── main.jsx         # React DOM rendering entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite configuration
│   ├── package.json         # Dependencies and scripts
│   └── .env                 # Environment variables (not in git)
│
├── deployment.txt           # Live deployment URLs
└── README.md               # This file
```

## Developer Information

Developer: Swayam Goyal
Course: Design and Analysis of Software Systems (DASS)
Institution: IIIT Hyderabad
Repository: https://github.com/Swayamgoyal/dass_assignment1

