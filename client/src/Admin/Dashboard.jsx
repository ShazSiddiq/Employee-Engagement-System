import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemPrefix, ListItemSuffix, Chip } from "@material-tailwind/react";
import { HomeIcon, ClockIcon, FolderIcon, UsersIcon } from "@heroicons/react/24/solid";
import AdminHome from './AdminHome';
import TimeExtension from './TimeExtension';
import ProjectList from "./ProjectList";
import UserList from "./UserList";
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ showAdminHome = true }) {
  const [activeTab, setActiveTab] = useState(null);
  const [extensionRequestCount, setExtensionRequestCount] = useState(0);
  const POLLING_INTERVAL = 5000; // Poll every 5 seconds
  const navigate = useNavigate();

  const fetchExtensionRequestCount = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/userdata`);
      const filteredUsers = response.data.map(user => ({
        ...user,
        tasks: user.tasks.filter(task => task.extensionRequest && task.extensionRequest.trim() !== "")
      })).filter(user => user.tasks.length > 0);
      const count = filteredUsers.reduce((count, user) => count + user.tasks.length, 0);
      setExtensionRequestCount(count);
    } catch (error) {
      console.error('Failed to fetch extension request count:', error);
    }
  };

  useEffect(() => {
    fetchExtensionRequestCount(); // Fetch on mount
    const intervalId = setInterval(fetchExtensionRequestCount, POLLING_INTERVAL);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const path = window.location.pathname.split('/dashboard').pop();
    const storedTab = localStorage.getItem('activeTab');

    if (path === "" || path === "/") {
      if (storedTab) {
        setActiveTab(storedTab);
        navigate(`/dashboard`);
      } else {
        setActiveTab("admin-home");
        navigate('/dashboard');
      }
    } else {
      setActiveTab(path || "admin-home");
    }
  }, [navigate]);

  const renderActiveTab = () => {
    if (!activeTab) return null; // Render nothing until activeTab is set

    switch (activeTab) {
      case "admin-home":
        return <AdminHome />;
      case "time-extension":
        return <TimeExtension setExtensionRequestCount={setExtensionRequestCount} />;
      case "projects":
        return <ProjectList />;
      case "userlist":
        return <UserList />;
      default:
        return null;
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
    navigate('/dashboard');
  };

  return (
    <div className="flex" style={{ paddingTop: "75px" }}>
      <aside className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 h-[calc(100vh-0rem)] max-w-72 max-w-[20rem] p-1 shadow-xl shadow-blue-gray-900/5">
        <List>
          {showAdminHome && (
            <ListItem
              key="admin-home"
              onClick={() => handleTabClick("admin-home")}
              className={`cursor-pointer p-2 rounded-md ${activeTab === "admin-home" ? "bg-slate-900 text-white" : "hover:bg-gray-100"}`}
              style={{ fontSize: "14px" }}
            >
              <ListItemPrefix>
                <HomeIcon className="h-5 w-5 mr-1" />
              </ListItemPrefix>
              Emp Engagement
            </ListItem>
          )}
          <hr />
          <ListItem
            key="time-extension"
            onClick={() => handleTabClick("time-extension")}
            className={`cursor-pointer p-2 rounded-md ${activeTab === "time-extension" ? "bg-slate-900 text-white" : "hover:bg-gray-100"}`}
            style={{ fontSize: "14px" }}
          >
            <ListItemPrefix>
              <ClockIcon className="h-5 w-5 mr-1" />
            </ListItemPrefix>
            Time Extension
            <ListItemSuffix>
              <Chip
                value={extensionRequestCount}
                size="sm"
                style={{ borderRadius: "50%", width: "22px", height: "22px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                variant="filled"
                color="red"
                className="bg-red-600 text-white font-bold shadow-md ml-2"
              />
            </ListItemSuffix>
          </ListItem>
          <hr />
          <ListItem
            key="projects"
            onClick={() => handleTabClick("projects")}
            className={`cursor-pointer p-2 rounded-md ${activeTab === "projects" ? "bg-slate-900 text-white" : "hover:bg-gray-100"}`}
            style={{ fontSize: "14px" }}
          >
            <ListItemPrefix>
              <FolderIcon className="h-5 w-5 mr-1" />
            </ListItemPrefix>
            Projects
          </ListItem>
          <hr />
          <ListItem
            key="userlist"
            onClick={() => handleTabClick("userlist")}
            className={`cursor-pointer text-[14px] p-2 rounded-md ${activeTab === "userlist" ? "bg-slate-900 text-white" : "hover:bg-gray-100"}`}
          >
            <ListItemPrefix>
              <UsersIcon className="h-5 w-5 mr-1" />
            </ListItemPrefix>
            Employee List
          </ListItem>
        </List>
      </aside>
      <main className="flex-1 overflow-y-auto" style={{ paddingTop: "1.5rem" }}>
        {renderActiveTab()}
      </main>
    </div>
  );
}
