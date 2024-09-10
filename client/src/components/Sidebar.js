import React, { useCallback, useEffect, useState } from 'react';
import AddProjectModal from '../Admin/AddProjectModal';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Chip } from "@material-tailwind/react";

const Sidebar = () => {
  const [isModalOpen, setModalState] = useState(false);
  const [projects, setProjects] = useState([]);
  const [paramsWindow, setParamsWindow] = useState(window.location.pathname.slice(1));
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Check if user is authenticated
    if (!token) {
      navigate('/login');
    } else {
      projectData();
    }
  }, [navigate]);

  const handleLocation = (e) => {
    setParamsWindow(new URL(e.currentTarget.href).pathname.slice(1));
    
    // Scroll to the top after clicking on the project link
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // Smooth scroll effect
    });
  };

  const openModal = useCallback(() => {
    setModalState(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalState(false);
  }, []);

  const countTasksInProgressOrPaused = (tasks) => {
    const loggedInUserId = localStorage.getItem('userid');
    return tasks.filter(task =>
      task.userid === loggedInUserId &&
      task.deleteStatus === 0 &&
      (task.stage === 'In Progress' || task.stage === 'Pause')
    ).length;
  };

  const projectData = () => {
    const userid = localStorage.getItem('userid');
    axios.get(`${process.env.REACT_APP_BASE_URL}/projects/${userid}`)
      .then((res) => {
        const filteredProjects = res.data.filter(project => !project.deleteStatus || project.deleteStatus !== 1);
        
        // Sort projects by task count: projects with tasks first
        const sortedProjects = filteredProjects.sort((a, b) => {
          const taskCountA = countTasksInProgressOrPaused(a.task);
          const taskCountB = countTasksInProgressOrPaused(b.task);
          return taskCountB - taskCountA; // Descending order
        });

        setProjects(sortedProjects);
      })
      .catch((err) => {
        console.error('Error fetching projects:', err);
        if (err.response && err.response.status === 401) {
          // Token might be expired or invalid, redirect to login
          localStorage.clear();
          navigate('/login');
        }
      });
  };

  useEffect(() => {
    const handleProjectUpdate = () => {
      projectData();
    };

    document.addEventListener('projectUpdate', handleProjectUpdate);
    return () => {
      document.removeEventListener('projectUpdate', handleProjectUpdate);
    };
  }, []);

  return (
    <div className='fixed'>
      <div className="px-4 mb-3 flex items-center justify-between font-bold text-xl text-dark mt-4">
        <span>My Projects</span> <span>({projects.length})</span>
      </div>
      <ul className='border-r border-gray-400 pr-2 project-list scroll'>
  {
    projects.length > 0 ? projects.map((project, index) => {
      const taskCount = countTasksInProgressOrPaused(project.task);
      return (
        <Link key={index} to={`/${project._id}`} onClick={(e) => handleLocation(e)}>
          <li style={{display:"flex", alignItems:"center",justifyContent:"space-between"}} className={`border-r border-b border-gray-400 pr-2 px-4 py-1.5 mb-1 text-gray-600 font-medium text-sm capitalize select-none hover:text-indigo-600 rounded transition-colors hover:bg-indigo-200/80 ${paramsWindow === project._id && 'text-indigo-600  bg-indigo-200/80'}`}>
            {project.title}
            {taskCount > 0 && (
              <span>
                <Chip
                  id={`project-${project._id}-count`} // Unique ID based on project ID
                  value={taskCount}
                  size="sm"
                  style={{ borderRadius: "50%", width: "22px", height: "22px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  variant="filled"
                  color="red"
                  className="bg-red-600 text-white font-bold shadow-md ml-2"
                />
              </span>
            )}
          </li>
        </Link>
      );
    }) : "No Project Found"
  }
</ul>

      <AddProjectModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
};

export default Sidebar;
