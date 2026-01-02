# Quick Start Guide

## Installation & Running

### 1. Start Backend (with Virtual Environment)

```bash
# Navigate to backend directory
cd /Users/efeyagizkilickaya/ens492/unity_project/backend

# Create and activate virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Initialize database with demo data (first time only)
python init_db.py

# Start Flask backend
python app.py
```

**Or use the startup script:**
```bash
cd /Users/efeyagizkilickaya/ens492/unity_project/backend
./start_backend.sh
```

Backend will be available at `http://localhost:5000`

### 2. Start React Dashboard

In a **new terminal**:

```bash
# Navigate to project directory
cd therapist-dashboard-react

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### 3. Login

- Open `http://localhost:3000`
- Login with demo account: `therapist1` / `password123`

## Prerequisites

- **Python 3.8+** with venv
- **Node.js 16+**
- **MongoDB** running on port 27017
- **Flask backend** running on port 5000

## First Time Setup

1. Start the backend server
2. Start the React development server
3. Open `http://localhost:3000` in your browser
4. Login with a therapist account
5. Add a new child patient
6. Adjust game parameters as needed
7. View sessions after the child plays the game

## Key Features

✅ **Authentication** - Secure JWT-based login
✅ **Patient Management** - Add and select child patients
✅ **Game Parameters** - Adjust difficulty settings with sliders
✅ **Session Summary** - View latest performance metrics
✅ **Progress Chart** - Visualize trends over time
✅ **Session History** - View, edit, and delete sessions
✅ **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

- React 18 + Vite
- React Router for navigation
- Axios for API calls
- Chart.js for data visualization
- date-fns for date formatting

## Project Structure

```
src/
├── components/      # All React components
├── contexts/        # AuthContext for authentication
├── services/        # API service layer
└── styles/          # CSS files
```

## Need Help?

Check [README.md](README.md) for detailed documentation.

## Common Issues

**Can't connect to backend?**
- Verify backend is running on port 5000
- Check CORS settings in Flask

**Login not working?**
- Clear localStorage and try again
- Verify user role is 'therapist'

**Build errors?**
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
