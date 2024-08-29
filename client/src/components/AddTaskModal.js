import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import BtnPrimary from './BtnPrimary';
import axios from 'axios';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AddTaskModal = ({ isAddTaskModalOpen, setAddTaskModal, projectId = null, taskId = null, edit = false, refreshData }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentDate, setCurrentDate] = useState('');
    const [titleError, setTitleError] = useState('');
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');
    const [descError, setDescError] = useState('');
    const [loading, setLoading] = useState(false); // Loading state

    useEffect(() => {
        if (edit && isAddTaskModalOpen && projectId && taskId) {
            axios.get(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task/${taskId}`)
                .then((res) => {
                    setTitle(res.data[0].task[0].title || '');
                    setDesc(res.data[0].task[0].description || '');
                    const formattedDate = new Date(res.data[0].task[0].dateTime);
                    setDate(formattedDate.toISOString().split('T')[0]);
                    setSelectedDate(formattedDate);
                    const formattedTime = formattedDate.toISOString().split('T')[1]?.substring(0, 5) || '';
                    setTime(formattedTime);
                })
                .catch(() => {
                    toast.error('Something went wrong');
                });
        }
        setCurrentDate(new Date().toISOString().split('T')[0]);
    }, [isAddTaskModalOpen, edit, projectId, taskId]);

    const handleInputChange = (setter, errorSetter, minLength, maxLength) => (e) => {
        let value = e.target.value;
    
        // Prevent input beyond the maximum length
        if (value.length > maxLength) {
            value = value.slice(0, maxLength); // Truncate the input to the maxLength
        }
    
        setter(value);
    
        // Validate and set error messages
        if (value.trim() === '') {
            errorSetter('This field is required.');
        } else if (value.length < minLength) {
            errorSetter(`Must be at least ${minLength} characters long.`);
        } else if (value.length === maxLength) {
            errorSetter(`Cannot exceed ${maxLength} characters.`);
        } else {
            errorSetter('');
        }
    };

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

    const handleTimeChange = (selectedTime) => {
        setTime(selectedTime);
        setTimeError('');
        if (!selectedTime || !date) return;

        const dateTime = `${date}T${selectedTime}:00Z`;
        if (!iso8601Regex.test(dateTime)) {
            setDateError('Date-time must be in ISO 8601 format.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (loading) return;
        setLoading(true);

        setTitleError('');
        setDateError('');
        setTimeError('');
        setDescError('');

        if (title.trim() === '') {
            setTitleError('Title is required.');
            setLoading(false);
            return;
        }

        if (title.length < 2) {
            setTitleError('Title must be at least 2 characters long.');
            setLoading(false);
            return;
        }

        if (title.length > 255) {
            setTitleError('Title cannot exceed 255 characters.');
            setLoading(false);
            return;
        }

        if (!edit && !date.trim()) {
            setDateError('Date is required.');
            setLoading(false);
            return;
        }

        if (!edit && !time.trim()) {
            setTimeError('Time is required.');
            setLoading(false);
            return;
        }

        if (desc.trim() === '') {
            setDescError('Description is required.');
            setLoading(false);
            return;
        }

        if (desc.length < 3) {
            setDescError('Description must be at least 02 characters long.');
            setLoading(false);
            return;
        }

        if (desc.length > 500) {
            setDescError('Description cannot exceed 500 characters.');
            setLoading(false);
            return;
        }

        const dateTime = `${date}T${time}:00Z`;

        if (!iso8601Regex.test(dateTime)) {
            setDateError('Date-time must be in ISO 8601 format.');
            setLoading(false);
            return;
        }


        // Combine date and time
        const combinedDateTime = new Date(`${date}T${time}:00`);
        const taskData = {
            title,
            description: desc,
            userid: localStorage.getItem("userid"),
            ...(edit ? {} : { dateTime: combinedDateTime.toISOString() }),
        };

        const request = !edit
            ? axios.post(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task`, taskData)
            : axios.put(`${process.env.REACT_APP_BASE_URL}/project/${projectId}/task/${taskId}`, taskData);

        request
            .then((res) => {
                setAddTaskModal(false);
                const customEvent = new CustomEvent('projectUpdate', { detail: { ...res.data.task[0] } });
                document.dispatchEvent(customEvent);
                toast.success(edit ? 'Task updated successfully' : 'Task created successfully');
                if (refreshData && typeof refreshData === 'function') {
                    refreshData(true);
                }
                setTitle('');
                setDesc('');
                setDate('');
                setTime('');
                setSelectedDate(null);
            })
            .catch((error) => {
                if (error.response && error.response.status === 422) {
                    error.response.data.forEach(errorMessage => toast.error(errorMessage));
                } else {
                    toast.error('Something went wrong');
                }
            })
            .finally(() => {
                setLoading(false);
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
                                <Dialog.Title as='div' className='bg-white shadow px-6 py-4 rounded-t-md sticky top-0'>
                                    {!edit ? (<h1>Add Task</h1>) : (<h1>Edit Task</h1>)}
                                    <button onClick={() => setAddTaskModal(false)} className='absolute right-6 top-6 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-indigo-200'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className='gap-4 px-8 py-4'>
                                    <div className='mb-3'>
                                        <label htmlFor="title" className='block text-gray-600'>Title <span className="required">*</span></label>
                                        <input
                                            value={title}
                                            onChange={handleInputChange(setTitle, setTitleError, 2, 255)}
                                            type="text"
                                            id="title"
                                            className='mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200'
                                            placeholder="Enter title"
                                        />
                                        {titleError && <p className="text-red-600 text-sm">{titleError}</p>}
                                    </div>
                                    {!edit && (
                                        <>
                                            <div className='mb-3'>
                                                <label htmlFor="date" className='block text-gray-600'>Completion Date <span className="required">*</span></label>
                                                <DatePicker
                                                    selected={selectedDate}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            // Set the time to noon to avoid timezone issues
                                                            const adjustedDate = new Date(date.getTime() + 12 * 60 * 60 * 1000);
                                                            setSelectedDate(adjustedDate);
                                                            setDate(adjustedDate.toISOString().split('T')[0]);
                                                        } else {
                                                            setSelectedDate(null);
                                                            setDate('');
                                                        }
                                                    }}
                                                    dateFormat="yyyy-MM-dd"
                                                    minDate={new Date()}
                                                    className='mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200'
                                                    placeholderText="Select a date"
                                                    showMonthDropdown
                                                    showYearDropdown
                                                    dropdownMode="select"
                                                    wrapperClassName="w-full"
                                                />
                                                {dateError && <p className="text-red-600 text-sm">{dateError}</p>}
                                            </div>
                                            <div className='mb-3'>
                                                <label htmlFor="time" className='block text-gray-600'>Completion Time <span className="required">*</span></label>
                                                <input
                                                    value={time}
                                                    onChange={handleInputChange(setTime, setTimeError)}
                                                    onBlur={(e) => handleTimeChange(e.target.value)}
                                                    type="time"
                                                    id="time"
                                                    className='mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200'
                                                />
                                                {timeError && <p className="text-red-600 text-sm">{timeError}</p>}
                                            </div>
                                        </>
                                    )}
                                    <div className='mb-3'>
                                        <label htmlFor="desc" className='block text-gray-600'>Description <span className="required">*</span></label>
                                        <textarea
                                            value={desc}
                                            onChange={handleInputChange(setDesc, setDescError, 2, 500)}
                                            id="desc"
                                            className='mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200'
                                            rows="5"
                                            placeholder="Enter description"
                                        ></textarea>
                                        {descError && <p className="text-red-600 text-sm">{descError}</p>}
                                    </div>
                                    <div className='mb-2 flex gap-2 justify-end text-right'>
                                        <button type="button" onClick={() => setAddTaskModal(false)} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600">
                                            Cancel
                                        </button>
                                        <BtnPrimary
                                            type="submit"
                                            disabled={loading}
                                            className={`w-40 ${loading ? 'opacity-50' : ''}`}
                                        >
                                            {loading ? 'Processing...' : edit ? 'Update Task' : 'Create Task'}
                                        </BtnPrimary>
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
