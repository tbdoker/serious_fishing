import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fish, Eye, EyeOff, LogIn, Waves } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="fish-bg" />

      {/* Animated waves */}
      <div className="waves-container">
        <Waves className="wave wave-1" />
        <Waves className="wave wave-2" />
        <Waves className="wave wave-3" />
      </div>

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card">
          <motion.div
            className="login-header"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="login-icon">
              <Fish size={40} />
            </div>
            <h1>Serious Fishing</h1>
            <p>Therapist Dashboard</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <motion.div
                className="alert alert-error"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0097a7 0%, #00bcd4 50%, #4dd0e1 100%);
          position: relative;
          overflow: hidden;
        }

        .waves-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .wave {
          position: absolute;
          color: rgba(255, 255, 255, 0.1);
          animation: wave-float 8s ease-in-out infinite;
        }

        .wave-1 {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .wave-2 {
          width: 200px;
          height: 200px;
          bottom: 20%;
          right: 10%;
          animation-delay: -3s;
        }

        .wave-3 {
          width: 250px;
          height: 250px;
          top: 50%;
          right: 30%;
          animation-delay: -5s;
        }

        @keyframes wave-float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) rotate(10deg);
            opacity: 0.5;
          }
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 1.5rem;
          z-index: 10;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00bcd4, #0097a7);
          color: white;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 188, 212, 0.4);
        }

        .login-header h1 {
          font-size: 1.75rem;
          color: #0097a7;
          margin-bottom: 0.25rem;
        }

        .login-header p {
          color: #6b7280;
          font-size: 0.9375rem;
          margin: 0;
        }

        .login-form {
          margin-bottom: 1.5rem;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper .form-input {
          padding-right: 3rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #6b7280;
        }

        .login-btn {
          width: 100%;
          margin-top: 0.5rem;
        }

        .login-footer {
          text-align: center;
          color: #6b7280;
          font-size: 0.9375rem;
        }

        .login-footer p {
          margin: 0;
        }

        .register-link {
          color: #0097a7;
          font-weight: 600;
          transition: color 0.2s;
        }

        .register-link:hover {
          color: #00838f;
        }
      `}</style>
    </div>
  );
}
