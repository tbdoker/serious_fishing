import React from 'react'
import { format } from 'date-fns'
import '../styles/SessionSummaryCards.css'

const SessionSummaryCards = ({ session }) => {
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

  const cards = [
    {
      title: 'Score',
      value: session.score || 0,
      icon: '🎯',
      color: '#1976d2'
    },
    {
      title: 'Accuracy',
      value: `${(session.accuracy || 0).toFixed(1)}%`,
      icon: '📊',
      color: '#2e7d32'
    },
    {
      title: 'Avg Reaction Time',
      value: `${(session.avg_reaction_time || 0).toFixed(2)}s`,
      icon: '⚡',
      color: '#f57c00'
    },
    {
      title: 'Max Streak',
      value: session.max_streak || 0,
      icon: '🔥',
      color: '#c62828'
    }
  ]

  return (
    <div className="session-summary">
      <div className="summary-header">
        <h2>Latest Session Summary</h2>
        <span className="session-date">{formatDate(session.start_time)}</span>
      </div>

      <div className="summary-cards">
        {cards.map((card, index) => (
          <div key={index} className="stat-card" style={{ borderTopColor: card.color }}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{card.title}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="session-details">
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{formatDuration(session.duration_seconds)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Correct Fish:</span>
          <span className="detail-value">{session.correct_fish || 0}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Wrong Fish:</span>
          <span className="detail-value">{session.wrong_fish || 0}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Missed Fish:</span>
          <span className="detail-value">{session.missed_fish || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default SessionSummaryCards
