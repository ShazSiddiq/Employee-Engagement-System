import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';
import AdminPopupInfo from '../components/AdminPopupInfo';
import { format } from 'date-fns';
import ProjectModal from './ProjectModel';
import { useNavigate } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/24/solid';

export default function AdminHome() {
  const [data, setData] = useState([]);
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true);
  const [projectTitles, setProjectTitles] = useState([]);
  const [projectDetails, setProjectDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [error, setError] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isProjectOpen, setProjectOpen] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false); // State for user modal
  const [selectedUser, setSelectedUser] = useState(null); // State to store selected user details
  const POLLING_INTERVAL = 5000; // Poll every 5 seconds

  const navigate = useNavigate();


  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/userdata`);
      const userData = response.data;

      const validUserData = userData.filter(user => user.userid);

      validUserData.forEach(user => {
        user.tasks = user.tasks.filter(task => !task.deleteStatus || task.deleteStatus !== 1);
      });

      const sortedUserData = validUserData.sort((a, b) => a.userid.localeCompare(b.userid));
      setData(sortedUserData);
      setUserId(sortedUserData.userid)

      // Extract unique project titles and IDs and sort them
      const projectDetail = [];

      sortedUserData.forEach(user => {
        user.tasks.forEach(task => {
          if (!projectDetail.some(p => p.projectId === task.projectId)) {
            projectDetail.push({ projectId: task.projectId, projectTitle: task.projectTitle });
          }
        });
      });

      setProjectDetails(projectDetail);
      setProjectTitles(projectDetail.map(p => p.projectTitle));
      setCurrentProjectId(projectDetail.map(p => p.projectId));
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleProjectDetails = (projectId) => {
    setCurrentProjectId(projectId);
    setProjectOpen(true);
  };


  useEffect(() => {
    let timeoutId;

    const pollData = async () => {
      fetchData();
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

  const handleUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Range of Working Hour
  const WORKING_HOURS = [
    { day: 'Monday', startHour: 10, endHour: 18 },   // 10 AM - 6 PM
    { day: 'Tuesday', startHour: 10, endHour: 18 },  // 10 AM - 6 PM
    { day: 'Wednesday', startHour: 10, endHour: 18 },// 10 AM - 6 PM
    { day: 'Thursday', startHour: 10, endHour: 18 }, // 10 AM - 6 PM
    { day: 'Friday', startHour: 10, endHour: 18 },   // 10 AM - 6 PM
    { day: 'Saturday', startHour: 10, endHour: 18 }, // 10 AM - 6 PM
    { day: 'Sunday', startHour: 0, endHour: 0 },     // Non-working day
  ];

  const getWorkingHoursForDay = (date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return WORKING_HOURS.find(day => day.day === dayName);
  };

  const calculateWorkingHoursBetween = (start, end) => {
    let totalWorkingHours = 0;
    let current = new Date(start);

    while (current < end) {
      const workingHours = getWorkingHoursForDay(current);

      if (workingHours && workingHours.startHour < workingHours.endHour) {
        const dayStart = new Date(current);
        dayStart.setHours(workingHours.startHour, 0, 0, 0); // Working start time for the day
        const dayEnd = new Date(current);
        dayEnd.setHours(workingHours.endHour, 0, 0, 0); // Working end time for the day

        const workStart = current > dayStart ? current : dayStart;
        const workEnd = end < dayEnd ? end : dayEnd;

        // Calculate time spent within working hours
        if (workStart < workEnd) {
          totalWorkingHours += (workEnd - workStart);
        }
      }

      current.setDate(current.getDate() + 1); // Move to the next day
      current.setHours(0, 0, 0, 0); // Reset time for next day
    }

    return totalWorkingHours  // Convert milliseconds to hours
  };

  const calculateTimeSpent = (timelogs, taskStage) => {
    if (!timelogs || timelogs.length === 0) {
      return 0;
    }

    return timelogs.reduce((totalTime, log) => {
      const startTime = new Date(log.startTime);
      let endTime;

      if (log.endTime) {
        endTime = new Date(log.endTime);
      } else if (taskStage === 'Done') {
        endTime = startTime; // Handle case when task is marked as 'Done' without an end time
      } else {
        endTime = new Date(); // Use current time if not done
      }

      if (endTime < startTime) {
        return totalTime; // Ignore if end time is before start time
      }

      // Log startTime and endTime for debugging
      console.log({
        startTime,
        endTime
      });

      // Add the time difference calculated within working hours
      return totalTime + calculateWorkingHoursBetween(startTime, endTime);
    }, 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTasks([]);
    setSelectedProject('');
    setSelectedStage('');
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getColumnColor = (stage) => {
    if (stage === 'In Progress') return 'bg-[#ffdf7c]'; // Column color for 'In Progress'
    if (stage === 'Pause') return 'bg-[#e55e5e]'; // Column color for 'Pause'
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

  const getOrdinalSuffix = (day) => {
    const j = day % 10;
    const k = Math.floor(day / 10);
    if (k === 1) return 'th';
    if (j === 1) return 'st';
    if (j === 2) return 'nd';
    if (j === 3) return 'rd';
    return 'th';
  };

  const formatDateWithOrdinal = (date) => {
    const formattedDate = format(new Date(date), 'MMMM d, yyyy \'at\' h:mm:ss a');
    const day = new Date(date).getDate();
    return formattedDate.replace(/(\d+)/, `${day}${getOrdinalSuffix(day)}`);
  };

  const UserProjectDetails = (userId) => {
    setUserId(userId); // Set the current project ID
    navigate('/admin-task-history', { state: { userId } });   // Navigate to the task history route and pass projectId
  };

  if (error) return <p>Error: {error}</p>;
  return (
    <>
      <div className='d-flex ml-2'>
        <h1 className="mt-2 text-center fs-5 text-dark" style={{ fontWeight: "500" }}>Employee Engagement <span>({data.length})</span></h1>
        <AdminPopupInfo />
        <ToastContainer />
      </div>
      <hr className='mt-2 ml-2' />
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}
      <div className={`table-wrapper table-responsive scroll ml-2 ${loading ? 'opacity-50' : ''}`} style={{ height: '80vh', overflowY: 'auto' }}>
        <table className="table-auto w-full mt-4 border-collapse text-center  table-hover" style={{ borderRadius: "8px", overflow: "hidden" }}>
          <thead className="bg-gray-800 text-white sticky top-0">
            <tr>
              <th className="sticky left-0 bg-gray-800 px-4 py-2 z-10" style={{ minWidth: '100px', fontWeight: "200" }}>Sr.No</th>
              <th className="sticky left-[100px] bg-gray-800 px-4 py-2 z-10" style={{ minWidth: '200px', fontWeight: "200" }}>Name</th>
              {projectDetails.map((title, index) => (
                <th style={{ fontWeight: "200", minWidth: '250px' }} key={index}>
                  <div className='project-icon'>
                    <span style={{ width: "70%" }}>{title.projectTitle.slice(0, 30)}
                      {title.projectTitle.length > 30 && '...'} </span>
                    <img
                      onClick={() => handleProjectDetails(title.projectId)}
                      src='./image/file-circle-info-admin.svg'
                      width="20px"
                      alt="icon"
                      className='cursor-pointer'
                      title='View Project details'
                    />
                  </div>
                </th>
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
                <td
                  className="sticky left-[100px] border px-4 py-2 bg-white cursor-pointer flex gap-2 align-item"
                  onClick={() => handleUserModal(user)} // Open user modal on name click
                >
                  <span>{user.username} </span><span><ClockIcon
                    onClick={() => UserProjectDetails(user.userid)}
                    className="h-7 w-7 cursor-pointer"
                    title='View Project History'
                    style={{ color: "#212250" }}
                  /></span>
                </td>
                {projectTitles.map((title, projectIndex) => {
                  const tasks = user.tasks.filter(task => task.projectTitle === title);
                  const inProgressTasks = tasks.filter(task => task.taskStage === 'In Progress');
                  const pauseTasks = tasks.filter(task => task.taskStage === 'Pause');
                  const stageTasks = inProgressTasks.length > 0 ? inProgressTasks : pauseTasks;
                  const displayText = stageTasks.length > 1 ? (
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "200px" }}>
                      {stageTasks[0].taskTitle} <span style={{ color: 'blue', fontStyle: "italic" }}> +{stageTasks.length - 1} more</span>
                    </span>
                  ) : (
                    stageTasks[0]?.taskTitle
                  );

                  return (
                    <td onClick={() => handleShowModal(tasks, title, stageTasks[0].taskStage)} className={`border cursor-pointer px-4 py-2 ${getColumnColor(stageTasks.length > 0 ? stageTasks[0].taskStage : 'default')}`} key={projectIndex} style={{ minWidth: '200px' }}>
                      {stageTasks.length > 0 && (
                        <button
                          className={`text-dark`}
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
                      <h2 className='fs-5' style={{ width: "98%" }}>Tasks for {selectedProject}</h2>
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
                            <div><strong className='d-inline-block' style={{ width: "210px", marginBottom: "3px" }}>Title:</strong> {task.taskTitle}</div>
                            <div style={{ wordWrap: "break-word" }}><strong className='d-inline-block' style={{ width: "210px", marginBottom: "3px" }}>Description:</strong> {task.taskDescription}</div>
                            <div><strong className='d-inline-block' style={{ width: "210px", marginBottom: "3px" }}>Stage:</strong> {task.taskStage}</div>
                            <div><strong className='d-inline-block' style={{ width: "210px", marginBottom: "3px" }}>Task CreationDate:</strong> {task.createdAt ? formatDateWithOrdinal(task.createdAt) : 'N/A'}</div>
                            <div><strong className='d-inline-block' style={{ width: "210px", marginBottom: "3px" }}>Task CompletionDate:</strong> {task.taskCompletionDate ? formatDateWithOrdinal(task.taskCompletionDate) : 'N/A'}</div>
                            {/* {taskData.created_at ? formatDateWithOrdinal(taskData.created_at) : 'N/A'} */}
                            <div><strong className='d-inline-block' style={{ width: "210px", marginBottom: "10px" }}>Time Spent:</strong> {formatTimeSpent(task.timeSpent)}</div>
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
      {/* User Details Modal */}
      <Transition appear show={showUserModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseUserModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    User Details
                  </Dialog.Title>
                  <div className="mt-2">
                    {selectedUser && (
                      <>
                        <img
                          src={`${process.env.REACT_APP_BASE_URL}/profile-images/${selectedUser.userProfile}`}
                          alt="User Profile"
                          className="profile-image w-32 h-32 rounded-full mx-auto"
                        />
                        <p className="text-lg text-center mt-4">
                          {selectedUser.username}
                        </p>
                        <p className="text-lg text-center mt-1">
                          {selectedUser.useremail}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="float-right inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                      onClick={handleCloseUserModal}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <ProjectModal isOpen={isProjectOpen} setIsOpen={setProjectOpen} id={currentProjectId} />
    </>
  );
}
