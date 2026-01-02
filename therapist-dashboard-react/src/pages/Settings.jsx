import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  LogOut,
  Mail,
  Key,
  Save,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    sessionAlerts: true,
    weeklyReports: true,
    progressUpdates: true,
  });

  const handleProfileSave = () => {
    // In a real app, this would call an API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar card">
          <nav className="settings-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon size={20} />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeSection === 'profile' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-header">
                <h3 className="card-title">Profile Information</h3>
              </div>

              <div className="profile-section">
                <div className="profile-avatar">
                  <div className="avatar-large">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <button className="btn btn-secondary btn-sm">Change Photo</button>
                </div>

                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.firstName}
                        onChange={(e) =>
                          setProfile({ ...profile, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile({ ...profile, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-icon-wrapper">
                      <Mail size={18} />
                      <input
                        type="email"
                        className="form-input"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user?.username || ''}
                      disabled
                    />
                    <span className="form-hint">Username cannot be changed</span>
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleProfileSave}
                    >
                      {saved ? (
                        <>
                          <Check size={18} />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-header">
                <h3 className="card-title">Notification Preferences</h3>
              </div>

              <div className="notifications-list">
                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Email Notifications</h4>
                    <p>Receive important updates via email</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          emailNotifications: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Session Alerts</h4>
                    <p>Get notified when a child completes a session</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.sessionAlerts}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          sessionAlerts: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Weekly Reports</h4>
                    <p>Receive weekly summary of all children's progress</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReports}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          weeklyReports: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Progress Updates</h4>
                    <p>Get notified about significant progress milestones</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={notifications.progressUpdates}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          progressUpdates: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-header">
                <h3 className="card-title">Security Settings</h3>
              </div>

              <div className="security-section">
                <div className="security-item">
                  <div className="security-icon">
                    <Key size={24} />
                  </div>
                  <div className="security-info">
                    <h4>Change Password</h4>
                    <p>Update your account password</p>
                  </div>
                  <button className="btn btn-secondary btn-sm">Change</button>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    <Shield size={24} />
                  </div>
                  <div className="security-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security</p>
                  </div>
                  <button className="btn btn-secondary btn-sm">Enable</button>
                </div>

                <div className="security-item">
                  <div className="security-icon danger">
                    <LogOut size={24} />
                  </div>
                  <div className="security-info">
                    <h4>Active Sessions</h4>
                    <p>Manage your logged-in devices</p>
                  </div>
                  <button className="btn btn-secondary btn-sm">Manage</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-header">
                <h3 className="card-title">Appearance</h3>
              </div>

              <div className="appearance-section">
                <div className="theme-options">
                  <h4>Theme</h4>
                  <div className="theme-grid">
                    <button className="theme-option active">
                      <div className="theme-preview light"></div>
                      <span>Light</span>
                    </button>
                    <button className="theme-option">
                      <div className="theme-preview dark"></div>
                      <span>Dark</span>
                    </button>
                    <button className="theme-option">
                      <div className="theme-preview system"></div>
                      <span>System</span>
                    </button>
                  </div>
                </div>

                <div className="color-options">
                  <h4>Accent Color</h4>
                  <div className="color-grid">
                    <button className="color-option active" style={{ background: '#00bcd4' }}></button>
                    <button className="color-option" style={{ background: '#2196f3' }}></button>
                    <button className="color-option" style={{ background: '#9c27b0' }}></button>
                    <button className="color-option" style={{ background: '#ff5722' }}></button>
                    <button className="color-option" style={{ background: '#4caf50' }}></button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'help' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="card-header">
                <h3 className="card-title">Help & Support</h3>
              </div>

              <div className="help-section">
                <div className="help-item">
                  <h4>Documentation</h4>
                  <p>Learn how to use the Serious Fishing therapy platform</p>
                  <a href="#" className="btn btn-secondary btn-sm">View Docs</a>
                </div>

                <div className="help-item">
                  <h4>Contact Support</h4>
                  <p>Get help from our support team</p>
                  <a href="mailto:support@seriousfishing.com" className="btn btn-secondary btn-sm">
                    Email Support
                  </a>
                </div>

                <div className="help-item">
                  <h4>FAQs</h4>
                  <p>Find answers to frequently asked questions</p>
                  <a href="#" className="btn btn-secondary btn-sm">View FAQs</a>
                </div>

                <div className="version-info">
                  <span>Serious Fishing Dashboard v1.0.0</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        .settings-page {
          max-width: 1200px;
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

        .settings-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
        }

        .settings-sidebar {
          display: flex;
          flex-direction: column;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.5rem;
        }

        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: var(--border-radius);
          background: none;
          color: var(--gray-600);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .settings-nav-item:hover {
          background: var(--gray-100);
          color: var(--gray-800);
        }

        .settings-nav-item.active {
          background: var(--primary-50);
          color: var(--primary-700);
        }

        .settings-sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--gray-100);
          margin-top: auto;
        }

        .settings-sidebar-footer .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: var(--border-radius);
          background: var(--error-light);
          color: var(--error);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-sidebar-footer .logout-btn:hover {
          background: var(--error);
          color: white;
        }

        /* Profile Section */
        .profile-section {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2rem;
        }

        @media (max-width: 600px) {
          .profile-section {
            grid-template-columns: 1fr;
          }
        }

        .profile-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-400), var(--accent-mint));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 2rem;
        }

        .profile-form {
          flex: 1;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .input-icon-wrapper {
          position: relative;
        }

        .input-icon-wrapper svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        .input-icon-wrapper .form-input {
          padding-left: 2.75rem;
        }

        .form-hint {
          display: block;
          margin-top: 0.375rem;
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .form-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        /* Notifications */
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .notification-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .notification-info h4 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .notification-info p {
          font-size: 0.8125rem;
          color: var(--gray-500);
          margin: 0;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--gray-300);
          transition: 0.3s;
          border-radius: 26px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle input:checked + .toggle-slider {
          background-color: var(--primary-500);
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }

        /* Security */
        .security-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .security-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .security-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--border-radius);
          background: var(--primary-50);
          color: var(--primary-600);
        }

        .security-icon.danger {
          background: var(--error-light);
          color: var(--error);
        }

        .security-info {
          flex: 1;
        }

        .security-info h4 {
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
        }

        .security-info p {
          font-size: 0.8125rem;
          color: var(--gray-500);
          margin: 0;
        }

        /* Appearance */
        .appearance-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .theme-options h4,
        .color-options h4 {
          font-size: 0.9375rem;
          margin-bottom: 1rem;
        }

        .theme-grid {
          display: flex;
          gap: 1rem;
        }

        .theme-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 2px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-option:hover {
          border-color: var(--gray-300);
        }

        .theme-option.active {
          border-color: var(--primary-500);
        }

        .theme-preview {
          width: 80px;
          height: 50px;
          border-radius: 6px;
          border: 1px solid var(--gray-200);
        }

        .theme-preview.light {
          background: linear-gradient(to bottom, #f9fafb 50%, white 50%);
        }

        .theme-preview.dark {
          background: linear-gradient(to bottom, #1f2937 50%, #111827 50%);
        }

        .theme-preview.system {
          background: linear-gradient(to right,
            #f9fafb 0%, #f9fafb 50%,
            #1f2937 50%, #1f2937 100%);
        }

        .color-grid {
          display: flex;
          gap: 0.75rem;
        }

        .color-option {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.active {
          border-color: var(--gray-800);
          box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
        }

        /* Help */
        .help-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .help-item {
          padding: 1.25rem;
          background: var(--gray-50);
          border-radius: var(--border-radius);
        }

        .help-item h4 {
          font-size: 1rem;
          margin-bottom: 0.375rem;
        }

        .help-item p {
          font-size: 0.875rem;
          color: var(--gray-500);
          margin-bottom: 0.75rem;
        }

        .version-info {
          text-align: center;
          padding-top: 1rem;
          color: var(--gray-400);
          font-size: 0.8125rem;
        }
      `}</style>
    </div>
  );
}
