// PopupInfo.jsx
import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPopupInfo = () => {
  const showInfo = () => {
    toast.info(
      <div>
        
        <ul>
          <li><span style={{ color: 'yellow' }}>• Yellow</span> indicates a task is in progress.</li>
          <li><span style={{ color: 'red' }}>• Red</span> indicates a task is paused.</li>
          <li> • No Task will be render here if task is on <b>Done</b> or <b>Archive</b> stage </li>
          <br />
          <li><b>Click on a task to view its details.</b></li>
        </ul>
      </div>,
      {
        position: "top-center", // Direct string value for position
        autoClose: 5000,
        className: "custom-toast", // Add a custom class for additional styling if needed
        bodyClassName: "custom-toast-body" // Add a custom class to the toast body
      }
    );
  };

  return (
    <div className="d-flex ms-auto mr-2">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={showInfo}
      >
        <img src='./image/icon.png' width="20px" alt="icon" />
      </button>
    </div>
  );
};

export default AdminPopupInfo;
