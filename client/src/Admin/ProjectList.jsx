import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddProjectModal from './AddProjectModal';
import BtnPrimary from '../components/BtnPrimary';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import ProjectModal from '../Admin/ProjectModel';
import ConfirmationModal from '../components/ConfirmationModal';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [isProjectOpen, setProjectOpen] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null); // State for project to be deleted
    const [showDeleted, setShowDeleted] = useState(false); // Toggle to show/hide deleted projects

    const fetchProjects = () => {
        axios
            .get(`${process.env.REACT_APP_BASE_URL}/projects`)
            .then((res) => {
                const filteredProjects = res.data.filter(project => !project.deleteStatus || project.deleteStatus !== 1 || showDeleted);
                setProjects(filteredProjects);
            })
            .catch(() => {
                toast.error('Failed to fetch projects');
            });
    };

    useEffect(() => {
        fetchProjects();
        const handleProjectUpdate = () => {
            fetchProjects();
        };
        document.addEventListener('projectUpdate', handleProjectUpdate);

        return () => {
            document.removeEventListener('projectUpdate', handleProjectUpdate);
        };
    }, [showDeleted]);

    const openModal = (edit = false, projectId = null) => {
        setEditMode(edit);
        setCurrentProjectId(projectId);
        setIsModalOpen(true);
    };

    const handleProjectDetails = (projectId = null) => {
        setCurrentProjectId(projectId);
        setProjectOpen(true);
    };

    const confirmDeleteProject = (projectId) => {
        setProjectToDelete(projectId);
        setShowConfirmationModal(true);
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/project/${projectToDelete}`);
            toast.success('Project marked as deleted successfully');
            const customEvent = new CustomEvent('projectUpdate');
            document.dispatchEvent(customEvent);
        } catch (e) {
            toast.error('Failed to delete project');
        } finally {
            setShowConfirmationModal(false);
            setProjectToDelete(null);
        }
    };

    return (
        <div className="container">
            <div className='d-flex justify-content-between'>
                <span className='mt-1 fs-5' style={{fontWeight:"500"}}>Project List <span>({projects.length})</span></span>
                <BtnPrimary onClick={() => openModal(false)}>
                    Add Project
                </BtnPrimary>
            </div>
            <hr className='mt-2'/>
            {/* <button onClick={() => setShowDeleted(!showDeleted)}>
                {showDeleted ? 'Hide Deleted Projects' : 'Show Deleted Projects'}
            </button> */}
            <table className="table table-striped mt-3 table-hover" style={{ borderRadius: "8px", overflow: "hidden" }}>
                <thead className='table-dark'>
                    <tr>
                        <th scope="col" style={{ fontWeight: "200" }}>Project</th>
                        <th className='text-center' scope="col" style={{ fontWeight: "200" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key={project._id}>
                            <td style={{ fontSize: "14px", fontWeight: "400" }}>
                                {/* {project.title} */}
                                {project.title.slice(0, 75)}
                                {project.title.length > 75 && '...'}
                            </td>
                            <td style={{ textAlign: "center" }}>
                                <div className="btn-group gap-2">
                                    <button className='btn btn-info text-white py-1 px-2 rounded hover:bg-#0ea5e9-600'>
                                    <EyeIcon
                                        onClick={() => handleProjectDetails(project._id)}
                                        className="h-3 w-4 cursor-pointer"
                                        style={{ borderRadius: "5px", height: "20px" }}
                                    />
                                    </button>
                                    <button onClick={() => openModal(true, project._id)} className="btn bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600">
                                        <PencilIcon
                                            className="h-3 w-4 cursor-pointer"
                                        />
                                    </button>
                                    <button
                                        onClick={() => confirmDeleteProject(project._id)} // Open confirmation modal
                                        className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                                    >
                                        <TrashIcon
                                            className="h-3 w-4 cursor-pointer"
                                        />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <AddProjectModal
                    isModalOpen={isModalOpen}
                    closeModal={() => setIsModalOpen(false)}
                    edit={editMode}
                    id={currentProjectId}
                />
            )}
            <ProjectModal isOpen={isProjectOpen} setIsOpen={setProjectOpen} id={currentProjectId} />
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmationModal}
                onCancel={() => setShowConfirmationModal(false)}
                onConfirm={handleDeleteProject} // Handle delete project on confirm
                message="Are you sure you want to delete this project?"
            />
        </div>
    );
};

export default ProjectList;
