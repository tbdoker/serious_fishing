import React, { useState, useEffect } from 'react'
import { therapistAPI } from '../services/api'
import '../styles/GameParametersPanel.css'

const GameParametersPanel = ({ childId, settings, onSettingsUpdated }) => {
  const [formData, setFormData] = useState({
    speed: 100,
    spawn_interval: 100,
    spawn_side: 'random',
    session_duration_seconds: 300,
    accuracy_threshold: 70,
    reason: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (settings) {
      setFormData({
        speed: settings.speed || 100,
        spawn_interval: settings.spawn_interval || 100,
        spawn_side: settings.spawn_side || 'random',
        session_duration_seconds: settings.session_duration_seconds || 300,
        accuracy_threshold: settings.accuracy_threshold || 70,
        reason: ''
      })
    }
  }, [settings])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'spawn_side' ? value : parseFloat(value) || 0
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.speed < 10 || formData.speed > 500) {
      setError('Fish speed must be between 10% and 500%')
      return
    }
    if (formData.spawn_interval < 10 || formData.spawn_interval > 500) {
      setError('Spawn speed must be between 10% and 500%')
      return
    }
    if (formData.session_duration_seconds < 30 || formData.session_duration_seconds > 1800) {
      setError('Session duration must be between 30 and 1800 seconds')
      return
    }
    if (formData.accuracy_threshold < 0 || formData.accuracy_threshold > 100) {
      setError('Target accuracy must be between 0% and 100%')
      return
    }

    setSaving(true)
    try {
      await therapistAPI.updateChildSettings(childId, formData)
      onSettingsUpdated()
      setFormData(prev => ({ ...prev, reason: '' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="card game-parameters-card">
      <h2>Game Parameters</h2>
      <p className="card-subtitle">Adjust game difficulty and session settings</p>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="parameters-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="speed">
              Fish Speed: {formData.speed}%
              <span className="helper-text">(10-500%, default: 100%)</span>
            </label>
            <input
              id="speed"
              type="range"
              name="speed"
              min="10"
              max="500"
              step="10"
              value={formData.speed}
              onChange={handleChange}
              className="slider"
            />
          </div>

          <div className="form-group">
            <label htmlFor="spawn_interval">
              Spawn Speed: {formData.spawn_interval}%
              <span className="helper-text">(10-500%, default: 100%)</span>
            </label>
            <input
              id="spawn_interval"
              type="range"
              name="spawn_interval"
              min="10"
              max="500"
              step="10"
              value={formData.spawn_interval}
              onChange={handleChange}
              className="slider"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="spawn_side">
              Spawn Side
              <span className="helper-text">Which side fish appear from</span>
            </label>
            <select
              id="spawn_side"
              name="spawn_side"
              value={formData.spawn_side}
              onChange={handleChange}
              className="form-control"
            >
              <option value="left">Left Only</option>
              <option value="right">Right Only</option>
              <option value="random">Random</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="session_duration_seconds">
              Session Duration: {formatDuration(formData.session_duration_seconds)}
              <span className="helper-text">(30-1800 seconds)</span>
            </label>
            <input
              id="session_duration_seconds"
              type="number"
              name="session_duration_seconds"
              min="30"
              max="1800"
              step="30"
              value={formData.session_duration_seconds}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="accuracy_threshold">
              Target Accuracy: {formData.accuracy_threshold}%
              <span className="helper-text">(0-100%)</span>
            </label>
            <input
              id="accuracy_threshold"
              type="range"
              name="accuracy_threshold"
              min="0"
              max="100"
              step="5"
              value={formData.accuracy_threshold}
              onChange={handleChange}
              className="slider"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">
              Reason for Changes (Optional)
              <span className="helper-text">Document why you changed these settings</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="e.g., Increased difficulty due to improved performance..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

export default GameParametersPanel
