# Serious Fishing Therapy System — Agent Guide

A full-stack system consisting of:

- `backend/`: Flask API + MongoDB (default `http://127.0.0.1:5001`)
- `therapist-dashboard-react/`: React/Vite therapist dashboard (default `http://localhost:3000`)
- `serious_fishing/`: Unity game project (talks to the backend at `http://127.0.0.1:5001`)

This file is written for coding agents: how to run the stack, where to make changes, and which ports/paths are actually used.

## Quick Start (Local Dev)

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (3.8+ recommended)
- **MongoDB** running on `mongodb://localhost:27017` (default)

### 1) Start the Backend API

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
python backend/app.py
```

Backend listens on `http://127.0.0.1:5001` (see `backend/app.py`).

### 2) Start the Therapist Dashboard

```bash
npm install --prefix therapist-dashboard-react
npm run dev --prefix therapist-dashboard-react
```

Dashboard runs at `http://localhost:3000`.

### 3) Create a Therapist Account

On first run (empty DB), register at `http://localhost:3000/register`, then log in at `http://localhost:3000/login`.

## Therapist Dashboard Features

- **Authentication**: Secure login system for therapists with JWT token management
- **Patient Management**: Add, view, and select child patients
- **Game Parameters Control**: Adjust fish speed, spawn intervals, spawn side, session duration, and accuracy thresholds
- **Real-time Session Tracking**: View the latest session summary with key performance metrics
- **Progress Visualization**: Interactive Chart.js charts showing performance trends and parameter changes over time
- **Session History**: Complete table view of all game sessions with edit and delete capabilities
- **Responsive Design**: Mobile-friendly interface that works on all device sizes
- **Modal Dialogs**: User-friendly modals for adding children and editing sessions

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Chart.js & react-chartjs-2** - Data visualization
- **date-fns** - Date formatting and manipulation
- **Vite** - Fast build tool and dev server
- **CSS3** - Modern styling with gradients, animations, and responsive design

## Project Structure

```
.
├── AGENTS.md                  # This file
├── backend/                   # Flask API (MongoDB)
│   ├── app.py
│   └── requirements.txt
├── therapist-dashboard-react/ # React dashboard (Vite)
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       └── styles/
└── serious_fishing/           # Unity project (C#)
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Python** (3.8+ recommended)
- **MongoDB** running on port 27017
- **Backend API** running on `http://127.0.0.1:5001`

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd therapist-dashboard-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend Configuration

The dashboard expects the Flask backend API to be running at `http://127.0.0.1:5001`.

If your backend is running on a different port or host, update the `API_BASE_URL` in:
- `therapist-dashboard-react/src/services/api.js`

The Vite proxy is configured in `therapist-dashboard-react/vite.config.js` to forward `/api` requests to the backend.

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - Therapist login
- `POST /api/auth/register` - Therapist registration
- `GET /api/auth/verify` - Token verification

### Therapist Operations
- `GET /api/therapist/dashboard/stats` - Therapist overview stats
- `GET /api/therapist/children` - Get therapist's children
- `POST /api/therapist/children` - Add child patient (assigned to therapist)
- `GET /api/therapist/unassigned-children` - List children without a therapist
- `POST /api/therapist/assign-child` - Assign an unassigned child
- `GET /api/therapist/children/:childId/settings` - Get child's game settings
- `PUT /api/therapist/children/:childId/settings` - Update game parameters
- `GET /api/therapist/children/:childId/sessions` - Get child's sessions
- `GET /api/therapist/children/:childId/progress` - Get progress data
- `GET /api/therapist/children/:childId/heatmap` - Get click heatmap data
- `GET /api/therapist/sessions/:sessionId` - Get session details
- `PUT /api/therapist/sessions/:sessionId` - Update session data
- `DELETE /api/therapist/sessions/:sessionId` - Delete session

### Unity Game Operations
- `POST /register` - Register user (defaults to `role=child`)
- `POST /login` - Login user (plain password)
- `GET|POST /game-settings` - Get/update per-user settings
- `POST /save-session` - Upload a gameplay session

## Usage Guide

### Login
1. Navigate to the application
2. Enter your therapist username and password
3. Click "Login"

### Managing Patients
1. Click "Add New Child" to register a new patient
2. Fill in the required information (username, password, full name)
3. Optionally add birth date and notes
4. Select a child from the dropdown to view their data

### Adjusting Game Parameters
1. Select a child patient
2. Use the sliders and inputs to adjust:
   - Fish Speed (10-500%)
   - Spawn Speed (10-500%)
   - Spawn Side (left/right/random)
   - Session Duration (30-1800 seconds)
   - Target Accuracy (0-100%)
3. Optionally add a reason for the changes
4. Click "Save Settings"

### Viewing Progress
- **Latest Session Summary**: Cards showing score, accuracy, reaction time, and max streak
- **Progress Chart**: Multi-axis chart showing performance metrics and parameter changes over time
- **Session History**: Complete table with all sessions

### Editing Sessions
1. Click the edit (✏️) button on any session in the history table
2. Modify the session data
3. Click "Save Changes"

### Deleting Sessions
1. Click the delete (🗑️) button on any session
2. Confirm the deletion

## Component Documentation

### TherapistDashboard
Main dashboard component that orchestrates all child components and manages global state.

### PatientSelector
Dropdown selector for choosing which child patient to view, with an "Add Child" button.

### GameParametersPanel
Form with sliders and inputs for adjusting game difficulty parameters. Includes validation and reason tracking.

### SessionSummaryCards
Grid of cards displaying the latest session's key metrics with icons and colors.

### ProgressChart
Chart.js line chart with multiple Y-axes showing performance trends and parameter changes.

### SessionHistoryTable
Responsive table showing all sessions with edit and delete actions.

### AddChildModal
Modal dialog for adding new child patients to the system.

### EditSessionModal
Modal dialog for editing session statistics.

### AuthContext
React context providing authentication state and methods throughout the app.

## Styling

The application uses a medical-themed blue color scheme:
- Primary: `#1976d2`, `#0d47a1`
- Success: `#2e7d32`
- Error: `#c62828`
- Gradients for modern look

Responsive breakpoints:
- Desktop: > 900px
- Tablet: 768px - 900px
- Mobile: < 768px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Backend Connection Issues
- Ensure the Flask backend is running on `http://127.0.0.1:5001`
- Ensure MongoDB is running on `mongodb://localhost:27017`
- Check browser console for CORS errors
- Verify Flask-CORS is configured correctly

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Authentication Issues
- Clear localStorage: Open DevTools → Application → Local Storage → Clear
- Verify JWT token is being sent in Authorization header

## Development Tips

- Use React DevTools for debugging component state
- Check Network tab in DevTools for API requests
- Enable React StrictMode warnings in development
- Keep changes consistent with existing React/Flask style (no lint/test suite is configured in this repo)

## Future Enhancements

- Real-time updates with WebSockets
- Export session data to CSV/PDF
- Advanced filtering and search
- Dark mode toggle
- Internationalization (i18n)
- Unit and integration tests
- TypeScript migration

## License

This project is part of the Serious Fishing Therapy System.

## Contact

For issues or questions, contact the development team.
