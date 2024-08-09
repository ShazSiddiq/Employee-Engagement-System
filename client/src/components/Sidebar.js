import React, { useCallback, useEffect, useState } from 'react';
import AddProjectModal from '../Admin/AddProjectModal';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [isModalOpen, setModalState] = useState(false);
  const [projects, setProjects] = useState([]);
  const [paramsWindow, setParamsWindow] = useState(window.location.pathname.slice(1));
  const navigate = useNavigate();
  // const location = useLocation();

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
  };

  const openModal = useCallback(() => {
    setModalState(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalState(false);
  }, []);

  const projectData = () => {
    const userid = localStorage.getItem('userid');
    axios.get(`${process.env.REACT_APP_BASE_URL}/projects/${userid}`)
      .then((res) => {
        const filteredProjects = res.data.filter(project => !project.deleteStatus || project.deleteStatus !== 1 );
        setProjects(filteredProjects);
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
    <div >
      <div className="px-4 mb-3 flex items-center justify-between font-bold text-xl text-dark mt-4 " >
        <span>My Projects</span>
      </div>
      <ul className='border-r border-gray-400 pr-2'>
        {
          projects.length > 0 ? projects.map((project, index) => (
            <Link key={index} to={`/${project._id}`} onClick={(e) => handleLocation(e)}>
              <li className={`border-r border-b border-gray-400 pr-2 px-4 py-1.5 mb-1 text-gray-600 font-bold text-sm capitalize select-none hover:text-indigo-600 rounded transition-colors hover:bg-indigo-200/80 ${paramsWindow === project._id && 'text-indigo-600  bg-indigo-200/80'}`}>
                {project.title}
              </li>
            </Link>
          )) : "No Project Found"
        }
      </ul>
      <AddProjectModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
};

export default Sidebar;