import React, { useCallback, useEffect, useState } from 'react';
import AddProjectModal from '../Admin/AddProjectModal';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [isModalOpen, setModalState] = useState(false);
  const [projects, setProjects] = useState([]);
  const [paramsWindow, setParamsWindow] = useState(window.location.pathname.slice(1));
  const navigate = useNavigate();
  const location = useLocation();

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

  const isHomePage = location.pathname === '/';

  return (
    <div style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      {!isHomePage && (
        <button
          onClick={() => navigate(-1)}
          className='bg-indigo-200 rounded-full p-[2px] mb-3 focus:outline-none focus:ring focus:ring-indigo-200 focus:ring-offset-1'
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
            <path fillRule="evenodd" d="M15.293 6.293a1 1 0 010 1.414L10.414 12l4.879 4.879a1 1 0 01-1.414 1.414l-6.293-6.293a1 1 0 010-1.414l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <div className="px-4 mb-3 flex items-center justify-between font-bold text-xl text-dark " style={{ borderTop: "1px solid #ddd", paddingTop: "1.5rem", marginTop: "14px" }}>
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
