import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { therapistAPI } from '../services/api'
import PatientSelector from './PatientSelector'
import GameParametersPanel from './GameParametersPanel'
import SessionSummaryCards from './SessionSummaryCards'
import ProgressChart from './ProgressChart'
import SessionHistoryTable from './SessionHistoryTable'
import AddChildModal from './AddChildModal'
import '../styles/Dashboard.css'

const TherapistDashboard = () => {
  const { user, logout } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [settings, setSettings] = useState(null)
  const [sessions, setSessions] = useState([])
  const [progressData, setProgressData] = useState(null)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Load children on mount
  useEffect(() => {
    if (user) {
      loadChildren()
    }
  }, [user])

  // Load data when child is selected
  useEffect(() => {
    if (selectedChild) {
      loadChildData()
    }
  }, [selectedChild])

  const loadChildren = async () => {
    try {
      const data = await therapistAPI.getChildren(user.id)
      setChildren(data.children || [])
    } catch (error) {
      showMessage('Error loading children list', 'error')
    }
  }

  const loadChildData = async () => {
    if (!selectedChild) return

    setLoading(true)
    try {
      const [settingsData, sessionsData, progressDataRes] = await Promise.all([
        therapistAPI.getChildSettings(selectedChild),
        therapistAPI.getChildSessions(selectedChild, 1, 50),
        therapistAPI.getChildProgress(selectedChild),
      ])

      setSettings(settingsData.settings)
      setSessions(sessionsData.sessions || [])
      setProgressData(progressDataRes)
    } catch (error) {
      showMessage('Error loading child data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChildAdded = async () => {
    await loadChildren()
    setShowAddChildModal(false)
    showMessage('Child added successfully', 'success')
  }

  const handleSettingsUpdated = async () => {
    await loadChildData()
    showMessage('Settings updated successfully', 'success')
  }

  const handleSessionUpdated = async () => {
    await loadChildData()
    showMessage('Session updated successfully', 'success')
  }

  const handleSessionDeleted = async () => {
    await loadChildData()
    showMessage('Session deleted successfully', 'success')
  }

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  const latestSession = sessions.length > 0 ? sessions[0] : null

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Therapist Dashboard</h1>
            <p>Welcome, {user?.full_name || user?.username}</p>
          </div>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Patient Selection */}
        <PatientSelector
          children={children}
          selectedChild={selectedChild}
          onSelectChild={setSelectedChild}
          onAddChild={() => setShowAddChildModal(true)}
        />

        {selectedChild && !loading && (
          <>
            {/* Game Parameters */}
            <GameParametersPanel
              childId={selectedChild}
              settings={settings}
              onSettingsUpdated={handleSettingsUpdated}
            />

            {/* Latest Session Summary */}
            {latestSession && (
              <SessionSummaryCards session={latestSession} />
            )}

            {/* Progress Chart */}
            {progressData && sessions.length > 0 && (
              <ProgressChart
                progressData={progressData}
                sessions={sessions}
              />
            )}

            {/* Session History */}
            {sessions.length > 0 && (
              <SessionHistoryTable
                sessions={sessions}
                onSessionUpdated={handleSessionUpdated}
                onSessionDeleted={handleSessionDeleted}
              />
            )}

            {sessions.length === 0 && (
              <div className="card empty-state">
                <h3>No sessions yet</h3>
                <p>Sessions will appear here once the child plays the game.</p>
              </div>
            )}
          </>
        )}

        {selectedChild && loading && (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        )}

        {!selectedChild && (
          <div className="card empty-state">
            <h3>Select a Patient</h3>
            <p>Choose a child from the dropdown above or add a new patient to get started.</p>
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <AddChildModal
          therapistId={user.id}
          onClose={() => setShowAddChildModal(false)}
          onChildAdded={handleChildAdded}
        />
      )}
    </div>
  )
}

export default TherapistDashboard
