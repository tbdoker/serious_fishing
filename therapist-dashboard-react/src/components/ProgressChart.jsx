import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns'
import '../styles/ProgressChart.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const ProgressChart = ({ progressData, sessions }) => {
  const chartRef = useRef(null)

  if (!sessions || sessions.length === 0) {
    return null
  }

  // Sort sessions by date (oldest first for chart)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  )

  // Prepare chart data
  const labels = sortedSessions.map((session) => {
    const date = format(new Date(session.start_time), 'MM/dd HH:mm')
    const duration = `${Math.floor(session.duration_seconds / 60)}m`
    return `${date}\n${duration}`
  })

  const scoreData = sortedSessions.map((s) => s.score || 0)
  const accuracyData = sortedSessions.map((s) => s.accuracy || 0)
  const fishSpeedData = sortedSessions.map((s) => s.settings_snapshot?.speed || 100)
  const spawnSpeedData = sortedSessions.map((s) => s.settings_snapshot?.spawn_interval || 100)

  // Convert spawn_side to numeric for visualization
  const spawnSideData = sortedSessions.map((s) => {
    const side = s.settings_snapshot?.spawn_side || 'random'
    if (side === 'left') return -1
    if (side === 'right') return 1
    return 0 // random
  })

  const data = {
    labels,
    datasets: [
      {
        label: 'Score',
        data: scoreData,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Accuracy (%)',
        data: accuracyData,
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Fish Speed (%)',
        data: fishSpeedData,
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderDash: [5, 5],
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Spawn Speed (%)',
        data: spawnSpeedData,
        borderColor: '#f57c00',
        backgroundColor: 'rgba(245, 124, 0, 0.1)',
        borderDash: [5, 5],
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Spawn Side',
        data: spawnSideData,
        borderColor: '#00bcd4',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        yAxisID: 'y2',
        pointStyle: 'triangle',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Progress Timeline: Performance vs. Game Parameters',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.dataset.label === 'Spawn Side') {
              const value = context.parsed.y
              label += value === -1 ? 'Left' : value === 1 ? 'Right' : 'Random'
            } else {
              label += context.parsed.y.toFixed(1)
              if (context.dataset.yAxisID !== 'y2') {
                label += context.dataset.yAxisID === 'y' && context.dataset.label === 'Accuracy (%)' ? '%' : ''
              }
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Score & Accuracy (%)',
          font: {
            weight: 'bold',
          },
        },
        min: 0,
        max: 110,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Speed (%)',
          font: {
            weight: 'bold',
          },
        },
        min: 0,
        max: 300,
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Spawn Side',
          font: {
            weight: 'bold',
          },
        },
        min: -1.5,
        max: 1.5,
        ticks: {
          callback: function (value) {
            if (value === -1) return 'Left'
            if (value === 0) return 'Random'
            if (value === 1) return 'Right'
            return ''
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div className="card progress-chart-card">
      <div className="chart-container">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  )
}

export default ProgressChart
