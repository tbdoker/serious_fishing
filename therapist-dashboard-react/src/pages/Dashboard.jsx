import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ClipboardList,
  Target,
  Timer,
  TrendingUp,
  ArrowRight,
  Activity,
  Calendar,
} from 'lucide-react';
import { dashboardAPI, childrenAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentChildren, setRecentChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, childrenRes] = await Promise.all([
        dashboardAPI.getStats(),
        childrenAPI.getAll(),
      ]);

      if (statsRes.ok) {
        setStats(statsRes.stats);
      }

      if (childrenRes.ok) {
        // Get most recent 5 children by last session or creation date
        const sorted = childrenRes.children
          .sort((a, b) => {
            const aDate = a.lastSession || a.createdAt;
            const bDate = b.lastSession || b.createdAt;
            return new Date(bDate) - new Date(aDate);
          })
          .slice(0, 5);
        setRecentChildren(sorted);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <h1>Welcome back, {user?.firstName}!</h1>
          <p>Here's an overview of your therapy sessions and children's progress.</p>
        </div>
        <div className="welcome-actions">
          <Link to="/children" className="btn btn-primary">
            <Users size={20} />
            View Children
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-card-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Users size={24} />
          </div>
          <div className="stat-card-value">{stats?.childrenCount || 0}</div>
          <div className="stat-card-label">Total Children</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-card-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-card-value">{stats?.totalSessions || 0}</div>
          <div className="stat-card-label">Total Sessions</div>
          <div className="stat-card-change positive">
            <TrendingUp size={14} />
            {stats?.weekSessions || 0} this week
          </div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <Target size={24} />
          </div>
          <div className="stat-card-value">{stats?.avgAccuracy || 0}%</div>
          <div className="stat-card-label">Avg. Accuracy</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-card-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <Timer size={24} />
          </div>
          <div className="stat-card-value">{formatDuration(stats?.totalPlayTime)}</div>
          <div className="stat-card-label">Total Play Time</div>
        </motion.div>
      </motion.div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Children */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h3 className="card-title">Recent Children</h3>
            <Link to="/children" className="btn btn-ghost btn-sm">
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {recentChildren.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-state-icon" />
              <h4 className="empty-state-title">No children yet</h4>
              <p className="empty-state-text">
                Add your first child to start tracking progress.
              </p>
              <Link to="/children" className="btn btn-primary">
                Add Child
              </Link>
            </div>
          ) : (
            <div className="children-list">
              {recentChildren.map((child, index) => (
                <motion.div
                  key={child.id}
                  className="child-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="child-avatar">
                    {child.firstName?.[0]}{child.lastName?.[0]}
                  </div>
                  <div className="child-info">
                    <span className="child-name">{child.fullName}</span>
                    <span className="child-meta">
                      {child.sessionCount} sessions · Last: {formatDate(child.lastSession)}
                    </span>
                  </div>
                  <Link to={`/children/${child.id}`} className="btn btn-ghost btn-sm">
                    <ArrowRight size={18} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3 className="card-title">Today's Activity</h3>
            <span className="badge badge-primary">
              <Calendar size={12} />
              Today
            </span>
          </div>

          <div className="activity-stats">
            <div className="activity-stat">
              <Activity size={20} />
              <div className="activity-stat-content">
                <span className="activity-stat-value">{stats?.todaySessions || 0}</span>
                <span className="activity-stat-label">Sessions Today</span>
              </div>
            </div>

            <div className="activity-stat">
              <TrendingUp size={20} />
              <div className="activity-stat-content">
                <span className="activity-stat-value">{stats?.avgReactionTime?.toFixed(2) || '0.00'}s</span>
                <span className="activity-stat-label">Avg. Reaction Time</span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="action-buttons">
              <Link to="/children" className="action-btn">
                <Users size={20} />
                <span>Add Child</span>
              </Link>
              <Link to="/sessions" className="action-btn">
                <ClipboardList size={20} />
                <span>View Sessions</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }

        .welcome-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          border-radius: var(--border-radius-xl);
          color: white;
          box-shadow: 0 10px 40px rgba(0, 188, 212, 0.3);
        }

        .welcome-content h1 {
          color: white;
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .welcome-content p {
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }

        .welcome-actions .btn {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
        }

        .welcome-actions .btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .welcome-section {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .children-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .child-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem;
          border-radius: var(--border-radius);
          background: var(--gray-50);
          transition: all 0.2s;
        }

        .child-item:hover {
          background: var(--gray-100);
        }

        .child-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-400), var(--accent-mint));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .child-info {
          flex: 1;
          min-width: 0;
        }

        .child-name {
          display: block;
          font-weight: 600;
          color: var(--gray-800);
        }

        .child-meta {
          display: block;
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .child-accuracy {
          flex-shrink: 0;
        }

        .accuracy-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.625rem;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .accuracy-badge.good {
          background: var(--success-light);
          color: var(--success);
        }

        .accuracy-badge.medium {
          background: var(--warning-light);
          color: var(--warning);
        }

        .accuracy-badge.low {
          background: var(--error-light);
          color: var(--error);
        }

        .accuracy-badge.neutral {
          background: var(--gray-100);
          color: var(--gray-400);
        }

        .activity-stats {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-stat {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          color: var(--primary-600);
        }

        .activity-stat-content {
          display: flex;
          flex-direction: column;
        }

        .activity-stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-800);
        }

        .activity-stat-label {
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .quick-actions h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 0.75rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--primary-50);
          border-radius: var(--border-radius);
          color: var(--primary-700);
          font-weight: 500;
          font-size: 0.8125rem;
          text-decoration: none;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--primary-100);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
