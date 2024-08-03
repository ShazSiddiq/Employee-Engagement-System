import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';
import AdminPopupInfo from '../components/AdminPopupInfo';

export default function AdminHome() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectTitles, setProjectTitles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [error, setError] = useState(null);
  const POLLING_INTERVAL = 5000; // Poll every 5 seconds

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/userdata`);
      console.log("tacc",response);
      const userData = response.data;
      console.log(userData);

      // Filter out users with undefined usernames
      const validUserData = userData.filter(user => user.username);

      // Filter out tasks that have deleteStatus set to 1
      validUserData.forEach(user => {
        user.tasks = user.tasks.filter(task =>!task.deleteStatus || task.deleteStatus !== 1);
      });

      // Sort userData by username to maintain a constant order
      const sortedUserData = validUserData.sort((a, b) => a.username.localeCompare(b.username));
      setData(sortedUserData);

      // Extract unique project titles and sort them
      const titles = new Set();
      sortedUserData.forEach(user => {
        user.tasks.forEach(task => {
          titles.add(task.projectTitle);
        });
      });
      setProjectTitles(Array.from(titles).sort());

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeoutId;

    const pollData = async () => {
      await fetchData();
      timeoutId = setTimeout(pollData, POLLING_INTERVAL);
    };

    pollData(); // Start polling

    return () => clearTimeout(timeoutId); // Cleanup timeout on unmount
  }, []);

  const handleShowModal = (tasks, projectTitle, stage) => {
    const filteredTasks = tasks.filter(task => task.taskStage === stage);

    const tasksWithTimeSpent = filteredTasks.map(task => {
      const timeSpent = calculateTimeSpent(task.timelogs, task.taskStage);
      return { ...task, timeSpent };
    });

    setSelectedTasks(tasksWithTimeSpent);
    setSelectedProject(projectTitle);
    setSelectedStage(stage);
    setShowModal(true);
  };

  const calculateTimeSpent = (timelogs, taskStage) => {
    if (!timelogs || timelogs.length === 0) {
      return 0;
    }

    return timelogs.reduce((totalTime, log) => {
      const startTime = new Date(log.startTime).getTime();
      let endTime;

      if (log.endTime) {
        endTime = new Date(log.endTime).getTime();
      } else if (taskStage === 'Done') {
        endTime = startTime;
      } else {
        endTime = new Date().getTime();
      }

      return totalTime + (endTime - startTime);
    }, 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTasks([]);
    setSelectedProject('');
    setSelectedStage('');
  };
  
  const getColumnColor = (stage) => {
    if (stage === 'In Progress') return 'bg-yellow-500'; // Column color for 'In Progress'
    if (stage === 'Pause') return 'bg-red-600'; // Column color for 'Pause'
    if (stage === 'Done') return 'bg-green-700'; // Column color for 'Done'
    return 'bg-white-500'; // Default color
  };
  
  const formatTimeSpent = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days} day ${hours}h ${minutes}m ${seconds}s`;
};
  
  
  
  if (error) return <p>Error: {error}</p>;
  
  
  return (
    <>
      <div className='d-flex ml-2'>
        <h2 className="mt-2 text-center fs-5 text-dark">Employee Engagement</h2>
        <AdminPopupInfo />
        <ToastContainer />
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}
      <div className={`table-wrapper table-responsive scroll ml-2 ${loading ? 'opacity-50' : ''}`} style={{ height: '80vh', overflowY: 'auto' }}>
        <table className="table-auto w-full mt-4 border-collapse text-center table-bordered table-hover" style={{ borderRadius: "8px", overflow: "hidden" }}>
          <thead className="bg-gray-800 text-white sticky top-0">
            <tr>
              <th className="sticky left-0 bg-gray-800 px-4 py-2 z-10" style={{ minWidth: '100px', fontWeight: "200" }}>Sr.No</th>
              <th className="sticky left-[100px] bg-gray-800 px-4 py-2 z-10" style={{ minWidth: '200px', fontWeight: "200" }}>Name</th>
              {projectTitles.map((title, index) => (
                <th style={{ fontWeight: "200" ,minWidth: '350px'}} key={index}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px", fontWeight: "400" }}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={2 + projectTitles.length} className="text-center py-4">No Data Available</td>
              </tr>
            ) : data.map((user, userIndex) => (
              <tr key={user.userid} className="hover:bg-gray-100 text-dark">
                <td className="sticky left-0 border px-4 py-2 bg-white" style={{ minWidth: '100px' }}>{userIndex + 1}</td>
                <td className="sticky left-[100px] border px-4 py-2 bg-white" style={{ minWidth: '200px' }}>{user.username}</td>
                {projectTitles.map((title, projectIndex) => {
                  const tasks = user.tasks.filter(task => task.projectTitle === title);
                  const inProgressTasks = tasks.filter(task => task.taskStage === 'In Progress');
                  const pauseTasks = tasks.filter(task => task.taskStage === 'Pause');
                  const stageTasks = inProgressTasks.length > 0 ? inProgressTasks : pauseTasks;
                  const displayText = stageTasks.length > 1 ? (
                    <>
                      {stageTasks[0].taskTitle} <span style={{ color: 'blue',fontStyle:"italic" }}> +{stageTasks.length - 1} more</span>
                    </>
                  ) : (
                    stageTasks[0]?.taskTitle
                  );

                  return (
                    <td onClick={() => handleShowModal(tasks, title, stageTasks[0].taskStage)} className={`border cursor-pointer px-4 py-2 ${getColumnColor(stageTasks.length > 0 ? stageTasks[0].taskStage : 'default')}`} key={projectIndex} style={{ minWidth: '200px' }}>
                      {stageTasks.length > 0 && (
                        <button
                          className={`text-light`}
                        >
                          {displayText} 
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Transition appear show={showModal} as={Fragment}>
        <Dialog as='div' open={showModal} onClose={handleCloseModal} className="relative z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>
            <div className="fixed inset-0 flex items-center justify-center p-4 w-screen h-screen">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="rounded-md bg-white max-w-[65%] w-[55%]  ">
                  <Dialog.Title as='div' className="bg-white shadow px-6 py-4 rounded-t-md sticky top-0">
                    <div className="flex justify-between items-center">
                      <h2 className='fs-5'>Tasks for {selectedProject}</h2>
                    </div>
                    <button onClick={handleCloseModal} className='absolute right-6 top-4 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-gray-500/30 '>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Dialog.Title>
                  <div className="p-4 max-h-[80vh] overflow-y-auto">
                    {selectedTasks.length === 0 ? (
                      <p>No tasks in {selectedStage}</p>
                    ) : (
                      <ul className="space-y-4">
                        {selectedTasks.map((task, index) => (
                          <li key={index} className='text-dark'>
                            <div><strong className='d-inline-block' style={{ width: "110px",marginBottom:"3px" }}>Title:</strong> {task.taskTitle}</div>
                            <div style={{wordWrap:"break-word"}}><strong className='d-inline-block' style={{ width: "110px",marginBottom:"3px"}}>Description:</strong> {task.taskDescription}</div>
                            <div><strong className='d-inline-block' style={{ width: "110px",marginBottom:"3px" }}>Stage:</strong> {task.taskStage}</div>
                            <div><strong className='d-inline-block' style={{ width: "110px",marginBottom:"10px" }}>Time Spent:</strong> {formatTimeSpent(task.timeSpent)}</div>
                            <hr className="my-4" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
