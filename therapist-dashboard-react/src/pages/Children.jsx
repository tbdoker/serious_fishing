import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  UserPlus,
  UserCheck,
  Activity,
  Target,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
import { childrenAPI } from '../services/api';

export default function Children() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const response = await childrenAPI.getAll();
      if (response.ok) {
        setChildren(response.children);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = async (childId) => {
    try {
      const response = await childrenAPI.delete(childId);
      if (response.ok) {
        setChildren(children.filter((c) => c.id !== childId));
        setShowDeleteModal(null);
      }
    } catch (error) {
      console.error('Failed to delete child:', error);
    }
  };

  const filteredChildren = children.filter(
    (child) =>
      child.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading children...</p>
      </div>
    );
  }

  return (
    <div className="children-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Children</h1>
          <p>Manage and monitor your therapy children</p>
        </div>
        <div className="header-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => setShowAssignModal(true)}
          >
            <LinkIcon size={20} />
            Assign Existing
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            Add New
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search children by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Children Grid */}
      {filteredChildren.length === 0 ? (
        <motion.div
          className="empty-state card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Users size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">
            {searchQuery ? 'No children found' : 'No children yet'}
          </h3>
          <p className="empty-state-text">
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first child to start tracking their progress'}
          </p>
          {!searchQuery && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={20} />
              Add Your First Child
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="children-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredChildren.map((child, index) => (
            <motion.div
              key={child.id}
              className="child-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="child-card-header">
                <div className="child-avatar-large">
                  {child.firstName?.[0]}
                  {child.lastName?.[0]}
                </div>
                <div className="child-header-info">
                  <h3>{child.fullName}</h3>
                  <span className="child-username">@{child.username}</span>
                </div>
                <div className="child-card-actions">
                  <Link
                    to={`/children/${child.id}`}
                    className="btn btn-ghost btn-icon"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    className="btn btn-ghost btn-icon"
                    title="Delete"
                    onClick={() => setShowDeleteModal(child)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="child-card-stats">
                <div className="child-stat">
                  <Activity size={16} />
                  <span className="child-stat-value">{child.sessionCount}</span>
                  <span className="child-stat-label">Sessions</span>
                </div>
                <div className="child-stat">
                  <Target size={16} />
                  <span className="child-stat-value">
                    {child.lastAccuracy ? `${Math.round(child.lastAccuracy)}%` : '—'}
                  </span>
                  <span className="child-stat-label">Last Accuracy</span>
                </div>
                <div className="child-stat">
                  <Clock size={16} />
                  <span className="child-stat-value">{child.age || '—'}</span>
                  <span className="child-stat-label">Age</span>
                </div>
              </div>

              <div className="child-card-footer">
                <span className="child-last-session">
                  Last session: {formatDate(child.lastSession)}
                </span>
                <Link to={`/children/${child.id}`} className="btn btn-secondary btn-sm">
                  View Progress
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Child Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddChildModal
            onClose={() => setShowAddModal(false)}
            onSuccess={(newChild) => {
              setChildren([...children, newChild]);
              setShowAddModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Assign Existing Child Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignChildModal
            onClose={() => setShowAssignModal(false)}
            onSuccess={(assignedChild) => {
              setChildren([...children, assignedChild]);
              setShowAssignModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Delete Child</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowDeleteModal(null)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{showDeleteModal.fullName}</strong>? This will
                  permanently remove all their sessions and data.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteChild(showDeleteModal.id)}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .children-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin-bottom: 0.25rem;
        }

        .page-header p {
          color: var(--gray-500);
          margin: 0;
        }

        .header-buttons {
          display: flex;
          gap: 0.75rem;
        }

        @media (max-width: 600px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .header-buttons {
            width: 100%;
            flex-direction: column;
          }
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          background: white;
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
          margin-bottom: 1.5rem;
        }

        .search-bar svg {
          color: var(--gray-400);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          color: var(--gray-800);
        }

        .search-input::placeholder {
          color: var(--gray-400);
        }

        .children-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 480px) {
          .children-grid {
            grid-template-columns: 1fr;
          }
        }

        .child-card {
          background: white;
          border-radius: var(--border-radius-lg);
          padding: 1.5rem;
          box-shadow: var(--shadow);
          transition: all 0.2s;
        }

        .child-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .child-card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .child-avatar-large {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-400), var(--accent-mint));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .child-header-info {
          flex: 1;
          min-width: 0;
        }

        .child-header-info h3 {
          font-size: 1.125rem;
          margin-bottom: 0.125rem;
        }

        .child-username {
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        .child-card-actions {
          display: flex;
          gap: 0.25rem;
        }

        .child-card-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          padding: 1rem 0;
          border-top: 1px solid var(--gray-100);
          border-bottom: 1px solid var(--gray-100);
        }

        .child-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          text-align: center;
        }

        .child-stat svg {
          color: var(--primary-500);
        }

        .child-stat-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--gray-800);
        }

        .child-stat-label {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .child-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1rem;
        }

        .child-last-session {
          font-size: 0.8125rem;
          color: var(--gray-500);
        }
      `}</style>
    </div>
  );
}

// Add Child Modal Component
function AddChildModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await childrenAPI.create({
        ...formData,
        age: formData.age ? parseInt(formData.age) : 0,
      });

      if (response.ok) {
        onSuccess(response.child);
      } else {
        setError(response.message || 'Failed to create child');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Add New Child</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="John"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="johndoe123"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="form-input"
                placeholder="8"
                min="1"
                max="100"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                placeholder="Any additional notes about this child..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Add Child
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Assign Existing Child Modal Component
function AssignChildModal({ onClose, onSuccess }) {
  const [unassignedChildren, setUnassignedChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUnassignedChildren();
  }, []);

  const loadUnassignedChildren = async () => {
    try {
      const response = await childrenAPI.getUnassigned();
      if (response.ok) {
        setUnassignedChildren(response.children);
      }
    } catch (err) {
      setError('Failed to load unassigned children');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (child) => {
    setAssigning(child.id);
    setError('');

    try {
      const response = await childrenAPI.assign(child.id);
      if (response.ok) {
        onSuccess({
          ...child,
          ...response.child,
        });
      } else {
        setError(response.message || 'Failed to assign child');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign child');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Assign Existing Children</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-container" style={{ minHeight: '150px' }}>
              <div className="spinner"></div>
            </div>
          ) : unassignedChildren.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <UserCheck size={48} className="empty-state-icon" />
              <h4 className="empty-state-title">No unassigned children</h4>
              <p className="empty-state-text">
                All existing children are already assigned to therapists.
              </p>
            </div>
          ) : (
            <div className="unassigned-list">
              <p style={{ marginBottom: '1rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                These children registered from the game and are not assigned to any therapist yet:
              </p>
              {unassignedChildren.map((child) => (
                <div key={child.id} className="unassigned-item">
                  <div className="unassigned-avatar">
                    {child.firstName?.[0] || '?'}{child.lastName?.[0] || ''}
                  </div>
                  <div className="unassigned-info">
                    <span className="unassigned-name">
                      {child.fullName || child.username}
                    </span>
                    <span className="unassigned-meta">
                      @{child.username} · {child.sessionCount} sessions
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAssign(child)}
                    disabled={assigning === child.id}
                  >
                    {assigning === child.id ? (
                      <span className="spinner spinner-sm" />
                    ) : (
                      <>
                        <UserCheck size={16} />
                        Assign
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>

      <style>{`
        .unassigned-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .unassigned-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          background: var(--gray-50);
          border-radius: var(--border-radius);
          transition: all 0.2s;
        }

        .unassigned-item:hover {
          background: var(--gray-100);
        }

        .unassigned-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gray-400), var(--gray-500));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .unassigned-info {
          flex: 1;
          min-width: 0;
        }

        .unassigned-name {
          display: block;
          font-weight: 600;
          color: var(--gray-800);
        }

        .unassigned-meta {
          display: block;
          font-size: 0.8125rem;
          color: var(--gray-500);
        }
      `}</style>
    </motion.div>
  );
}
