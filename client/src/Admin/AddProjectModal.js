import React, { Fragment, memo, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BtnPrimary from '../components/BtnPrimary';

const AddProjectModal = ({ isModalOpen, closeModal, edit = false, id = null }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        if (edit && isModalOpen) {
            axios.get(`${process.env.REACT_APP_BASE_URL}/project/${id}`)
                .then((res) => {
                    setTitle(res.data.data.title);
                    setDesc(res.data.data.description);
                    // Format date and time for the input fields
                    const formattedDate = new Date(res.data.data.dateTime).toISOString().split('T')[0];
                    setDate(formattedDate);

                    const formattedTime = new Date(res.data.data.dateTime).toISOString().split('T')[1]?.substring(0, 5) || '';
                    setTime(formattedTime);
                })
                .catch((e) => {
                    console.log(e);
                    toast.error('Something went wrong');
                });
        }
        setCurrentDate(new Date().toISOString().split('T')[0]);
    }, [edit, id, isModalOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Combine date and time
        const dateTime = `${date}T${time}:00Z`;

        if (date <= currentDate) {
            toast.error('All the Input fields are Required.');
            return;
        }
        const data = { title, description: desc ,dateTime};

        const request = edit
            ? axios.put(`${process.env.REACT_APP_BASE_URL}/project/${id}`, data)
            : axios.post(`${process.env.REACT_APP_BASE_URL}/project/`, data);

        request
            .then((res) => {
                closeModal();
                const customEvent = new CustomEvent('projectUpdate', { detail: { ...res.data } });
                document.dispatchEvent(customEvent);
                toast.success(`Project ${edit ? 'updated' : 'created'} successfully`);
                setTitle('');
                setDesc('');
            })
            .catch((error) => {
                if (error.response && error.response.status === 422) {
                    toast.error(error.response.data.details[0].message);
                } else {
                    toast.error('Something went wrong');
                }
            });
    };

    return (
        <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as='div' open={isModalOpen} onClose={closeModal} className="relative z-50">
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
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="rounded-md bg-white w-full max-w-lg">
                                <Dialog.Title as='div' className="bg-white shadow px-6 py-4 rounded-t-md sticky top-0">
                                    <div className="flex justify-between items-center">
                                        <h1>{edit ? 'Edit Project' : 'Create Project'}</h1>
                                        <button
                                            onClick={closeModal}
                                            className="text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-indigo-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="px-8 py-4">
                                    <div className="mb-3">
                                        <label htmlFor="title" className="block text-gray-600">Title</label>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            type="text"
                                            id="title"
                                            className="border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400"
                                            placeholder="Project title"
                                        />
                                    </div>
                                    <div className='mb-3'>
                                        <label htmlFor="date" className='block text-gray-600'>Date for completion <span className="required">*</span></label>
                                        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" min={currentDate} className='border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400' />
                                    </div>
                                    <div className='mb-3'>
                                        <label htmlFor="time" className='block text-gray-600'>Time for completion <span className="required">*</span></label>
                                        <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className='border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400' />
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="description" className="block text-gray-600">Description</label>
                                        <textarea
                                            value={desc}
                                            onChange={(e) => setDesc(e.target.value)}
                                            id="description"
                                            className="border border-gray-300 rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400"
                                            rows="6"
                                            placeholder="Project description"
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end items-center space-x-2">
                                        <button className='inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600' onClick={closeModal}>Cancel</button>
                                        <BtnPrimary>Save</BtnPrimary>
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

export default memo(AddProjectModal);
