# Serious Fishing Therapy System

A complete therapy system featuring a Unity-based fishing game with hand tracking, integrated with a therapist dashboard and backend API for tracking patient progress and managing game parameters.

![Unity Version](https://img.shields.io/badge/Unity-6000.3.1f1-black?logo=unity)
![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green?logo=mongodb)

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the System](#running-the-system)
- [Unity Game Setup](#unity-game-setup)
- [Features](#features)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This system consists of three main components:

1. **Unity Game** (`serious_fishing/`) - A therapeutic fishing game using MediaPipe hand tracking
2. **Backend API** (`backend/`) - Flask REST API with MongoDB for data management
3. **Therapist Dashboard** (`therapist-dashboard-react/`) - React-based web interface for therapists

### How It Works

- Children play the Unity fishing game with hand tracking
- Game sessions are automatically saved to the backend
- Therapists log into the dashboard to view progress and adjust game parameters
- Game difficulty adapts based on therapist-configured settings

## 💻 System Requirements

### For Running the Backend & Dashboard

- **Node.js** v16 or higher
- **Python** 3.8 or higher
- **MongoDB** 5.0 or higher
- **npm** or **yarn**

### For Running/Developing the Unity Game

- **Unity Hub**
- **Unity Editor 6000.3.1f1** (Unity 6)
- **Webcam** (for hand tracking)
- **Windows 10/11** or **macOS 10.15+**
- **8GB RAM minimum** (16GB recommended)

### Additional Requirements

- **Git** for version control
- **Visual Studio Code** or any text editor (for backend/frontend)
- **Visual Studio 2022** or **JetBrains Rider** (recommended for Unity C# development)

## 📁 Project Structure

```
serious_fishing_full/
├── README.md                     # This file
├── AGENTS.md                     # Detailed technical documentation
├── .gitignore                    # Git ignore rules
│
├── backend/                      # Flask API + MongoDB
│   ├── app.py                    # Main Flask application
│   ├── requirements.txt          # Python dependencies
│   └── .venv/                    # Python virtual environment (excluded from git)
│
├── therapist-dashboard-react/    # React dashboard
│   ├── src/                      # React source code
│   ├── public/                   # Static assets
│   ├── package.json              # Node dependencies
│   ├── vite.config.js            # Vite configuration
│   └── node_modules/             # Node packages (excluded from git)
│
└── serious_fishing/              # Unity game project
    ├── Assets/                   # Game assets, scripts, scenes
    │   ├── Scenes/               # Unity scenes
    │   │   └── GameScene.unity   # Main game scene
    │   ├── Scripts/              # C# game scripts
    │   ├── Prefabs/              # Game prefabs
    │   └── MediaPipeUnity/       # Hand tracking integration
    ├── ProjectSettings/          # Unity project configuration
    ├── Packages/                 # Unity package manifest
    └── Library/                  # Unity cache (excluded from git)
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd serious_fishing_full
```

### 2. Install Backend Dependencies

```bash
# Create Python virtual environment
python3 -m venv backend/.venv

# Activate virtual environment
# On macOS/Linux:
source backend/.venv/bin/activate
# On Windows:
backend\.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd therapist-dashboard-react
npm install
cd ..
```

### 4. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 5. Install Unity (For Game Development)

1. Download and install [Unity Hub](https://unity.com/download)
2. Open Unity Hub
3. Go to **Installs** → **Install Editor**
4. Select version **6000.3.1f1** (Unity 6)
5. Include modules:
   - WebGL Build Support (optional)
   - Windows Build Support (if on Mac)
   - Mac Build Support (if on Windows)

## 🎮 Running the System

### Quick Start (All Components)

Open three separate terminal windows:

**Terminal 1 - Backend API:**
```bash
source backend/.venv/bin/activate  # On Windows: backend\.venv\Scripts\activate
python backend/app.py
```
Backend runs on: `http://127.0.0.1:5001`

**Terminal 2 - Therapist Dashboard:**
```bash
cd therapist-dashboard-react
npm run dev
```
Dashboard runs on: `http://localhost:3000`

**Terminal 3 - Unity Game:**
```bash
# Open Unity Hub and open the serious_fishing/ folder as a project
# Or from command line:
open -a "Unity Hub" serious_fishing/  # macOS
# On Windows, open Unity Hub manually and select the serious_fishing folder
```

### First Time Setup

1. **Start MongoDB** (if not running):
   ```bash
   # macOS/Linux
   sudo systemctl start mongodb
   # or with Homebrew
   brew services start mongodb-community
   ```

2. **Create Therapist Account**:
   - Navigate to `http://localhost:3000/register`
   - Register a therapist account
   - Login at `http://localhost:3000/login`

3. **Add a Child Patient**:
   - In the dashboard, click "Add New Child"
   - Fill in child information
   - Child can now login in the Unity game

## 🎯 Unity Game Setup

### Opening the Project for the First Time

1. Open **Unity Hub**
2. Click **Open** → Navigate to `serious_fishing/` folder
3. Unity will import all assets (this may take 5-10 minutes)
4. Once imported, open `Assets/Scenes/GameScene.unity`

### Playing the Game in Unity Editor

1. Ensure backend is running on `http://127.0.0.1:5001`
2. Open `GameScene.unity`
3. Click the **Play** button at the top
4. Login with a child account created from the dashboard
5. Allow webcam access for hand tracking

### Building the Game (Creating Executable)

1. In Unity, go to **File** → **Build Settings**
2. Ensure **GameScene** is in "Scenes In Build"
3. Select your target platform (PC, Mac & Linux Standalone)
4. Click **Build** and choose output folder
5. The executable will be created in the chosen folder

### Important Notes for Unity

- **MediaPipe Package**: The MediaPipe hand tracking library is excluded from git due to size. You may need to install it separately via Unity Package Manager.
- **Backend URL**: Game is configured to connect to `http://127.0.0.1:5001` by default
- **Webcam Required**: The game requires a webcam for hand tracking functionality

## ✨ Features

### Unity Game Features
- ✋ **Hand Tracking**: Real-time hand detection using MediaPipe
- 🎣 **Fishing Mechanics**: Click-to-catch fish gameplay
- 📊 **Performance Tracking**: Accuracy, reaction time, and streak tracking
- 🎯 **Adaptive Difficulty**: Game adjusts based on therapist settings
- 📈 **Session Analytics**: Detailed performance data per session

### Therapist Dashboard Features
- 🔐 **Secure Authentication**: JWT-based therapist login
- 👶 **Patient Management**: Add and manage child accounts
- 🎮 **Game Parameter Control**: Adjust difficulty settings per child
- 📊 **Progress Visualization**: Charts showing performance trends
- 📜 **Session History**: View and edit past game sessions
- 🗺️ **Heatmap Analysis**: Click heatmap visualization
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### Backend API Features
- 🔄 **RESTful API**: Clean API endpoints for all operations
- 🔒 **Authentication**: JWT token-based auth
- 💾 **Data Persistence**: MongoDB for all user and session data
- 📡 **CORS Support**: Cross-origin requests enabled
- 🔐 **Password Security**: Hashed password storage

## 🛠️ Development

### Backend Development

```bash
source backend/.venv/bin/activate
python backend/app.py
```

The Flask app runs with auto-reload enabled in development mode.

### Frontend Development

```bash
cd therapist-dashboard-react
npm run dev
```

Vite provides hot module replacement for instant updates.

### Unity Development

1. Open project in Unity Editor
2. Make changes to C# scripts in `Assets/Scripts/`
3. Test in Play mode
4. Unity auto-compiles on save

### API Documentation

See [AGENTS.md](AGENTS.md) for detailed API endpoint documentation.

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed:**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb
# or
brew services list | grep mongodb
```

**Port 5001 Already in Use:**
Edit `backend/app.py` and change the port number:
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)  # Change port here
```

### Frontend Issues

**Dependencies Not Installing:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS Errors:**
Ensure backend Flask-CORS is configured and backend is running.

### Unity Issues

**Project Won't Open:**
- Verify you're using Unity 6000.3.1f1
- Delete `serious_fishing/Library/` folder and let Unity regenerate it
- Check Unity Hub for missing modules

**MediaPipe Missing:**
The MediaPipe package is large and excluded from git. You may need to:
1. Import MediaPipe Unity Plugin from Package Manager
2. Or follow [MediaPipe Unity Setup](https://github.com/homuler/MediaPipeUnityPlugin)

**Game Can't Connect to Backend:**
- Ensure backend is running on `http://127.0.0.1:5001`
- Check Unity console for connection errors
- Verify firewall isn't blocking connections

## 📝 Notes for Instructors

This repository contains the **source code** for all three components. To review the project:

1. **Code Review**: All source code is in the repository
2. **Running the Game**: Requires Unity Editor (instructions above)
3. **Testing the System**: Follow "Quick Start" to run all components

If you'd like a **pre-built executable** of the Unity game, please request one separately as builds are excluded from version control.

## 📄 License

This project is part of an academic course (ENS491/492).

## 👥 Contributors

Developed as part of the ENS491/492 Final Project.

## 📧 Support

For questions or issues, please refer to the course instructor or create an issue in the repository.

---

**Last Updated**: January 2026
