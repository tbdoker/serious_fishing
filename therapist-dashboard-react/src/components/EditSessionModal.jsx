import React, { useState } from 'react'
import { therapistAPI } from '../services/api'
import { format } from 'date-fns'
import '../styles/Modal.css'

const EditSessionModal = ({ session, onClose, onSessionUpdated }) => {
  const [formData, setFormData] = useState({
    score: session.score || 0,
    accuracy: session.accuracy || 0,
    avg_reaction_time: session.avg_reaction_time || 0,
    max_streak: session.max_streak || 0,
    duration_seconds: session.duration_seconds || 0,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.accuracy < 0 || formData.accuracy > 100) {
      setError('Accuracy must be between 0 and 100')
      return
    }

    if (formData.avg_reaction_time < 0) {
      setError('Reaction time cannot be negative')
      return
    }

    if (formData.duration_seconds < 0) {
      setError('Duration cannot be negative')
      return
    }

    setSaving(true)
    try {
      await therapistAPI.updateSession(session._id, formData)
      onSessionUpdated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update session')
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy HH:mm:ss')
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Session</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="session-info">
          <strong>Session Date:</strong> {formatDate(session.start_time)}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="score">Score</label>
              <input
                id="score"
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                className="form-control"
                min="0"
                step="1"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="accuracy">Accuracy (%)</label>
              <input
                id="accuracy"
                type="number"
                name="accuracy"
                value={formData.accuracy}
                onChange={handleChange}
                className="form-control"
                min="0"
                max="100"
                step="0.1"
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="avg_reaction_time">Avg Reaction Time (seconds)</label>
              <input
                id="avg_reaction_time"
                type="number"
                name="avg_reaction_time"
                value={formData.avg_reaction_time}
                onChange={handleChange}
                className="form-control"
                min="0"
                step="0.01"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="max_streak">Max Streak</label>
              <input
                id="max_streak"
                type="number"
                name="max_streak"
                value={formData.max_streak}
                onChange={handleChange}
                className="form-control"
                min="0"
                step="1"
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="duration_seconds">Duration (seconds)</label>
            <input
              id="duration_seconds"
              type="number"
              name="duration_seconds"
              value={formData.duration_seconds}
              onChange={handleChange}
              className="form-control"
              min="0"
              step="1"
              disabled={saving}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditSessionModal
