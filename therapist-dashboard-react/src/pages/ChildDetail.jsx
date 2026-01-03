import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Settings,
  Activity,
  Target,
  Timer,
  TrendingUp,
  TrendingDown,
  Calendar,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  X,
  Zap,
  Fish,
  Clock,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { childrenAPI, settingsAPI, sessionsAPI, progressAPI, heatmapAPI } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ChildDetail() {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [child, setChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [timeGrouping, setTimeGrouping] = useState('session');
  const [handFilter, setHandFilter] = useState('all');

  useEffect(() => {
    loadChildData();
  }, [childId]);

  const loadChildData = async () => {
    try {
      const [childRes, sessionsRes, progressRes, heatmapRes] = await Promise.all([
        childrenAPI.getById(childId),
        sessionsAPI.getByChild(childId, 1, 50),
        progressAPI.get(childId),
        heatmapAPI.get(childId),
      ]);

      if (childRes.ok) {
        setChild(childRes.child);
        // Load settings from child data, with proper defaults if missing
        const childSettings = childRes.child.settings || {};
        console.log('Child settings from backend:', childSettings);
        const loadedSettings = {
          speedMultiplier: childSettings.speedMultiplier ?? 1.0,
          minSpawnInterval: childSettings.minSpawnInterval ?? 3.0,
          maxSpawnInterval: childSettings.maxSpawnInterval ?? 6.0,
          spawnFrom: childSettings.spawnFrom ?? 'Right',
          targetFishMode: childSettings.targetFishMode ?? 'Random',
          useHandTracking: childSettings.useHandTracking ?? true,
          handIndexToUse: childSettings.handIndexToUse ?? 0,
          movementSensitivity: childSettings.movementSensitivity ?? 1.5,
          showHandSkeleton: childSettings.showHandSkeleton ?? true,
          normalizeHandSize: childSettings.normalizeHandSize ?? true,
          handSize: childSettings.handSize ?? 5,
          showGrabCursor: childSettings.showGrabCursor ?? true,
          cursorSize: childSettings.cursorSize ?? 3,
          grabThreshold: childSettings.grabThreshold ?? 0.6,
          jointSize: childSettings.jointSize ?? 7,
        };
        console.log('Settings state being set:', loadedSettings);
        setSettings(loadedSettings);
      }

      if (sessionsRes.ok) {
        setSessions(sessionsRes.sessions);
      }

      if (progressRes.ok) {
        setProgress(progressRes.progress);
      }

      if (heatmapRes.ok) {
        setHeatmapData(heatmapRes.heatmap);
      }
    } catch (error) {
      console.error('Failed to load child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await settingsAPI.update(childId, settings);
      if (response.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

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

  const formatTotalDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTotalPlayTime = () => {
    return sessions.reduce((total, session) => total + (session.sessionDuration || 0), 0);
  };

  // Calculate difficulty score based on settings
  const calculateDifficulty = (session) => {
    const speed = session.gameSettings?.speedMultiplier || 1.0;
    const minSpawn = session.gameSettings?.minSpawnInterval || 3.0;
    const maxSpawn = session.gameSettings?.maxSpawnInterval || 6.0;
    const avgSpawn = (minSpawn + maxSpawn) / 2;
    const baseInterval = 4.0; // Reference spawn interval
    return speed * (baseInterval / avgSpawn);
  };

  // Group sessions by time period
  const groupSessionsByTime = (sessionsData, grouping) => {
    if (grouping === 'session') {
      return sessionsData.map((s, i) => ({
        label: `Session ${i + 1}`,
        sessions: [s],
      }));
    }

    const groups = {};
    sessionsData.forEach((session) => {
      const date = new Date(session.sessionStartTime);
      let key;
      let label;

      if (grouping === 'daily') {
        key = date.toISOString().split('T')[0];
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (grouping === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        label = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (grouping === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth()}`;
        label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = { label, sessions: [] };
      }
      groups[key].sessions.push(session);
    });

    return Object.values(groups);
  };

  // Aggregate grouped data
  const aggregateGroupedData = (groups) => {
    return groups.map((group) => {
      const sessions = group.sessions;
      const avgAccuracy = sessions.reduce((sum, s) => sum + (s.fishAccuracy || 0), 0) / sessions.length;
      const avgDifficulty = sessions.reduce((sum, s) => sum + calculateDifficulty(s), 0) / sessions.length;
      const avgReactionTime = sessions.reduce((sum, s) => sum + (s.averageReactionTime || 0), 0) / sessions.length;
      const avgSpeed = sessions.reduce((sum, s) => sum + (s.gameSettings?.speedMultiplier || 1), 0) / sessions.length;
      const avgMinSpawn = sessions.reduce((sum, s) => sum + (s.gameSettings?.minSpawnInterval || 3), 0) / sessions.length;
      const avgMaxSpawn = sessions.reduce((sum, s) => sum + (s.gameSettings?.maxSpawnInterval || 6), 0) / sessions.length;
      const totalMissedFish = sessions.reduce((sum, s) => sum + (s.missedFish || 0), 0);

      return {
        label: group.label,
        accuracy: avgAccuracy,
        difficulty: avgDifficulty,
        reactionTime: avgReactionTime,
        speed: avgSpeed,
        minSpawnInterval: avgMinSpawn,
        maxSpawnInterval: avgMaxSpawn,
        missedFish: totalMissedFish,
      };
    });
  };

  // Get chart data based on time grouping
  const filteredSessions = sessions.filter((session) => {
    if (handFilter === 'hand') return session.handTrackingUsed === true;
    if (handFilter === 'no-hand') return session.handTrackingUsed !== true;
    return true;
  });

  const getChartData = () => {
    if (!filteredSessions.length) return null;
    const orderedSessions = [...filteredSessions].sort(
      (a, b) => new Date(a.sessionStartTime) - new Date(b.sessionStartTime)
    );
    const groups = groupSessionsByTime(orderedSessions, timeGrouping);
    return aggregateGroupedData(groups);
  };

  const handleDeleteSession = async (sessionId) => {
    setDeletingSession(sessionId);
    try {
      const response = await sessionsAPI.delete(sessionId);
      if (response.ok) {
        setSessions(sessions.filter(s => s._id !== sessionId));
        setShowDeleteModal(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeletingSession(null);
    }
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  // Chart options for accuracy/difficulty
  const accuracyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Accuracy %',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 3,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Difficulty',
        },
      },
    },
  };

  // Settings chart options
  const settingsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 3,
        title: {
          display: true,
          text: 'Speed Multiplier',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 15,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Spawn Interval (s)',
        },
      },
    },
  };

  const chartData = getChartData();

  const progressChartData = chartData
    ? {
        labels: chartData.map((d) => d.label),
        datasets: [
          {
            label: 'Accuracy %',
            data: chartData.map((d) => d.accuracy),
            borderColor: '#00bcd4',
            backgroundColor: 'rgba(0, 188, 212, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Difficulty',
            data: chartData.map((d) => d.difficulty),
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
          },
        ],
      }
    : null;

  const settingsChartData = chartData
    ? {
        labels: chartData.map((d) => d.label),
        datasets: [
          {
            label: 'Speed Multiplier',
            data: chartData.map((d) => d.speed),
            borderColor: '#9c27b0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Min Spawn Interval',
            data: chartData.map((d) => d.minSpawnInterval),
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
          },
          {
            label: 'Max Spawn Interval',
            data: chartData.map((d) => d.maxSpawnInterval),
            borderColor: '#03a9f4',
            backgroundColor: 'rgba(3, 169, 244, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
          },
        ],
      }
    : null;

  const reactionTimeChartData = chartData
    ? {
        labels: chartData.map((d) => d.label),
        datasets: [
          {
            label: 'Reaction Time (s)',
            data: chartData.map((d) => d.reactionTime),
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  const missedFishChartData = chartData
    ? {
        labels: chartData.map((d) => d.label),
        datasets: [
          {
            label: 'Missed Fish',
            data: chartData.map((d) => d.missedFish),
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading child data...</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="empty-state card">
        <h3>Child not found</h3>
        <Link to="/children" className="btn btn-primary">
          Back to Children
        </Link>
      </div>
    );
  }

  return (
    <div className="child-detail">
      {/* Back Button */}
      <Link to="/children" className="back-link">
        <ArrowLeft size={20} />
        Back to Children
      </Link>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-info">
          <div className="child-avatar-xl">
            {child.firstName?.[0]}
            {child.lastName?.[0]}
          </div>
          <div className="child-info">
            <h1>{child.fullName}</h1>
            <span className="child-username">@{child.username}</span>
            {child.age > 0 && <span className="child-age">{child.age} years old</span>}
          </div>
        </div>

        <button
          className={`btn ${settingsOpen ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <Settings size={20} />
          Game Settings
          {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {settingsOpen && settings && (
          <motion.div
            className="settings-panel card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="settings-header">
              <h3>
                <Settings size={20} />
                Game Settings
              </h3>
              <span className="settings-hint">
                Changes save when you click "Save Settings" button
              </span>
            </div>

            <div className="settings-grid">
              <div className="settings-section">
                <span>Game Settings</span>
              </div>
              <div className="setting-item">
                <label>
                  <Zap size={16} />
                  Fish Speed
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={settings.speedMultiplier}
                    onChange={(e) =>
                      handleSettingsChange('speedMultiplier', parseFloat(e.target.value))
                    }
                    className="slider"
                  />
                  <span className="slider-value">{settings.speedMultiplier.toFixed(1)}x</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Clock size={16} />
                  Min Spawn Interval
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={settings.minSpawnInterval}
                    onChange={(e) =>
                      handleSettingsChange('minSpawnInterval', parseFloat(e.target.value))
                    }
                    className="slider"
                  />
                  <span className="slider-value">{settings.minSpawnInterval.toFixed(1)}s</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Clock size={16} />
                  Max Spawn Interval
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0.5"
                    max="15"
                    step="0.5"
                    value={settings.maxSpawnInterval}
                    onChange={(e) =>
                      handleSettingsChange('maxSpawnInterval', parseFloat(e.target.value))
                    }
                    className="slider"
                  />
                  <span className="slider-value">{settings.maxSpawnInterval.toFixed(1)}s</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <ArrowLeft size={16} />
                  Spawn Direction
                </label>
                <select
                  value={settings.spawnFrom}
                  onChange={(e) => handleSettingsChange('spawnFrom', e.target.value)}
                  className="form-select"
                >
                  <option value="Left">Left</option>
                  <option value="Right">Right</option>
                  <option value="Random">Random</option>
                </select>
              </div>

              <div className="setting-item">
                <label>
                  <Fish size={16} />
                  Target Fish Mode
                </label>
                <select
                  value={settings.targetFishMode}
                  onChange={(e) => handleSettingsChange('targetFishMode', e.target.value)}
                  className="form-select"
                >
                  <option value="Random">Random</option>
                  <option value="FixedRed">Fixed: Red</option>
                  <option value="FixedBlue">Fixed: Blue</option>
                  <option value="FixedYellow">Fixed: Yellow</option>
                  <option value="FixedPink">Fixed: Pink</option>
                  <option value="FixedGreen">Fixed: Green</option>
                </select>
              </div>

              <div className="settings-section">
                <span>Hand Tracker Settings</span>
                <span className="settings-section-hint">Disable to use mouse/touch only</span>
              </div>

              <div className="setting-item">
                <label>
                  <Eye size={16} />
                  Enable Hand Tracking
                </label>
                <div className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.useHandTracking}
                    onChange={(e) => handleSettingsChange('useHandTracking', e.target.checked)}
                  />
                  <span className="toggle-label">
                    {settings.useHandTracking ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Eye size={16} />
                  Hand Index
                </label>
                <select
                  value={settings.handIndexToUse}
                  onChange={(e) =>
                    handleSettingsChange('handIndexToUse', parseInt(e.target.value, 10))
                  }
                  className="form-select"
                  disabled={!settings.useHandTracking}
                >
                  <option value={0}>Primary (0)</option>
                  <option value={1}>Secondary (1)</option>
                </select>
              </div>

              <div className="setting-item">
                <label>
                  <TrendingUp size={16} />
                  Movement Sensitivity
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={settings.movementSensitivity}
                    onChange={(e) =>
                      handleSettingsChange('movementSensitivity', parseFloat(e.target.value))
                    }
                    className="slider"
                    disabled={!settings.useHandTracking}
                  />
                  <span className="slider-value">{settings.movementSensitivity.toFixed(1)}x</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Target size={16} />
                  Normalize Hand Size
                </label>
                <div className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.normalizeHandSize}
                    onChange={(e) => handleSettingsChange('normalizeHandSize', e.target.checked)}
                    disabled={!settings.useHandTracking}
                  />
                  <span className="toggle-label">
                    {settings.normalizeHandSize ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Target size={16} />
                  Hand Size
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.handSize}
                    onChange={(e) => handleSettingsChange('handSize', parseFloat(e.target.value))}
                    className="slider"
                    disabled={!settings.useHandTracking || !settings.normalizeHandSize}
                  />
                  <span className="slider-value">{settings.handSize.toFixed(0)}</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Eye size={16} />
                  Show Hand Skeleton
                </label>
                <div className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.showHandSkeleton}
                    onChange={(e) => handleSettingsChange('showHandSkeleton', e.target.checked)}
                    disabled={!settings.useHandTracking}
                  />
                  <span className="toggle-label">
                    {settings.showHandSkeleton ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Eye size={16} />
                  Show Grab Cursor
                </label>
                <div className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.showGrabCursor}
                    onChange={(e) => handleSettingsChange('showGrabCursor', e.target.checked)}
                    disabled={!settings.useHandTracking}
                  />
                  <span className="toggle-label">
                    {settings.showGrabCursor ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Target size={16} />
                  Grab Cursor Size
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={settings.cursorSize}
                    onChange={(e) => handleSettingsChange('cursorSize', parseFloat(e.target.value))}
                    className="slider"
                    disabled={!settings.useHandTracking || !settings.showGrabCursor}
                  />
                  <span className="slider-value">{settings.cursorSize.toFixed(0)}</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Target size={16} />
                  Grab Threshold
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.grabThreshold}
                    onChange={(e) => handleSettingsChange('grabThreshold', parseFloat(e.target.value))}
                    className="slider"
                    disabled={!settings.useHandTracking}
                  />
                  <span className="slider-value">{settings.grabThreshold.toFixed(2)}</span>
                </div>
              </div>

              <div className="setting-item">
                <label>
                  <Target size={16} />
                  Joint Size
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={settings.jointSize}
                    onChange={(e) => handleSettingsChange('jointSize', parseFloat(e.target.value))}
                    className="slider"
                    disabled={!settings.useHandTracking}
                  />
                  <span className="slider-value">{settings.jointSize.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="settings-footer">
              <button
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Saving...
                  </>
                ) : settingsSaved ? (
                  <>
                    <Save size={18} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card mini">
          <Activity size={20} />
          <div className="stat-content">
            <span className="stat-value">{progress?.summary?.totalSessions || 0}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>

        <div className="stat-card mini">
          <Clock size={20} />
          <div className="stat-content">
            <span className="stat-value">{formatTotalDuration(getTotalPlayTime())}</span>
            <span className="stat-label">Total Play Time</span>
          </div>
        </div>

        <div className="stat-card mini">
          <Target size={20} />
          <div className="stat-content">
            <span className="stat-value">{progress?.summary?.avgAccuracy || 0}%</span>
            <span className="stat-label">Avg Accuracy</span>
          </div>
        </div>

        <div className="stat-card mini">
          <Timer size={20} />
          <div className="stat-content">
            <span className="stat-value">{progress?.summary?.avgReactionTime?.toFixed(2) || 0}s</span>
            <span className="stat-label">Avg Reaction</span>
          </div>
        </div>

        <div className="stat-card mini">
          {(progress?.summary?.improvement || 0) >= 0 ? (
            <TrendingUp size={20} className="text-success" />
          ) : (
            <TrendingDown size={20} className="text-error" />
          )}
          <div className="stat-content">
            <span
              className={`stat-value ${
                (progress?.summary?.improvement || 0) >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {(progress?.summary?.improvement || 0) >= 0 ? '+' : ''}
              {progress?.summary?.improvement || 0}%
            </span>
            <span className="stat-label">Improvement</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <TrendingUp size={18} />
          Progress Charts
        </button>
        <button
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Calendar size={18} />
          Session History
        </button>
        <button
          className={`tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <Activity size={18} />
          Heatmap
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'progress' && (
          <motion.div
            className="progress-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Time Grouping + Hand Filter */}
            <div className="time-grouping-selector">
              <span className="grouping-label">Group by:</span>
              <div className="grouping-buttons">
                {['session', 'daily', 'weekly', 'monthly'].map((group) => (
                  <button
                    key={group}
                    className={`grouping-btn ${timeGrouping === group ? 'active' : ''}`}
                    onClick={() => setTimeGrouping(group)}
                    disabled={filteredSessions.length === 0}
                  >
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </button>
                ))}
              </div>
              <div className="grouping-filter">
                <span className="grouping-label">Hand:</span>
                <select
                  className="form-select"
                  value={handFilter}
                  onChange={(e) => setHandFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="hand">Hand On</option>
                  <option value="no-hand">Hand Off</option>
                </select>
              </div>
            </div>

            {filteredSessions.length > 0 ? (
              <>
                <div className="charts-grid">
                  <div className="chart-card card">
                    <h3>Accuracy & Difficulty Over Time</h3>
                    <div className="chart-container">
                      <Line data={progressChartData} options={accuracyChartOptions} />
                    </div>
                  </div>

                  <div className="chart-card card">
                    <h3>Game Settings Over Time</h3>
                    <p className="chart-hint">Speed and spawn interval changes</p>
                    <div className="chart-container">
                      <Line data={settingsChartData} options={settingsChartOptions} />
                    </div>
                  </div>

                  <div className="chart-card card">
                    <h3>Reaction Time Over Time</h3>
                    <div className="chart-container">
                      <Line
                        data={reactionTimeChartData}
                        options={{
                          ...chartOptions,
                          scales: { y: { beginAtZero: true } },
                        }}
                      />
                    </div>
                  </div>

                  <div className="chart-card card">
                    <h3>Missed Fish Over Time</h3>
                    <div className="chart-container">
                      <Line
                        data={missedFishChartData}
                        options={{
                          ...chartOptions,
                          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state card">
                <TrendingUp size={48} className="empty-state-icon" />
                <h3 className="empty-state-title">No progress data yet</h3>
                <p className="empty-state-text">
                  Progress charts will appear after the child completes their first session.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'sessions' && (
          <motion.div
            className="sessions-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="sessions-filter-row">
              <span className="grouping-label">Hand:</span>
              <select
                className="form-select"
                value={handFilter}
                onChange={(e) => setHandFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="hand">Hand On</option>
                <option value="no-hand">Hand Off</option>
              </select>
            </div>

            {filteredSessions.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Settings</th>
                      <th>Hand</th>
                      <th>Accuracy</th>
                      <th>Difficulty</th>
                      <th>Correct</th>
                      <th>Wrong</th>
                      <th>Missed</th>
                      <th>Reaction Time</th>
                      <th>Max Streak</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session._id}>
                        <td>{formatDate(session.sessionStartTime)}</td>
                        <td>{formatDuration(session.sessionDuration)}</td>
                        <td className="settings-cell">
                          <span className="setting-badge" title="Speed">
                            <Zap size={12} />
                            {(session.gameSettings?.speedMultiplier || 1).toFixed(1)}x
                          </span>
                          <span className="setting-badge" title="Spawn Interval">
                            <Clock size={12} />
                            {(session.gameSettings?.minSpawnInterval || 3).toFixed(1)}-{(session.gameSettings?.maxSpawnInterval || 6).toFixed(1)}s
                          </span>
                          <span className="setting-badge" title="Spawn Side">
                            {session.gameSettings?.spawnFrom === 'Left' ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                            {session.gameSettings?.spawnFrom || 'Right'}
                          </span>
                        </td>
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
                        <td>
                          <span className="badge badge-info">
                            {calculateDifficulty(session).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-success">{session.correctFish || 0}</td>
                        <td className="text-error">{session.wrongFish || 0}</td>
                        <td className="text-warning">{session.missedFish || 0}</td>
                        <td>{(session.averageReactionTime || 0).toFixed(2)}s</td>
                        <td>{session.maxStreak || 0}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-icon btn-danger-hover"
                            onClick={() => setShowDeleteModal(session)}
                            title="Delete Session"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state card">
                <Calendar size={48} className="empty-state-icon" />
                <h3 className="empty-state-title">No sessions yet</h3>
                <p className="empty-state-text">
                  Sessions will appear here once the child starts playing.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'heatmap' && (
          <motion.div
            className="heatmap-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="card">
              <h3>Click Heatmap</h3>
              <p className="text-gray-500 text-sm mb-4">
                Visual representation of where the child clicks during gameplay.
              </p>

              {heatmapData?.clicks?.length > 0 ? (
                <div className="heatmap-container">
                  <HeatmapVisualization data={heatmapData} />
                </div>
              ) : (
                <div className="empty-state">
                  <Activity size={48} className="empty-state-icon" />
                  <h3 className="empty-state-title">No heatmap data yet</h3>
                  <p className="empty-state-text">
                    Click positions will be recorded during gameplay sessions.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Session Confirmation Modal */}
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
                <h3 className="modal-title">Delete Session</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowDeleteModal(null)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete this session from{' '}
                  <strong>{formatDate(showDeleteModal.sessionStartTime)}</strong>?
                </p>
                <p className="text-gray-500" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  This action cannot be undone. All session data including accuracy, reaction times, and click positions will be permanently removed.
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
                  onClick={() => handleDeleteSession(showDeleteModal._id)}
                  disabled={deletingSession === showDeleteModal._id}
                >
                  {deletingSession === showDeleteModal._id ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Session
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .child-detail {
          max-width: 1400px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-600);
          font-weight: 500;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary-600);
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .detail-header-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .child-avatar-xl {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-400), var(--accent-mint));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .child-info h1 {
          margin-bottom: 0.25rem;
        }

        .child-username {
          display: block;
          color: var(--gray-500);
          margin-bottom: 0.25rem;
        }

        .child-age {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--gray-100);
          border-radius: 20px;
          font-size: 0.8125rem;
          color: var(--gray-600);
        }

        @media (max-width: 768px) {
          .detail-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* Settings Panel */
        .settings-panel {
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .settings-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          margin: 0;
        }

        .settings-hint {
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .grouping-filter,
        .sessions-filter-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sessions-filter-row {
          margin-bottom: 0.75rem;
        }

        .settings-section {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
          border-top: 1px dashed var(--gray-200);
          color: var(--gray-600);
          font-weight: 600;
        }

        .settings-section:first-of-type {
          border-top: none;
          padding-top: 0;
          margin-top: 0;
        }

        .settings-section-hint {
          font-weight: 400;
          font-size: 0.8125rem;
          color: var(--gray-500);
        }

        .toggle-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toggle-label {
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--gray-700);
          margin-bottom: 0.5rem;
        }

        .slider-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .slider-wrapper .slider {
          flex: 1;
        }

        .slider-value {
          font-weight: 600;
          color: var(--primary-600);
          min-width: 50px;
          text-align: right;
        }

        .settings-footer {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--gray-100);
          display: flex;
          justify-content: flex-end;
        }

        /* Stats Row */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1200px) {
          .stats-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
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

        /* Delete button hover */
        .btn-danger-hover:hover {
          color: var(--error-500) !important;
          background: rgba(239, 68, 68, 0.1) !important;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          border-radius: var(--border-radius);
          font-weight: 500;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          color: var(--primary-600);
          background: var(--primary-50);
        }

        .tab.active {
          background: var(--primary-500);
          color: white;
        }

        /* Charts */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card h3 {
          margin-bottom: 0.5rem;
        }

        .chart-hint {
          font-size: 0.75rem;
          color: var(--gray-500);
          margin-bottom: 1rem;
        }

        .chart-container {
          height: 300px;
        }

        /* Time Grouping Selector */
        .time-grouping-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
        }

        .grouping-label {
          font-weight: 500;
          color: var(--gray-700);
        }

        .grouping-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .grouping-btn {
          padding: 0.5rem 1rem;
          background: var(--gray-100);
          border: none;
          border-radius: var(--border-radius);
          font-weight: 500;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .grouping-btn:hover {
          background: var(--primary-50);
          color: var(--primary-600);
        }

        .grouping-btn.active {
          background: var(--primary-500);
          color: white;
        }

        /* Settings Cell */
        .settings-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .setting-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          background: var(--gray-100);
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--gray-700);
          white-space: nowrap;
        }

        .setting-badge svg {
          flex-shrink: 0;
        }

        /* Badge variants */
        .badge-info {
          background: var(--primary-100);
          color: var(--primary-700);
        }

        .badge-primary {
          background: var(--accent-purple);
          color: white;
        }

        /* Heatmap */
        .heatmap-container {
          background: var(--gray-100);
          border-radius: var(--border-radius);
          padding: 1rem;
          min-height: 400px;
        }
      `}</style>
    </div>
  );
}

// Simple Heatmap Visualization Component
function HeatmapVisualization({ data }) {
  // Simple grid-based heatmap
  const gridSize = 20;
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));

  // Dynamically calculate bounds from actual click data
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  data.clicks?.forEach((click) => {
    if (click.x !== undefined && click.y !== undefined) {
      minX = Math.min(minX, click.x);
      maxX = Math.max(maxX, click.x);
      minY = Math.min(minY, click.y);
      maxY = Math.max(maxY, click.y);
    }
  });

  // Add padding to bounds (10% on each side)
  const padX = (maxX - minX) * 0.1 || 1;
  const padY = (maxY - minY) * 0.1 || 1;
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;

  // Normalize clicks to grid based on calculated bounds
  data.clicks?.forEach((click) => {
    if (click.x !== undefined && click.y !== undefined) {
      // Normalize from world coords to 0-1 range
      const normalizedX = (click.x - minX) / (maxX - minX);
      const normalizedY = (click.y - minY) / (maxY - minY);
      
      // Convert to grid indices
      const gridX = Math.max(0, Math.min(gridSize - 1, Math.floor(normalizedX * gridSize)));
      // Flip Y because screen Y goes down but world Y goes up
      const gridY = Math.max(0, Math.min(gridSize - 1, Math.floor((1 - normalizedY) * gridSize)));
      
      grid[gridY][gridX]++;
    }
  });

  const maxValue = Math.max(...grid.flat(), 1);

  // Thermal heatmap color gradient: blue → cyan → green → yellow → orange → red
  const getColor = (value) => {
    const intensity = value / maxValue;
    if (intensity === 0) return 'transparent';
    
    // Interpolate through heatmap colors
    let r, g, b;
    if (intensity < 0.25) {
      // Blue to Cyan (0-25%)
      const t = intensity / 0.25;
      r = 0;
      g = Math.round(255 * t);
      b = 255;
    } else if (intensity < 0.5) {
      // Cyan to Green (25-50%)
      const t = (intensity - 0.25) / 0.25;
      r = 0;
      g = 255;
      b = Math.round(255 * (1 - t));
    } else if (intensity < 0.75) {
      // Green to Yellow (50-75%)
      const t = (intensity - 0.5) / 0.25;
      r = Math.round(255 * t);
      g = 255;
      b = 0;
    } else {
      // Yellow to Red (75-100%)
      const t = (intensity - 0.75) / 0.25;
      r = 255;
      g = Math.round(255 * (1 - t));
      b = 0;
    }
    
    // Higher opacity for better visibility on background
    const alpha = 0.5 + intensity * 0.4;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Format bounds for display
  const boundsInfo = data.clicks?.length > 0 
    ? `X: ${minX.toFixed(1)} to ${maxX.toFixed(1)}, Y: ${minY.toFixed(1)} to ${maxY.toFixed(1)}`
    : 'No data';

  return (
    <div className="heatmap-grid">
      <div className="heatmap-info">
        <span className="badge badge-info">{data.clicks?.length || 0} Total Clicks</span>
      </div>

      {/* Click Heatmap */}
      <h4 style={{ margin: '1rem 0 0.25rem', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
        Click Distribution
      </h4>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
        Bounds: {boundsInfo}
      </p>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Game Background */}
        <img
          src="/gamebackground.jpg"
          alt="Game Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Heatmap Overlay Grid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {grid.map((row, y) =>
            row.map((value, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  background: getColor(value),
                  transition: 'background 0.3s',
                }}
                title={`${value} clicks`}
              />
            ))
          )}
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Low activity</span>
        <div className="legend-gradient" />
        <span>High activity</span>
      </div>

      <style>{`
        .heatmap-grid {
          padding: 1rem;
        }

        .heatmap-info {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
          font-size: 0.8125rem;
          color: var(--gray-600);
        }

        .legend-gradient {
          width: 150px;
          height: 12px;
          background: linear-gradient(to right, 
            rgba(0, 0, 255, 0.6),
            rgba(0, 255, 255, 0.7),
            rgba(0, 255, 0, 0.8),
            rgba(255, 255, 0, 0.85),
            rgba(255, 128, 0, 0.9),
            rgba(255, 0, 0, 0.95)
          );
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
