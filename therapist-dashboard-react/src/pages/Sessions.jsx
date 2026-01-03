import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Calendar,
  Target,
  Timer,
  Users,
  Search,
  Filter,
  ChevronDown,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { childrenAPI, sessionsAPI } from '../services/api';

export default function Sessions() {
  const [children, setChildren] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const childrenRes = await childrenAPI.getAll();
      if (childrenRes.ok) {
        setChildren(childrenRes.children);

        // Load sessions for all children
        const sessionsPromises = childrenRes.children.map((child) =>
          sessionsAPI.getByChild(child.id, 1, 100).then((res) =>
            res.ok
              ? res.sessions.map((s) => ({
                  ...s,
                  childId: child.id,
                  childName: child.fullName,
                }))
              : []
          )
        );

        const sessionsArrays = await Promise.all(sessionsPromises);
        const sessions = sessionsArrays
          .flat()
          .sort((a, b) => new Date(b.sessionStartTime) - new Date(a.sessionStartTime));

        setAllSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return null;
    }
  };

  const filteredSessions = allSessions.filter((session) => {
    // Filter by child
    if (selectedChild !== 'all' && session.childId !== selectedChild) {
      return false;
    }

    // Filter by date
    const dateRange = getDateRange(dateFilter);
    if (dateRange && new Date(session.sessionStartTime) < dateRange) {
      return false;
    }

    // Filter by search
    if (
      searchQuery &&
      !session.childName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate stats
  const stats = {
    totalSessions: filteredSessions.length,
    avgAccuracy:
      filteredSessions.length > 0
        ? (
            filteredSessions.reduce((sum, s) => sum + (s.fishAccuracy || 0), 0) /
            filteredSessions.length
          ).toFixed(1)
        : 0,
    avgReactionTime:
      filteredSessions.length > 0
        ? (
            filteredSessions.reduce((sum, s) => sum + (s.averageReactionTime || 0), 0) /
            filteredSessions.length
          ).toFixed(2)
        : 0,
    totalPlayTime: filteredSessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0),
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="sessions-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Sessions</h1>
          <p>View and analyze all therapy sessions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card mini">
          <ClipboardList size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.totalSessions}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>

        <div className="stat-card mini">
          <Target size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.avgAccuracy}%</span>
            <span className="stat-label">Avg Accuracy</span>
          </div>
        </div>

        <div className="stat-card mini">
          <Timer size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.avgReactionTime}s</span>
            <span className="stat-label">Avg Reaction</span>
          </div>
        </div>

        <div className="stat-card mini">
          <Calendar size={20} />
          <div className="stat-content">
            <span className="stat-value">{formatDuration(stats.totalPlayTime)}</span>
            <span className="stat-label">Total Play Time</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by child name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <Users size={18} />
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              <option value="all">All Children</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>

          <div className="filter-item">
            <Calendar size={18} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      {filteredSessions.length > 0 ? (
        <motion.div
          className="table-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Hand</th>
                <th>Accuracy</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Reaction Time</th>
                <th>Max Streak</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session, index) => (
                <motion.tr
                  key={session._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td>
                    <div className="child-cell">
                      <div className="child-avatar-sm">
                        {session.childName?.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span>{session.childName}</span>
                    </div>
                  </td>
                  <td>{formatDate(session.sessionStartTime)}</td>
                  <td>{formatDuration(session.sessionDuration)}</td>
                  <td>
                    <span className="badge badge-info">
                      {session.handTrackingUsed === true ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        session.fishAccuracy >= 70
                          ? 'badge-success'
                          : session.fishAccuracy >= 50
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {Math.round(session.fishAccuracy || 0)}%
                    </span>
                  </td>
                  <td className="text-success">{session.correctFish || 0}</td>
                  <td className="text-error">{session.wrongFish || 0}</td>
                  <td>{(session.averageReactionTime || 0).toFixed(2)}s</td>
                  <td>
                    <span className="badge badge-primary">{session.maxStreak || 0}</span>
                  </td>
                  <td>
                    <Link
                      to={`/children/${session.childId}`}
                      className="btn btn-ghost btn-sm"
                      title="View Child"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div
          className="empty-state card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ClipboardList size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">No sessions found</h3>
          <p className="empty-state-text">
            {selectedChild !== 'all' || dateFilter !== 'all' || searchQuery
              ? 'Try adjusting your filters'
              : 'Sessions will appear here once children start playing'}
          </p>
        </motion.div>
      )}

      <style>{`
        .sessions-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin-bottom: 0.25rem;
        }

        .page-header p {
          color: var(--gray-500);
          margin: 0;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
        }

        .stat-card.mini {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
        }

        .stat-card.mini svg {
          color: var(--primary-500);
        }

        .stat-card.mini .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-card.mini .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-800);
        }

        .stat-card.mini .stat-label {
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .filters-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          flex: 1;
          max-width: 400px;
        }

        .search-box svg {
          color: var(--gray-400);
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.9375rem;
        }

        .filter-group {
          display: flex;
          gap: 0.75rem;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          position: relative;
        }

        .filter-item svg:first-child {
          color: var(--gray-500);
        }

        .filter-item select {
          appearance: none;
          border: none;
          background: none;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--gray-700);
          padding-right: 1.5rem;
          cursor: pointer;
        }

        .filter-item select:focus {
          outline: none;
        }

        .filter-item svg:last-child {
          position: absolute;
          right: 0.75rem;
          pointer-events: none;
          color: var(--gray-400);
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: none;
          }

          .filter-group {
            flex-direction: column;
          }
        }

        .child-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .child-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-400), var(--accent-mint));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
