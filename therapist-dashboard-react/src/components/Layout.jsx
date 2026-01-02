import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fish,
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/children', icon: Users, label: 'Children' },
    { path: '/sessions', icon: ClipboardList, label: 'Sessions' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const getInitials = () => {
    if (!user) return 'T';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'T';
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <motion.aside
        className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Fish size={28} />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  className="logo-text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="logo-title">Serious Fishing</span>
                  <span className="logo-subtitle">Therapist Portal</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronLeft
              size={20}
              style={{
                transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease',
              }}
            />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={22} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{getInitials()}</div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  className="user-details"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="user-role">Therapist</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Fish size={24} />
          <span>Serious Fishing</span>
        </div>
        <button className="notification-btn">
          <Bell size={22} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="mobile-menu-header">
                <div className="logo">
                  <div className="logo-icon">
                    <Fish size={28} />
                  </div>
                  <div className="logo-text">
                    <span className="logo-title">Serious Fishing</span>
                    <span className="logo-subtitle">Therapist Portal</span>
                  </div>
                </div>
                <button
                  className="mobile-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="mobile-nav">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon size={22} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mobile-menu-footer">
                <div className="user-info">
                  <div className="avatar">{getInitials()}</div>
                  <div className="user-details">
                    <span className="user-name">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="user-role">Therapist</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className="main-content"
        style={{
          marginLeft: sidebarOpen ? 280 : 80,
        }}
      >
        <Outlet />
      </main>

      <style>{`
        .layout {
          min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: linear-gradient(180deg, #006064 0%, #00838f 50%, #0097a7 100%);
          display: flex;
          flex-direction: column;
          z-index: 100;
          box-shadow: 4px 0 24px rgba(0, 96, 100, 0.15);
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          flex-shrink: 0;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-title {
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }

        .logo-subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .sidebar-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          font-size: 0.9375rem;
          transition: all 0.2s;
          text-decoration: none;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4dd0e1, #00bcd4);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          color: white;
        }

        /* Mobile Header */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: white;
          border-bottom: 1px solid var(--gray-200);
          padding: 0 1rem;
          align-items: center;
          justify-content: space-between;
          z-index: 50;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }
        }

        .mobile-menu-btn,
        .mobile-close-btn,
        .notification-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 10px;
          background: var(--gray-100);
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.2s;
        }

        .mobile-menu-btn:hover,
        .mobile-close-btn:hover,
        .notification-btn:hover {
          background: var(--gray-200);
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-700);
          font-weight: 700;
          font-size: 1.125rem;
        }

        /* Mobile Menu */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 150;
        }

        @media (max-width: 768px) {
          .mobile-overlay {
            display: block;
          }
        }

        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 300px;
          background: linear-gradient(180deg, #006064 0%, #00838f 50%, #0097a7 100%);
          z-index: 200;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .mobile-menu {
            display: flex;
          }
        }

        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mobile-close-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .mobile-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .mobile-nav {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .mobile-menu-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Main Content */
        .main-content {
          min-height: 100vh;
          padding: 2rem;
          transition: margin-left 0.3s ease;
          background: linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%);
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding: 80px 1rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
