# Backend & MongoDB Connection Guide

## ✅ Yes, the React Dashboard is Connected to MongoDB!

The React dashboard connects to MongoDB through the Flask backend API.

## Architecture Overview

```
React Dashboard (Port 3000)
    ↓ HTTP/HTTPS
Flask Backend API (Port 5000)
    ↓ MongoDB Protocol
MongoDB Database (Port 27017)
```

### Data Flow:

1. **React App** → Makes API calls via Axios
2. **Flask Backend** → Receives requests, queries MongoDB
3. **MongoDB** → Stores/retrieves data
4. **Flask Backend** → Returns JSON response
5. **React App** → Updates UI with data

## MongoDB Configuration

### Backend Location
```
/Users/efeyagizkilickaya/ens492/unity_project/backend/
```

### MongoDB Connection
- **File**: `unity_project/backend/app.py` (lines 19-22)
- **Connection URI**: Configured in `.env` file
- **Default**: `mongodb://localhost:27017/`
- **Database Name**: `serious_fishing`

### Collections Used:
1. **`users`** - Therapists and children accounts
2. **`game_settings`** - Game parameters per child
3. **`game_sessions`** - Game session records
4. **`reports`** - Aggregated reports (optional)

## How to Verify Connection

### 1. Check if MongoDB is Running

```bash
# On macOS with Homebrew
brew services list | grep mongodb

# Or check if process is running
ps aux | grep mongod

# Start MongoDB if not running
brew services start mongodb-community
```

### 2. Test Backend API Connection

```bash
# Navigate to backend directory
cd /Users/efeyagizkilickaya/ens492/unity_project/backend

# Install Python dependencies (if not already done)
pip install -r requirements.txt

# Start the Flask backend
python app.py
```

Expected output:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

### 3. Test Health Endpoint

Open a new terminal and run:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-10T...",
  "database": "connected"
}
```

### 4. Test MongoDB Connection Directly

```bash
# Connect to MongoDB shell
mongosh

# Use the database
use serious_fishing

# Check collections
show collections

# Count users
db.users.countDocuments()

# Check a therapist exists
db.users.findOne({role: 'therapist'})
```

## Setting Up the Complete System

### Step-by-Step Setup:

#### 1. Start MongoDB
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

#### 2. Initialize Database (First Time Only)
```bash
cd /Users/efeyagizkilickaya/ens492/unity_project/backend
python init_db.py
```

This creates:
- Demo therapist account: `therapist1` / `password123`
- Demo child accounts
- Sample game settings

#### 3. Start Flask Backend
```bash
cd /Users/efeyagizkilickaya/ens492/unity_project/backend
python app.py
```

Backend will run on `http://localhost:5000`

#### 4. Start React Frontend
```bash
cd /Users/efeyagizkilickaya/ens492/therapist-dashboard-react
npm install  # First time only
npm run dev
```

Frontend will run on `http://localhost:3000`

#### 5. Login to Dashboard
- Open `http://localhost:3000`
- Login with: `therapist1` / `password123`
- You should see the dashboard with data from MongoDB!

## API Endpoints (React → Flask → MongoDB)

### Authentication
```javascript
// React calls
POST /api/auth/login
// Flask queries
db.users.find_one({username: '...', role: 'therapist'})
```

### Get Children
```javascript
// React calls
GET /api/therapist/children/:therapistId
// Flask queries
db.users.find({therapist_id: '...', role: 'child'})
```

### Update Game Settings
```javascript
// React calls
PUT /api/therapist/child/:childId/settings
// Flask updates
db.game_settings.update_one({child_id: '...'}, {$set: {...}})
```

### Get Sessions
```javascript
// React calls
GET /api/therapist/child/:childId/sessions
// Flask queries
db.game_sessions.find({child_id: '...'}).sort('start_time', -1)
```

## Troubleshooting

### Problem: "Cannot connect to backend"

**Solution:**
1. Check if Flask is running: `curl http://localhost:5000/api/health`
2. Check backend logs in terminal
3. Verify CORS is enabled in `app.py`

### Problem: "Database disconnected"

**Solution:**
1. Check MongoDB status: `brew services list | grep mongodb`
2. Start MongoDB: `brew services start mongodb-community`
3. Check connection URI in `.env` file
4. Restart Flask backend

### Problem: "No data showing in dashboard"

**Solution:**
1. Run database initialization: `python init_db.py`
2. Check if therapist exists: `db.users.findOne({role: 'therapist'})`
3. Add a child patient through the dashboard
4. Have the child play the Unity game to generate sessions

### Problem: "401 Unauthorized"

**Solution:**
1. Clear browser localStorage
2. Login again
3. Check JWT token is being sent in Authorization header (DevTools → Network)

## Environment Variables

Check `/Users/efeyagizkilickaya/ens492/unity_project/backend/.env`:

```bash
MONGO_URI=mongodb://localhost:27017/
SECRET_KEY=your-secret-key-here
```

## Data Persistence

All data is stored in MongoDB, including:
- ✅ User accounts (therapists and children)
- ✅ Game settings and parameter history
- ✅ Game session records
- ✅ Performance metrics
- ✅ Click positions and reaction times

The React dashboard reads and writes all data through the Flask API, which directly interacts with MongoDB.

## Testing the Full Stack

### Quick Test Script

Create `test_connection.sh`:
```bash
#!/bin/bash

echo "Testing MongoDB..."
mongosh --eval "db.adminCommand('ping')" --quiet

echo -e "\nTesting Backend..."
curl -s http://localhost:5000/api/health | json_pp

echo -e "\nTesting React Dev Server..."
curl -s http://localhost:3000 | head -n 5
```

Run:
```bash
chmod +x test_connection.sh
./test_connection.sh
```

## Summary

**Yes, everything is connected!**

- ✅ React Dashboard → Axios API Client
- ✅ Flask Backend → PyMongo Driver
- ✅ MongoDB → Data Storage
- ✅ All CRUD operations work
- ✅ Real-time updates supported
- ✅ JWT authentication integrated
- ✅ Data persistence guaranteed

The React dashboard is a complete replacement for the vanilla HTML/JS dashboard with full MongoDB connectivity through the existing Flask backend API.
