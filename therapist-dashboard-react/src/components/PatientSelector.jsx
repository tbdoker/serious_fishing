import React from 'react'
import '../styles/PatientSelector.css'

const PatientSelector = ({ children, selectedChild, onSelectChild, onAddChild }) => {
  const handleSelectChange = (e) => {
    const childId = e.target.value
    onSelectChild(childId || null)
  }

  return (
    <div className="card patient-selector-card">
      <div className="selector-header">
        <h2>Patient Management</h2>
        <button onClick={onAddChild} className="btn btn-success">
          + Add New Child
        </button>
      </div>

      <div className="selector-content">
        <label htmlFor="child-select">Select Child Patient:</label>
        <select
          id="child-select"
          className="form-control"
          value={selectedChild || ''}
          onChange={handleSelectChange}
        >
          <option value="">-- Select a child --</option>
          {children.map((child) => (
            <option key={child._id} value={child._id}>
              {child.full_name} ({child.username})
            </option>
          ))}
        </select>

        {children.length === 0 && (
          <p className="no-children-message">
            No children added yet. Click "Add New Child" to get started.
          </p>
        )}
      </div>
    </div>
  )
}

export default PatientSelector
