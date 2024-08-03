import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BtnPrimary from '../components/BtnPrimary';
import ConfirmationModal from '../components/ConfirmationModal'; // Import the ConfirmationModal component
import { Modal, Button } from 'react-bootstrap';

export default function TimeExtension({ setExtensionRequestCount }) {
  const [users, setUsers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [originalOrder, setOriginalOrder] = useState([]);
  const newDateTimeRef = useRef(null);
  const POLLING_INTERVAL = 5000; // Poll every 5 seconds
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // State for confirmation modal visibility
  const [denyTaskId, setDenyTaskId] = useState(null); // State for task ID being denied

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/userdata`);
      const filteredUsers = response.data
        .map(user => ({
          ...user,
          tasks: user.tasks.filter(task => task.extensionRequest && task.extensionRequest.trim() !== "")
        }))
        .filter(user => user.tasks.length > 0);

      if (initialLoading) {
        const order = filteredUsers.flatMap(user => user.tasks.map(task => task.timelogs[0].taskid));
        setOriginalOrder(order);
      }

      setUsers(filteredUsers);
      setExtensionRequestCount(filteredUsers.reduce((count, user) => count + user.tasks.length, 0));

      if (initialLoading) {
        setInitialLoading(false);
      }
    } catch (error) {
      setError(error.message);
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
  }, [setExtensionRequestCount]);

  const handleGrantExtension = (taskId) => {
    console.log('Granting extension for task:', taskId);
    const task = users.reduce((foundTask, user) => {
      if (foundTask) return foundTask;
      return user.tasks.find(task => task.timelogs.some(timelog => timelog.taskid === taskId));
    }, null);

    if (!task) {
      toast.error('Task not found for taskId: ' + taskId);
      return;
    }

    console.log('Selected task:', task);
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleSubmitExtension = () => {
    if (!selectedTask) {
      toast.error('No task selected');
      return;
    }

    const taskId = selectedTask.timelogs[0].taskid;
    const newDateTime = newDateTimeRef.current.value;

    axios.put(`${process.env.REACT_APP_BASE_URL}/project/grantExtension/${taskId}`, { newDateTime })
      .then(response => {
        toast.success(response.data.message);
        setUsers(users.map(user => ({
          ...user,
          tasks: user.tasks.map(task => task.timelogs.some(timelog => timelog.taskid === taskId)
            ? { ...task, dateTime: newDateTime, extensionRequest: '' }
            : task
          )
        })));
        setShowModal(false);
      })
      .catch(error => {
        toast.error('Failed to grant extension: ' + error.message);
      });
  };

  const openConfirmationModal = (taskId) => {
    setDenyTaskId(taskId);
    setShowConfirmationModal(true);
  };

  const handleDenyExtension = async () => {
    if (!denyTaskId) return;

    try {
      const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/project/denyExtension/${denyTaskId}`);
      toast.success(response.data.message);
      setUsers(users.map(user => ({
        ...user,
        tasks: user.tasks.filter(task => !task.timelogs.some(timelog => timelog.taskid === denyTaskId))
      })));
      setExtensionRequestCount(prevCount => prevCount - 1);
      setShowConfirmationModal(false);
    } catch (error) {
      toast.error('Failed to deny extension: ' + error.message);
    }
  };

  if (initialLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const sortedUsers = users.map(user => ({
    ...user,
    tasks: user.tasks.sort((a, b) => originalOrder.indexOf(a.timelogs[0].taskid) - originalOrder.indexOf(b.timelogs[0].taskid))
  }));

  return (
    <div>
      <h1 className="mt-2 ml-2 mb-3 fs-5 text-dark">Time Extension Requests</h1>
      {sortedUsers.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", height: "70vh" }}>
          <img src="./image/no_time_request.png" alt="No Time Requests" />
        </div>
      ) : (
        <div className="table-wrapper table-responsive scroll ml-2" style={{ height: '80vh', overflowY: 'auto' }}>
          <table className='table table-striped table-auto w-full mt-3 border-collapse text-center table-bordered  table-hover' style={{ borderRadius: "8px", overflow: "hidden" }}>
            <thead className='table-dark text-center'>
              <tr>
                <th className="sticky left-0 bg-gray-800 px-4 py-2 z-10" style={{ minWidth: '200px', fontWeight: "200" }}>User Name</th>
                <th className="bg-gray-800 px-4 py-2 z-10" style={{ minWidth: '200px', fontWeight: "200" }}>User Email</th>
                <th style={{ minWidth: '230px', fontWeight: "200" }}>Project Title</th>
                <th style={{ minWidth: '150px', fontWeight: "200" }}>Task Title</th>
                <th style={{ minWidth: '300px', fontWeight: "200" }}>Time Extension Request</th>
                <th style={{ minWidth: '190px', fontWeight: "200" }}>Requested At</th>
                <th style={{ fontWeight: "200" }}>Action</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "14px", fontWeight: "400" }}>
              {sortedUsers.map(user => user.tasks.map(task => (
                <tr key={task.timelogs[0].taskid}>
                  <td className="sticky left-0 border px-4 py-2 bg-white" style={{ minWidth: '200px' }}>{user.username}</td>
                  <td className="border px-4 py-2 bg-white" style={{ minWidth: '200px' }}>{user.useremail}</td>
                  <td>{task.projectTitle}</td>
                  <td>{task.taskTitle}</td>
                  <td>{task.extensionRequest}</td>
                  <td>{new Date(task.createdAt).toLocaleString()}</td>
                  <td className='' style={{ minWidth: '150px' }}>
                    <div>
                      <button className='btn' onClick={() => handleGrantExtension(task.timelogs[0].taskid)} style={{ float: "left" }}>
                        <img src="./image/grant_extention_icon.png" title='Grant Extension' alt="Grant Extension Icon" width="30px" />
                      </button>
                      <button className='btn' onClick={() => openConfirmationModal(task.timelogs[0].taskid)} style={{ float: "left" }}>
                        <img src="./image/deny_extention_icon.png" alt="Deny Extension Icon" title='Deny Extension' width="30px" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Extension Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <h2 className='fs-5'>Grant Time Extension</h2>
        </Modal.Header>
        <Modal.Body>
          <label htmlFor="extensionDateTime" className="form-label">New Date and Time:</label>
          <input type="datetime-local" id="extensionDateTime" className="form-control" required ref={newDateTimeRef} />
        </Modal.Body>
        <Modal.Footer>
          <Button className="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600" onClick={() => setShowModal(false)}>Cancel</Button>
          <BtnPrimary onClick={handleSubmitExtension}>Submit</BtnPrimary>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onCancel={() => setShowConfirmationModal(false)}
        onConfirm={handleDenyExtension}
        message="Are you sure you want to deny this extension request?"
      />
    </div>
  );
}
