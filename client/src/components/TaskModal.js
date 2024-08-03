import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, differenceInMilliseconds } from 'date-fns';

const TaskModal = ({ isOpen, setIsOpen, id }) => {
    const [taskData, setTaskData] = useState('');

    const capitalizeFirstLetter = (string) => {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    };

    const formatDate = (date) => {
        return format(new Date(date), 'PPPpp');
    };

    const calculateRemainingTime = (completionDateTime) => {
        const now = new Date();
        const completionDate = new Date(completionDateTime);
        const remainingTimeMs = differenceInMilliseconds(completionDate, now);

        if (remainingTimeMs <= 0) {
            return 'Time is up';
        }

        const days = Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingTimeMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remainingTimeMs / (1000 * 60)) % 60);

        return `${days} days, ${hours} hours, and ${minutes} minutes remaining`;
    };

    useEffect(() => {
        if (isOpen) {
            axios.get(`${process.env.REACT_APP_BASE_URL}/project/${id.projectId}/task/${id.id}`)
                .then((data) => {
                    setTaskData({ ...data.data[0].task[0] });
                    // console.log(taskData);
                })
                .catch((error) => {
                    toast.error('Something went wrong');
                });
        }
    }, [isOpen]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as='div' open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
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
                            <Dialog.Panel className="rounded-md bg-white max-w-[75%] w-[55%] h-[65%] overflow-y-hidden">
                                <Dialog.Title as='div' className={'bg-white shadow px-6 py-4 rounded-t-md sticky top-0'}>
                                    <h1>Task details</h1>
                                    <button onClick={() => setIsOpen(false)} className='absolute right-6 top-4 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-gray-500/30 '>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                <div className='flex gap-0' style={{height:"80%"}}>
                                    <div className="w-12/12 px-8 space-y-3 py-4 min-h-max  overflow-y-auto">
                                        <h1 className='text-3xl font-bold '>{capitalizeFirstLetter(taskData.title)}</h1>
                                        <p className='text-gray-600' style={{wordWrap:"break-word"}}>{capitalizeFirstLetter(taskData.description)}</p>
                                        <div>
                                            <h3 className='text-base text-gray-600 font-medium mt-3 mb- font-semibold'>Completion Date and Time</h3>
                                            <p className='text-gray-600'>{taskData.dateTime ? formatDate(taskData.dateTime) : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h3 className='text-base text-gray-600 font-medium mt-3 mb-2 font-semibold'>Remaining Time</h3>
                                            <p className='text-red-600'>{taskData.dateTime ? calculateRemainingTime(taskData.dateTime) : 'N/A'}</p>
                                        </div>
                                    </div>
                                    {/* <div className="w-4/12 py-4 pr-4">
                                        
                                    </div> */}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default TaskModal;
