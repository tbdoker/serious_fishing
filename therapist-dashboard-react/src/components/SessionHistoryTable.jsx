import React, { useState } from 'react'
import { format } from 'date-fns'
import { therapistAPI } from '../services/api'
import EditSessionModal from './EditSessionModal'
import '../styles/SessionHistoryTable.css'

const SessionHistoryTable = ({ sessions, onSessionUpdated, onSessionDeleted }) => {
  const [editingSession, setEditingSession] = useState(null)
  const [deletingSessionId, setDeletingSessionId] = useState(null)

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return 'Unknown'
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    setDeletingSessionId(sessionId)
    try {
      await therapistAPI.deleteSession(sessionId)
      onSessionDeleted()
    } catch (error) {
      alert('Failed to delete session')
    } finally {
      setDeletingSessionId(null)
    }
  }

  return (
    <div className="card session-history-card">
      <h2>Session History</h2>
      <p className="card-subtitle">View and manage all game sessions</p>

      <div className="table-wrapper">
        <table className="session-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Reaction Time</th>
              <th>Max Streak</th>
              <th>Fish Speed</th>
              <th>Spawn Speed</th>
              <th>Spawn Side</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id}>
                <td data-label="Date & Time">{formatDate(session.start_time)}</td>
                <td data-label="Duration">{formatDuration(session.duration_seconds)}</td>
                <td data-label="Score" className="stat-cell">{session.score || 0}</td>
                <td data-label="Accuracy" className="stat-cell">
                  {(session.accuracy || 0).toFixed(1)}%
                </td>
                <td data-label="Reaction Time" className="stat-cell">
                  {(session.avg_reaction_time || 0).toFixed(2)}s
                </td>
                <td data-label="Max Streak" className="stat-cell">{session.max_streak || 0}</td>
                <td data-label="Fish Speed" className="param-cell">
                  {session.settings_snapshot?.speed || 100}%
                </td>
                <td data-label="Spawn Speed" className="param-cell">
                  {session.settings_snapshot?.spawn_interval || 100}%
                </td>
                <td data-label="Spawn Side" className="param-cell">
                  {session.settings_snapshot?.spawn_side || 'random'}
                </td>
                <td data-label="Actions" className="actions-cell">
                  <button
                    onClick={() => setEditingSession(session)}
                    className="btn-icon btn-edit"
                    title="Edit session"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(session._id)}
                    className="btn-icon btn-delete"
                    title="Delete session"
                    disabled={deletingSessionId === session._id}
                  >
                    {deletingSessionId === session._id ? '⏳' : '🗑️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSessionUpdated={onSessionUpdated}
        />
      )}
    </div>
  )
}

export default SessionHistoryTable
