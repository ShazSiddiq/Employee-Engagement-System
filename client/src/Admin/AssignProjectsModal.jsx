import React, { useState, useEffect } from 'react';

const AssignProjectsModal = ({ allProjects, assignedProjects, onAssign }) => {
  const [selectedProjects, setSelectedProjects] = useState([]);

  // Set initial state with already assigned projects
  useEffect(() => {
    setSelectedProjects(assignedProjects);
  }, [assignedProjects]);

  const handleCheckboxChange = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  const handleSubmit = () => {
    onAssign(selectedProjects);
  };

  return (
    <div className="assign-projects-modal">
      <h2>Assign Projects</h2>
      <form onSubmit={handleSubmit}>
        {allProjects.map(project => (
          <div key={project._id}>
            <input
              type="checkbox"
              id={`project-${project._id}`}
              value={project._id}
              checked={selectedProjects.includes(project._id)}
              onChange={() => handleCheckboxChange(project._id)}
            />
            <label htmlFor={`project-${project._id}`}>{project.title}</label>
          </div>
        ))}
        <button type="submit">Assign</button>
      </form>
    </div>
  );
};

export default AssignProjectsModal;
