// PopupInfo.jsx
import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PopupInfo = () => {
  const showInfo = () => {
    toast.info("Drag tasks between columns to change their status. Click 'Add Task' to create a new task.", {
      position: "top-right", // Direct string value for position
      autoClose: 5000,
    });
  };

  return (
    <div className="d-flex ms-auto">
      <button
        type="button"
        className=""
        onClick={showInfo}
      >
        <img src='./image/info_tab.svg' width="30px" alt="icon" />
      </button>
    </div>
  );
};

export default PopupInfo;
