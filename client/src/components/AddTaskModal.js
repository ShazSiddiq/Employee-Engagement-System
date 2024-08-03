import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import BtnPrimary from './BtnPrimary';
import BtnSecondary from './BtnSecondary';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddTaskModal = ({ isAddTaskModalOpen, setAddTaskModal, projectId = null, taskId = null, edit = false, refreshData }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    let userid = localStorage.getItem("userid");

    useEffect(() => {
        if (edit && isAddTaskModalOpen && projectId && taskId) {
            axios.get(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task/${taskId}`)
                .then((res) => {
                    setTitle(res.data[0].task[0].title || '');
                    setDesc(res.data[0].task[0].description || '');
                    const formattedDate = new Date(res.data[0].task[0].dateTime).toISOString().split('T')[0];
                    setDate(formattedDate);
                    const formattedTime = new Date(res.data[0].task[0].dateTime).toISOString().split('T')[1]?.substring(0, 5) || '';
                    setTime(formattedTime);
                })
                .catch((error) => {
                    toast.error('Something went wrong');
                });
        }
        setCurrentDate(new Date().toISOString().split('T')[0]);
    }, [isAddTaskModalOpen, edit, projectId, taskId]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const dateTime = `${date}T${time}:00Z`;

        if (!edit && date <= currentDate) {
            toast.error('All the Input fields are Required.');
            return;
        }

        const taskData = {
            title,
            description: desc,
            userid,
            ...(edit ? {} : { dateTime })
        };

        const request = !edit
            ? axios.post(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task`, taskData)
            : axios.put(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task/${taskId}`, taskData);

        request
            .then((res) => {
                console.log(res);
                setAddTaskModal(false);
                const customEvent = new CustomEvent('projectUpdate', { detail: { ...res.data.task[0] } });
                document.dispatchEvent(customEvent);
                toast.success(edit ? 'Task updated successfully' : 'Task created successfully');
                if (refreshData && typeof refreshData === 'function') {
                    console.log('Calling refreshData function...');
                    refreshData(true);
                } else {
                    console.log('refreshData is not a function or not provided');
                }
                setTitle('');
                setDesc('');
                setDate('');
                setTime('');
            })
            .catch((error) => {
                if (error.response && error.response.status === 422) {
                    error.response.data.forEach(errorMessage => toast.error(errorMessage));
                } else {
                    toast.error('Something went wrong');
                }
            });
    };

    return (
        <Transition appear show={isAddTaskModalOpen} as={Fragment}>
            <Dialog as='div' open={isAddTaskModalOpen} onClose={() => setAddTaskModal(false)} className="relative z-50">
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
                            <Dialog.Panel className="rounded-md bg-white w-6/12">
                                <Dialog.Title as='div' className={'bg-white shadow px-6 py-4 rounded-t-md sticky top-0'}>
                                    {!edit ? (<h1>Add Task</h1>) : (<h1>Edit Task</h1>)}
                                    <button onClick={() => setAddTaskModal(false)} className='absolute right-6 top-4 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-indigo-200 '>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className='gap-4 px-8 py-4'>
                                    <div className='mb-3'>
                                        <label htmlFor="title" className='block text-gray-600'>Title <span className="required">*</span></label>
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className='border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400' placeholder='Task title' />
                                    </div>

                                    <div className='mb-2'>
                                        <label htmlFor="date" className='block text-gray-600'>Date for completion <span className="required">*</span></label>
                                        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" min={currentDate} className='border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400' disabled={edit} />
                                    </div>
                                    <div className='mb-2'>
                                        <label htmlFor="time" className='block text-gray-600'>Time for completion <span className="required">*</span></label>
                                        <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className='border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400' disabled={edit} />
                                    </div>
                                    <div className='mb-4'>
                                        <label htmlFor="desc" className='block text-gray-600'>Description <span className="required">*</span></label>
                                        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className='border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400' placeholder='Description of the task'></textarea>
                                    </div>

                                    <div className='flex justify-end gap-1'>
                                        <button className='inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600' onClick={() => setAddTaskModal(false)}>Cancel</button>
                                        <BtnPrimary type='submit'>{edit ? 'Update Task' : 'Add Task'}</BtnPrimary>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AddTaskModal;
