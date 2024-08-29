import React, { Fragment, memo, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BtnPrimary from '../components/BtnPrimary';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AddProjectModal = ({ isModalOpen, closeModal, edit = false, id = null }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [titleError, setTitleError] = useState('');
    const [descError, setDescError] = useState('');
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');

    useEffect(() => {
        if (edit && isModalOpen) {
            axios.get(`${process.env.REACT_APP_BASE_URL}/project/${id}`)
                .then((res) => {
                    setTitle(res.data.data.title);
                    setDesc(res.data.data.description);

                    const dateTime = new Date(res.data.data.dateTime);
                    const formattedDate = dateTime.toISOString().split('T')[0];
                    const formattedTime = dateTime.toISOString().split('T')[1]?.substring(0, 5) || '';

                    setDate(formattedDate);
                    setTime(formattedTime);
                    setSelectedDate(dateTime);
                })
                .catch((e) => {
                    console.log(e);
                    toast.error('Something went wrong');
                });
        }
    }, [edit, id, isModalOpen]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        // Clear previous errors
        setTitleError('');
        setDescError('');
        setDateError('');
        setTimeError('');

        // Validate inputs
        if (!title.trim()) {
            setTitleError('Title is required.');
            return;
        }
        if (title.length < 3 || title.length > 255) {
            setTitleError('Title must be between 3 and 255 characters.');
            return;
        }
        if (!date.trim()) {
            setDateError('Date is required.');
            return;
        }
        if (!time.trim()) {
            setTimeError('Time is required.');
            return;
        }
        if (!desc.trim()) {
            setDescError('Description is required.');
            return;
        }
        if (desc.length < 3 || desc.length > 500) {
            setDescError('Description must be between 3 and 500 characters.');
            return;
        }

        // Combine date and time
        const combinedDateTime = new Date(`${date}T${time}:00`);
        const data = {
            title,
            description: desc,
            dateTime: combinedDateTime.toISOString(),
        };

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
                setDate('');
                setTime('');
            })
            .catch((error) => {
                console.log(error);

                if (error.response && error.response.status === 422) {
                    toast.error(error.response.data.data.message);
                    console.log(error.response.data.data.message);
                } else {
                    toast.error('Something went wrong');
                }
            });
    };

    return (
        <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" open={isModalOpen} onClose={closeModal} className="relative z-50">
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
                                <Dialog.Title as="div" className="bg-white shadow px-6 py-4 rounded-t-md sticky top-0">
                                    <div className="flex justify-between items-center">
                                        <h1>{edit ? 'Edit Project' : 'Create Project'}</h1>
                                        <button
                                            onClick={closeModal}
                                            className="text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-indigo-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="px-8 py-4">
                                    <div className="mb-3">
                                        <label htmlFor="title" className="block text-gray-600">
                                            Title<span className="required">*</span>
                                        </label>
                                        <input
                                            value={title}
                                            onChange={handleInputChange(setTitle, setTitleError, 3, 255)}
                                            type="text"
                                            id="title"
                                            className={`border ${titleError ? 'border-red-500' : 'border-gray-300'} rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400`}
                                            placeholder="Project title"
                                        />
                                        {titleError && <p className="text-red-500 text-sm">{titleError}</p>}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="date" className="block text-gray-600">
                                            Completion Date <span className="required">*</span>
                                        </label>
                                        <DatePicker
                                            value={date}
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
                                            dateFormat="dd/MM/yyyy"
                                            minDate={new Date()}
                                            className={`border ${dateError ? 'border-red-500' : 'border-gray-300'} p-2 rounded-md text-sm w-full py-2 px-2.5 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 date-picker`}
                                            placeholderText="Select a date"
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            wrapperClassName="w-full"
                                            style={{ width: '100%' }}
                                        />
                                        {dateError && <p className="text-red-500 text-sm">{dateError}</p>}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="time" className="block text-gray-600">
                                            Completion Time <span className="required">*</span>
                                        </label>
                                        <input
                                            value={time}
                                            onChange={handleInputChange(setTime, setTimeError, 0, Infinity)}
                                            type="time"
                                            className={`border ${timeError ? 'border-red-500' : 'border-gray-300'} rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400`}
                                        />
                                        {timeError && <p className="text-red-500 text-sm">{timeError}</p>}
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="description" className="block text-gray-600">
                                            Description<span className="required">*</span>
                                        </label>
                                        <textarea
                                            value={desc}
                                            onChange={handleInputChange(setDesc, setDescError, 3, 500)}
                                            id="description"
                                            className={`border ${descError ? 'border-red-500' : 'border-gray-300'} rounded-md w-full text-sm py-2 px-2.5 focus:border-indigo-500 focus:outline-offset-1 focus:outline-indigo-400`}
                                            rows="6"
                                            placeholder="Project description"
                                        ></textarea>
                                        {descError && <p className="text-red-500 text-sm">{descError}</p>}
                                    </div>
                                    <div className="flex justify-end items-center space-x-2">
                                        <button
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>
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
