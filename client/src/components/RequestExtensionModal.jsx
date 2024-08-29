import React, { useState } from 'react';
import Modal from 'react-modal';
import './style.css'; // Ensure your style.css contains necessary styles for modal
import BtnPrimary from './BtnPrimary';

const RequestExtensionModal = ({ isOpen, onCancel, onConfirm, taskId }) => {
    const [request, setRequest] = useState('');
    const [error, setError] = useState('');

    const handleRequestChange = (e) => {
        setRequest(e.target.value);
    };

    const handleConfirm = () => {
        // Validation
        if (request.trim() === '') {
            setError('Request cannot be blank.');
        } else if (request.length < 3) {
            setError('Request must be at least 3 characters long.');
        } else if (request.length > 500) {
            setError('Request cannot exceed 500 characters.');
        } else {
            setError('');
            onConfirm(request); // Call the confirm function with the valid request
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onCancel}
            contentLabel="Request Extension Modal"
            overlayClassName="overlay"
            className="modal1"
            appElement={document.getElementById('root')} // Ensure to set the correct root element ID here
        >
            <div className="modal-content">
                <h2>Request Extension for Task</h2>
                <textarea
                    value={request}
                    onChange={handleRequestChange}
                    placeholder="Enter your extension request"
                    className="remark-textarea"
                    rows="4"
                    cols="50"
                />
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                <div className="modal-actions">
                    <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <BtnPrimary
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                        onClick={handleConfirm}
                    >
                        Submit Request
                    </BtnPrimary>
                </div>
            </div>
        </Modal>
    );
};

export default RequestExtensionModal;
