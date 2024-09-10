import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ClockIcon } from '@heroicons/react/24/solid';
import 'react-tooltip/dist/react-tooltip.css';
import BtnPrimary from './BtnPrimary';
import DropdownMenu from './DropdownMenu';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RemarkModal from './RemarkModal';
import AddTaskModal from './AddTaskModal';
import TaskModal from './TaskModal';
import ConfirmationModal from './ConfirmationModal';
import RequestExtensionModal from './RequestExtensionModal';
import PopupInfo from './PopupInfo';
import { ToastContainer } from 'react-toastify';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import ProjectModal from '../Admin/ProjectModel';


const DONE_STAGE = 'Done';
const ARCHIVE_STAGE = 'Archive';
const PAUSE_STAGE = 'Pause';
// const POLLING_INTERVAL = 30000; // Poll every 5 seconds

function Task() {
    const [columns, setColumns] = useState({});
    const [isAddTaskModalOpen, setAddTaskModal] = useState(false);
    const [isTaskOpen, setTaskOpen] = useState(false);
    const [taskId, setTaskId] = useState('');
    const [title, setTitle] = useState('');
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [remark, setRemark] = useState('');
    const [originalColumns, setOriginalColumns] = useState({});
    const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
    const [taskToMove, setTaskToMove] = useState(null);
    const [isExtensionModalOpen, setExtensionModalOpen] = useState(false);
    const [expiredTaskId, setExpiredTaskId] = useState(null);
    const [isRenderChange, setRenderChange] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [historyProjectId, setHistoryProjectId] = useState(null);
    const [isProjectOpen, setProjectOpen] = useState(false);
    const location = useLocation();



    const { projectId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, [projectId, isAddTaskModalOpen]);

    // useEffect(() => {
    //     let timeoutId;
    //     const pollData = async () => {
    //       await fetchTasks();
    //       timeoutId = setTimeout(pollData, POLLING_INTERVAL);
    //     };
    //     pollData(); // Start polling

    //     return () => clearTimeout(timeoutId); // Cleanup timeout on unmount
    //   }, []);

    const fetchTasks = () => {
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/${localStorage.getItem('userid')}`)
            .then((res) => {
                let project = res.data[0];
                let tasks = project.tasks;

                if (tasks.length > 0) {
                    // Filter out deleted tasks
                    tasks = tasks.filter(task => task.
                        deleteStatus !== 1);

                    setTitle(project.title);
                    setColumns({
                        [uuid()]: {
                            name: 'In Progress',
                            items: tasks
                                .filter((task) => task.stage === 'In Progress')
                                .sort((a, b) => a.order - b.order),
                        },
                        [uuid()]: {
                            name: 'Pause',
                            items: tasks
                                .filter((task) => task.stage === 'Pause')
                                .sort((a, b) => a.order - b.order),
                        },
                        [uuid()]: {
                            name: 'Done',
                            items: tasks
                                .filter((task) => task.stage === 'Done')
                                .sort((a, b) => a.order - b.order),
                        },
                        [uuid()]: {
                            name: 'Archive',
                            items: tasks
                                .filter((task) => task.stage === 'Archive')
                                .sort((a, b) => a.order - b.order),
                        },
                    });
                } else {
                    setTitle(project.title);
                    setColumns({});
                    setRenderChange(false);
                }
            })
            .catch((error) => {
                toast.error('Something went wrong');
            });
    };


    const updateTodo = (data) => {
        // const projectId = task.projectId; // Ensure you have the project ID

        axios
            .put(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/todo`, data)
            .then((res) => {
                toast.success('Task updated successfully');

            })
            .catch((error) => {
                toast.error('Something went wrong');
            });
    };


    const handleDelete = (e, taskId) => {
        // e.stopPropagation();
        axios
            .delete(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task/${taskId}`)
            .then((res) => {
                toast.success('Task is deleted');
                setRenderChange(true)
                fetchTasks();
            })
            .catch((error) => {
                toast.error('Something went wrong');
            });
    };

    const handleTaskDetails = (id) => {
        setTaskId({ projectId, id });
        setTaskOpen(true);
    };

    const openRemarkModal = (task) => {
        setSelectedTask(task);
        setTaskId(task._id);
        setShowRemarkModal(true);
    };

    const closeRemarkModal = () => {
        setColumns(originalColumns); // Restore the original columns
        setShowRemarkModal(false);
    };

    const saveRemarkAndMoveTask = async (remark, taskId) => {
        axios.put(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/remark/${taskId}`, { remark })
            .then((res) => {
                setShowRemarkModal(false);
                toast.success('Task is updated');
                setRemark('');
                fetchTasks(); // Fetch tasks again to update the state
            })
            .catch((error) => {
                console.error('API Error:', error.response.data); // Log API error
                if (error.response.status === 422) {
                    toast.error(error.response.data);
                } else {
                    toast.error('Something went wrong');
                }
            });
    };

    const calculateRemainingTime = (dateTime, stage) => {
        if (['Done', 'Archive'].includes(stage)) {
            return { expired: false, timeString: 'Not applicable' };
        }

        const now = new Date();
        const targetDate = new Date(dateTime);
        const difference = targetDate.getTime() - now.getTime();

        if (difference <= 0) {
            return { expired: true, timeString: 'Time has expired' };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);

        return { expired: false, timeString: `${days} days, ${hours} hours, and ${minutes} minutes` };
    };


    const onDragEnd = (result) => {

        const { source, destination } = result;
        if (!destination) {
            return;
        }

        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];

        if (sourceColumn.name === ARCHIVE_STAGE && destColumn.name !== ARCHIVE_STAGE) {
            toast.error('Tasks in Archive stage cannot be moved to another stage.');
            return;
        }

        if (destColumn.name === DONE_STAGE) {
            const task = sourceColumn.items[source.index];
            setTaskToMove({ task, source, destination });
            setConfirmationModalOpen(true);
            return;
        }
        // Decrement the count if the task is moved to the "Done" stage
        if (destColumn.name === DONE_STAGE) {
            const countElement = document.getElementById(`project-${projectId}-count`);

            if (countElement) {
                let currentCount = parseInt(countElement.textContent, 10);
                currentCount = Math.max(0, currentCount - 1); // Ensure count doesn't go below 0
                countElement.textContent = currentCount;
            }
        }
        if (destColumn.name === ARCHIVE_STAGE && sourceColumn.name !== DONE_STAGE) {
            toast.error('Tasks can only be moved to Archive from Done stage.');
            return;
        }

        if (sourceColumn.name === DONE_STAGE && destColumn.name !== ARCHIVE_STAGE) {
            toast.error('Tasks in Done stage cannot be moved to another stage.');
            return;
        }

        // Check if moving to Pause stage with an expired task
        if (destColumn.name === PAUSE_STAGE) {
            const task = sourceColumn.items[source.index];
            setOriginalColumns(columns); // Store the original state
            openRemarkModal(task); // Open remark modal when moved to Pause stage
            return;
        }

        // Check if moving from Pause stage to another stage
        if (sourceColumn.name === PAUSE_STAGE && destColumn.name !== PAUSE_STAGE) {
            const task = sourceColumn.items[source.index];
            const { expired, timeString } = calculateRemainingTime(task.dateTime);
            if (expired) {
                toast.error('Cannot move expired tasks back to In Progress.');
                return;
            }
        }

        const updatedColumns = { ...columns };
        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);

        updatedColumns[source.droppableId] = {
            ...sourceColumn,
            items: sourceItems,
        };

        updatedColumns[destination.droppableId] = {
            ...destColumn,
            items: destItems,
        };

        setColumns(updatedColumns);

        const data = {
            ...updatedColumns,
        };

        updateTodo(data);
    };

    const handleConfirmMoveToDone = () => {
        const { task, source, destination } = taskToMove;
        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];

        const updatedColumns = { ...columns };
        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);

        removed.stage = DONE_STAGE;

        updatedColumns[source.droppableId] = {
            ...sourceColumn,
            items: sourceItems,
        };

        updatedColumns[destination.droppableId] = {
            ...destColumn,
            items: destItems,
        };

        setColumns(updatedColumns);
        setConfirmationModalOpen(false);

        const data = {
            ...updatedColumns,
        };

        updateTodo(data);
    };

    const handleOpenExtensionModal = (taskId) => {
        setExpiredTaskId(taskId);
        setExtensionModalOpen(true);
    }

    const handleRequestExtension = (extensionRequest) => {
        axios.put(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/extensionRequest/${expiredTaskId}`, { extensionRequest })
            .then((res) => {
                setExtensionModalOpen(false);
                toast.success('Extension request sent');
                fetchTasks();
            })
            .catch((error) => {
                toast.error('Something went wrong');
            });
    };

    const handleProjectDetails = (projectId) => {
        setCurrentProjectId(projectId);
        setProjectOpen(true);
    };

    const UserProjectDetails = (projectId) => {
        setCurrentProjectId(projectId);  // Set the current project ID
        navigate('/task-history', { state: { projectId } });   // Navigate to the task history route and pass projectId
    };

    const isHomePage = location.pathname === '/';

    return (
        <div className="px-12 py-4 w-full">
            <div className="items-center justify-between mb-3">
                <div className='flex items-center justify-between'>
                    <div className='d-flex'>
                        {!isHomePage && (
                            <button
                                onClick={() => navigate(-1)}
                                className='bg-indigo-200 rounded-full p-[3px] mr-2 focus:outline-none focus:ring focus:ring-indigo-200 focus:ring-offset-1'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
                                    <path fillRule="evenodd" d="M15.293 6.293a1 1 0 010 1.414L10.414 12l4.879 4.879a1 1 0 01-1.414 1.414l-6.293-6.293a1 1 0 010-1.414l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <h1 className="text-xl text-gray-800 fw-bold flex justify-start items-center space-x-2.5">
                            <span>
                                {title.slice(0, 55)}
                                {title.length > 55 && '...'}
                            </span>
                            <img onClick={() => handleProjectDetails(projectId)} src='./image/file-circle-info.svg' width="20px" alt="icon" className='cursor-pointer' title='View Project details' />
                            
                        </h1>
                    </div>
                    <div className='d-flex gap-2 items-center'>
                    <ClockIcon
                            onClick={() => UserProjectDetails(projectId)}
                                className="h-7 w-7 cursor-pointer"
                                title='View Project details'
                                style={{color:"#212250"}}
                            />
                        <BtnPrimary onClick={() => setAddTaskModal(true)}>Add Task</BtnPrimary>
                    </div>


                </div>
                <form className="flex mt-2 relative" role="search">
                    <MagnifyingGlassIcon className="h-6 w-6 mt-1 text-gray-500 absolute " style={{ right: "46px", top: "2px" }} />
                    <input className="form-control me-2 text-dark" type="search" placeholder="Search" aria-label="Search" />
                    <PopupInfo></PopupInfo>
                    <ToastContainer />
                </form>
            </div>
            <hr className='mb-4'></hr>

            {Object.keys(columns).length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-10">
                    <img src="./image/welcome.svg" className="w-5/12" alt="" />
                    <h1 className="text-lg text-gray-600 text-center">No task available.
                        <br></br>
                        Please create your task here</h1>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-5 scroll" style={{ maxHeight: "60vh", overflow: "auto" }}>
                        {Object.entries(columns).map(([columnId, column], index) => {

                            return (
                                <div className="w-3/12 h-[580px]" key={columnId} >
                                    <div className="pb-2.5 w-full flex justify-between">
                                        <div className="inline-flex items-center space-x-2">
                                            <h2 className="text-[#1e293b] font-medium text-sm uppercase leading-3">{column.name}</h2>
                                            <span
                                                className={`h-5 inline-flex items-center justify-center px-2 mb-[2px] leading-none rounded-full text-xs font-semibold text-gray-500 border border-gray-300 ${column.items.length < 1 && 'invisible'
                                                    }`}
                                            >
                                                {column.items?.length}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Droppable droppableId={columnId} key={columnId}>
                                            {(provided, snapshot) => {
                                                return (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={`min-h-[530px] pt-4 duration-75 transition-colors border-t-2 border-indigo-400 ${snapshot.isDraggingOver && 'border-indigo-600'
                                                            }`}
                                                    >
                                                        {column.items.map((item, index) => {
                                                            const { expired, timeString } = calculateRemainingTime(item.dateTime);
                                                            return (
                                                                <Draggable key={item._id} draggableId={item._id} index={index}>
                                                                    {(provided, snapshot) => {

                                                                        return (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                style={{ ...provided.draggableProps.style }}
                                                                                onClick={() => handleTaskDetails(item._id)}
                                                                                className={`select-none px-3.5 pt-3.5 pb-2.5 mb-2 border border-gray-200 rounded-lg shadow-sm bg-white relative ${snapshot.isDragging && 'shadow-md'
                                                                                    }`}
                                                                            >
                                                                                <div className="pb-2">
                                                                                    <div className="flex item-center justify-between">
                                                                                        <h3 className="text-[#1e293b] font-medium text-sm capitalize">
                                                                                            {item.title.slice(0, 22)}
                                                                                            {item.title.length > 22 && '...'}
                                                                                        </h3>
                                                                                        <DropdownMenu
                                                                                            taskId={item._id}
                                                                                            handleDelete={(e) => handleDelete(e, item._id)}
                                                                                            taskStage={item.stage}
                                                                                            projectId={projectId}
                                                                                            setRenderChange={setRenderChange}
                                                                                        />
                                                                                    </div>
                                                                                    <p className="text-[#718096] text-xs mb-3 capitalize">
                                                                                        {item.description.slice(0, 22)}
                                                                                        {item.description.length > 22 && '...'}
                                                                                    </p>
                                                                                    <p className="text-[#718096] text-xs mb-2 mt-4">
                                                                                        Remaining Time:
                                                                                        <br />
                                                                                        {!['Done', 'Archive'].includes(item.stage) ? (
                                                                                            <span className="text-danger">{timeString}</span>
                                                                                        ) : (
                                                                                            <span className="text-green-600">Task Completed</span>
                                                                                        )}
                                                                                    </p>
                                                                                    {expired && !['Done', 'Archive'].includes(item.stage) && (
                                                                                        <BtnPrimary
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleOpenExtensionModal(item._id);
                                                                                            }}
                                                                                        >
                                                                                            Raise a Request
                                                                                        </BtnPrimary>
                                                                                    )}

                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                );
                                            }}
                                        </Droppable>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            )}
            {/* Remark Modal */}
            <RemarkModal
                isOpen={showRemarkModal}
                closeModal={closeRemarkModal}
                saveRemarkAndMoveTask={saveRemarkAndMoveTask}
                remark={remark}
                taskId={taskId}
                setRemark={setRemark}
            />
            <AddTaskModal isAddTaskModalOpen={isAddTaskModalOpen} setAddTaskModal={setAddTaskModal} projectId={projectId} />
            <TaskModal isOpen={isTaskOpen} setIsOpen={setTaskOpen} id={taskId} />
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModalOpen}
                onCancel={() => setConfirmationModalOpen(false)}
                onConfirm={handleConfirmMoveToDone}
                message="Are you sure you want to move this task to Done?"
            />
            {/* Request Extension Modal */}
            <RequestExtensionModal
                isOpen={isExtensionModalOpen}
                onCancel={() => setExtensionModalOpen(false)}
                onConfirm={handleRequestExtension}
                taskId={expiredTaskId}
            />

            <ProjectModal isOpen={isProjectOpen} setIsOpen={setProjectOpen} id={currentProjectId} />
            {/* <UserTaskHistory id={projectId}/> */}
        </div>
    );
}

export default Task;