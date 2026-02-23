# Felicity Event Management System

A comprehensive event management system built with the MERN stack for managing college fest events, clubs, and participants.

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
