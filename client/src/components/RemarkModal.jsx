import React from 'react';
import Modal from 'react-modal';
import './style.css'; // Ensure your style.css contains necessary styles for modal
import BtnPrimary from './BtnPrimary';

const RemarkModal = ({ isOpen, closeModal, saveRemarkAndMoveTask, remark,taskId, setRemark }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            contentLabel="Remark Modal"
            overlayClassName="overlay"
            className="modal1"
            appElement={document.getElementById('root')} // Ensure to set the correct root element ID here
        >
            <div className="modal-content">
                <h2>Add Remark</h2>
                <textarea
                    value={remark}
                    className="remark-textarea"
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add your remark..."
                    rows="4"
                    cols="50"
                />
                <div className="modal-actions">
                    <button className='inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600' onClick={closeModal}>Cancel</button>
                    <BtnPrimary className='px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500' onClick={() => saveRemarkAndMoveTask(remark,taskId)}>Save Remark</BtnPrimary>
                </div>
            </div>
        </Modal>
    );
};

export default RemarkModal;
