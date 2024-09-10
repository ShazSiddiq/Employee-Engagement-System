import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TaskHistoryAdmin() {
    const location = useLocation();
    const { userId } = location.state || {}; // Get userId from the location state
    const [userData, setUserData] = useState(null);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (userId) {
            // Fetch project data for the user
            axios.get(`${process.env.REACT_APP_BASE_URL}/projects-history/${userId}`)
                .then(response => {
                    if (response.data.length === 0) {
                        setUserData({ projects: [] });  // Ensure userData has an empty projects array if no projects
                    } else {
                        setUserData({ projects: response.data });
                    }
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                    setLoading(false);
                });

            // Fetch user details by userId to get the user's name
            axios.get(`${process.env.REACT_APP_BASE_URL}/api/user/profile/${userId}`)
                .then(response => {
                    setUserName(response.data.name);  // Assuming response contains the user's name
                })
                .catch(error => {
                    console.error('Error fetching user name:', error);
                });
        }
    }, [userId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!userData || userData.projects.length === 0) {
        return <div className='text-center fw-semibold' style={{ padding: '100px' }}>No data available for this user.</div>;
    }

    const UserProjectDetails = (projectId) => {
        navigate('/admin-task-details', { state: { projectId, userId } }); // Pass both projectId and userId
    };

    const isHomePage = location.pathname === '/dashboard';
    return (
        <div style={{ padding: '85px' }}>
            <div className='flex items-center mt-2'>
                {!isHomePage && (
                    <button
                        onClick={() => navigate(-1)}
                        className='bg-indigo-200 rounded-full p-[3px] mr-2 focus:outline-none focus:ring focus:ring-indigo-200 focus:ring-offset-1'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
                            <path fillRule="evenodd" d="M15.293 6.293a1 1 0 010 1.414L10.414 12l4.879 4.879a1 1 0 01-1.414 1.414l-6.293-6.293a1 1 0 010-1.414l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}

                <h2 >Project History for <span><b>{userName ? userName : 'User'}</b></span> <span>({userData.projects.length})</span></h2>

            </div>
            <table className='table table-striped table-hover mt-4'>
                <thead className='table-dark'>
                    <tr>
                        <th style={{ fontWeight: "200" }}>Project Name</th>
                        <th style={{ fontWeight: "200" }}>Number of Tasks</th>
                        <th style={{ fontWeight: "200" }}>View Tasks</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: "14px", fontWeight: "400" }}>
                    {userData.projects.map((project, index) => (
                        <tr key={index}>
                            <td>{project.title}</td>
                            <td >{project.task.length}</td>
                            <td>
                                <button
                                    onClick={() => UserProjectDetails(project._id)}
                                    className='btn btn-warning'
                                >
                                    Task Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
