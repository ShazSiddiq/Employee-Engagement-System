import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { PencilIcon, UserMinusIcon, UserPlusIcon, EyeIcon, ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/solid';
import BtnPrimary from '../components/BtnPrimary';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

const scrollableContainerStyles = {
  maxHeight: '300px',
  overflowY: 'auto',
  borderRadius: '5px',
  marginBottom: '10px',
  marginTop: '10px',
  fontSize: "14px"
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [isDeactivating, setIsDeactivating] = useState(true);
  const [profileImageModalOpen, setProfileImageModalOpen] = useState(false); // New state for profile image modal
  const [selectedImageUrl, setSelectedImageUrl] = useState(''); // New state for selected image URL
  const POLLING_INTERVAL = 5000; // Poll every 5 seconds

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const userResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/user/userlist`);
      const projectResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/projects`);
      const filteredProjects = projectResponse.data.filter(project => !project.deleteStatus || project.deleteStatus !== 1);
      const filteredUsers = userResponse.data.filter(user => user.role !== 'Admin');

      if (initialLoading) {
        const order = filteredUsers.map(user => user.userid);
        setOriginalOrder(order);
      }

      setUsers(filteredUsers);
      setProjects(filteredProjects);
      setInitialLoading(false);
    } catch (err) {
      setError(err.message);
      setInitialLoading(false);
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

  const openAssignModal = (userId) => {
    setSelectedUserId(userId);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedProjects([]);
  };

  const handleProjectChange = (projectId) => {
    setSelectedProjects(prevSelected => {
      if (prevSelected.includes(projectId)) {
        return prevSelected.filter(id => id !== projectId);
      } else {
        return [...prevSelected, projectId];
      }
    });
  };

  const handleAssignProjects = () => {
    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project.');
      return; // Prevent further execution if no projects are selected
    }
    if (selectedUserId) {
      axios.post(`${process.env.REACT_APP_BASE_URL}/assign-projects/${selectedUserId}`, { projectIds: selectedProjects })
        .then(response => {
          toast.success('Projects assigned successfully');
          closeAssignModal();
        })
        .catch(err => {
          console.error('Error assigning projects:', err);
        });
    }
  };
  

  const openConfirmationModal = (userId, deactivating) => {
    setSelectedUserId(userId);
    setIsDeactivating(deactivating);
    setIsConfirmationModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedUserId(null);
  };

  const toggleUserStatus = () => {
    if (selectedUserId) {
      const endpoint = isDeactivating
        ? `${process.env.REACT_APP_BASE_URL}/api/user/deactivate/${selectedUserId}`
        : `${process.env.REACT_APP_BASE_URL}/api/user/activate/${selectedUserId}`;

      axios.post(endpoint)
        .then(response => {
          toast.success(`User ${isDeactivating ? 'deactivated' : 'activated'} successfully`);
          setUsers(prevUsers => prevUsers.map(user =>
            user.userid === selectedUserId ? { ...user, isDeactivated: isDeactivating } : user
          ));
          closeConfirmationModal();
        })
        .catch(err => {
          console.error(`Error ${isDeactivating ? 'deactivating' : 'activating'} user:`, err);
        });
    }
  };

  const openProjectModal = (userId) => {
    axios.get(`${process.env.REACT_APP_BASE_URL}/assigned-projects/${userId}`)
      .then(response => {
        const { data: projects } = response;
        const filteredProjects = projects.filter(project => !project.deleteStatus || project.deleteStatus !== 1);

        setAssignedProjects(filteredProjects || []); // Handle undefined or null projects
        setIsProjectModalOpen(true);
      })
      .catch(err => {
        console.error('Error fetching assigned projects:', err);
      });
  };
  

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setAssignedProjects([]);
  };

  const openProfileImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setProfileImageModalOpen(true);
  };
  const closeProfileImageModal = () => {
    setProfileImageModalOpen(false);
    setSelectedImageUrl('');
  };

  const sortedUsers = users.sort((a, b) => originalOrder.indexOf(a.userid) - originalOrder.indexOf(b.userid));

  const UserProjectDetails = (userId) => {
    setSelectedUserId(userId); // Set the current project ID
    navigate('/admin-task-history', { state: { userId } });   // Navigate to the task history route and pass projectId
};

  if (error) return <p>Error: {error}</p>;

  return (
    <div className='ml-3'>
      <h2 className='mb-3 fs-5' style={{ fontWeight: "500" }}>Employee List <span>({users.length})</span></h2>
      <hr className='mt-2' />
      <table className='table table-striped table-responsive table-hover mt-3' style={{ borderRadius: "8px", overflow: "hidden" }}>
        <thead className='table-dark'>
          <tr>
            <th style={{ fontWeight: "200" }}>Employee Name</th>
            <th style={{ fontWeight: "200" }}>Email</th>
            <th style={{ fontWeight: "200" }}>Profile Image</th>
            <th style={{ maxWidth: '110px', fontWeight: "200" }}>Employee Status</th>
            <th style={{ maxWidth: '115px', fontWeight: "200" }}>Assigned Projects</th>
            <th style={{ fontWeight: "200" }}>Action</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: "14px", fontWeight: "400" }}>
          {sortedUsers.map(user => (
            <tr key={user.userid}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <img
                  src={`${process.env.REACT_APP_BASE_URL}/profile-images/${user.profileImage}`}
                  alt="Profile"
                  style={{ width: '50px', height: '50px', borderRadius: '50%',cursor: 'pointer' }}
                  onClick={() => openProfileImageModal(`${process.env.REACT_APP_BASE_URL}/profile-images/${user.profileImage}`)}
                />
              </td>
              <td>{user.isDeactivated ? 'Deactivated' : 'Active'}</td>
              <td style={{ textAlign: "center"  }}>
                <button
                style={{ float: "left", marginRight: "5px" }}
                  className='btn btn-info text-white'
                  onClick={() => openProjectModal(user.userid)}
                >
                  <EyeIcon className="h-4 w-4"  title='View Assigned Projects' />
                </button>
                <button
                  className='btn btn-info text-white'
                  onClick={() => UserProjectDetails(user.userid)}
                  style={{ float: "left" }}
                >
                  <ClockIcon className="h-4 w-4" style={{ textAlign: "center"}} title='View User History' />
                </button>
              </td>

              <td className=''>
                <button className='btn btn-success' style={{ float: "left", marginRight: "5px" }} onClick={() => openAssignModal(user.userid)}>
                  <ClipboardDocumentListIcon
                    className="h-4 w-3 cursor-pointer"
                    title='Assign Project'
                  />
                </button>
                <button
                  className={`btn ${user.isDeactivated ? 'btn-success' : 'btn-danger'}`}
                  style={{ float: "left" }}
                  onClick={() => openConfirmationModal(user.userid, !user.isDeactivated)}
                >
                  {user.isDeactivated ? (
                    <UserPlusIcon
                      className="h-4 w-3 cursor-pointer"
                      title='Activate Employee'
                    />
                  ) : (
                    <UserMinusIcon
                      className="h-4 w-3 cursor-pointer"
                      title='Deactivate Employee'
                    />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Assign Projects Modal */}
      <Transition appear show={isAssignModalOpen} as={Fragment}>
        <Dialog as="div" open={isAssignModalOpen} onClose={closeAssignModal} className="relative z-50">
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
                <Dialog.Panel className="rounded-md bg-white max-w-lg w-full overflow-y-hidden">
                  <Dialog.Title as='div' className='bg-white shadow px-6 py-4 rounded-t-md sticky top-0'>
                    <h1 className='fs-5'>Assign Projects</h1>
                    <button onClick={closeAssignModal} className='absolute right-6 top-4 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-gray-500/30'>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Dialog.Title>
                  <div className="p-6 overflow-y-auto" style={scrollableContainerStyles}>
                    <ul>
                      {projects.map(project => (
                        <li key={project._id} className='dropdown-div'>
                          <label>
                            <input
                              type="checkbox"
                              value={project._id}
                              checked={selectedProjects.includes(project._id)}
                              onChange={() => handleProjectChange(project._id)}
                            />
                            {project.title}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 gap-1 py-2 px-4 sm:flex sm:flex-row-reverse">
                    <BtnPrimary
                      onClick={handleAssignProjects}
                    >
                      Assign Projects
                    </BtnPrimary>
                    <button
                      className=" inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                      onClick={closeAssignModal}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onCancel={closeConfirmationModal}
        onConfirm={toggleUserStatus}
        message={`Are you sure you want to ${isDeactivating ? 'deactivate' : 'activate'} this user?`}
      />

      {/* Assigned Projects Modal */}
      <Transition appear show={isProjectModalOpen} as={Fragment}>
        <Dialog as="div" open={isProjectModalOpen} onClose={closeProjectModal} className="relative z-50">
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
                <Dialog.Panel className="rounded-md bg-white max-w-lg w-full overflow-y-hidden">
                  <Dialog.Title as='div' className='bg-white shadow px-6 py-4 rounded-t-md sticky top-0'>
                    <h1 className='fs-5'>Assigned Projects</h1>
                    <button onClick={closeProjectModal} className='absolute right-6 top-4 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-gray-500/30'>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Dialog.Title>
                  <div className="p-6 overflow-y-auto" style={scrollableContainerStyles}>
                    <ul>
                      {assignedProjects.length > 0 ? (
                        assignedProjects.map(project => (
                          <li key={project._id} className='dropdown-div'>
                            <span>{project.title}</span>
                          </li>
                        ))) :
                        (
                          <p>No assigned projects.</p>
                        )}
                    </ul>
                  </div>
                  {/* <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                      onClick={closeProjectModal}
                    >
                      Close
                    </button>
                  </div> */}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {/* Profile Image Modal */}
      <Transition show={profileImageModalOpen} as={Fragment}>
        <Dialog as="div" onClose={closeProfileImageModal}>
          <Dialog.Overlay className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex items-center justify-center p-2">
            <Dialog.Panel className="bg-white rounded p-4 max-w-md mx-auto">
              <Dialog.Title className="text-lg font-semibold">Profile Image</Dialog.Title>
              <div className="flex justify-center mt-4">
                <img
                  src={selectedImageUrl}
                  alt="Profile"
                  style={{ width: '100%', height: 'auto', maxHeight: '350px' }}
                />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  className=" inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                  onClick={closeProfileImageModal}
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

