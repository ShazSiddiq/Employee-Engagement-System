import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Dialog, Transition } from "@headlessui/react";
import BtnPrimary from "./BtnPrimary";
import toast from "react-hot-toast";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    designation: "",
    workingPlace: "",
    profileImage: null,
  });
  const [errors, setErrors] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    designation: "",
    workingPlace: "",
    profileImage: "",
  });

  useEffect(() => {
    const userId = localStorage.getItem("userid");

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/user/profile/${userId}`);
        setUser(response.data);
        setFormData({
          name: response.data.name,
          phoneNumber: response.data.phoneNumber,
          email: response.data.email,
          designation: response.data.designation || "",
          workingPlace: response.data.workingPlace || "",
          profileImage: null,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const MAX_NAME_LENGTH = 70;
  const MAX_DESIGNATION_LENGTH = 70;
  const MAX_WORKING_PLACE_LENGTH = 100;

  const validate = () => {
    const newErrors = {};
 // Name Validation
 const trimmedName = formData.name?.trim();
 if (!trimmedName) {
   newErrors.name = "Name is required.";
 } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
   newErrors.name = "Name should only contain letters and spaces.";
 } else if (trimmedName.length > MAX_NAME_LENGTH) {
   newErrors.name = `Name should not exceed ${MAX_NAME_LENGTH} characters.`;
 }

    // Phone Number Validation
    const trimmedPhoneNumber = formData.phoneNumber?.trim();
    if (!trimmedPhoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(trimmedPhoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits.";
    } else if (trimmedPhoneNumber.startsWith('0')) {
      newErrors.phoneNumber = "Phone number cannot start with 0.";
    }

    // Email Validation
    const trimmedEmail = formData.email?.trim();
    if (!trimmedEmail) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      newErrors.email = "Email address is invalid.";
    }

    // Designation Validation
    const trimmedDesignation = formData.designation?.trim();
    if (!trimmedDesignation) {
      newErrors.designation = "Designatiom is required.";
    } else if (!/^[A-Za-z\s]+$/.test(trimmedDesignation)) {
      newErrors.designation = "Designatiom should only contain letters and spaces.";
    } else if (trimmedDesignation.length > MAX_DESIGNATION_LENGTH) {
      newErrors.designation = `Name should not exceed ${MAX_DESIGNATION_LENGTH} characters.`;
    }

    // Working Place Validation
    const trimmedWorkingPlace = formData.workingPlace?.trim();
    if (!trimmedWorkingPlace) {
      newErrors.workingPlace = "Place of work is required.";
    } else if (trimmedWorkingPlace.length > MAX_WORKING_PLACE_LENGTH) {
      newErrors.workingPlace = `Place of work should not exceed ${MAX_WORKING_PLACE_LENGTH} characters.`;
    }

    // Profile Image Validation
    if (formData.profileImage && !['image/jpeg', 'image/png'].includes(formData.profileImage.type)) {
      newErrors.profileImage = "Profile image must be JPEG or PNG.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
        // Allow only letters and spaces
        if (/^[A-Za-z\s]*$/.test(value)) {
            setFormData({
                ...formData,
                [name]: value,
            });
            // Validate after updating the state
            validate();
        } else {
            // Set error if input is invalid
            setErrors(prevErrors => ({
                ...prevErrors,
                name: 'Name should only contain letters and spaces.'
            }));
        }
    }else if( name=== 'designation'){
      if (/^[A-Za-z\s]*$/.test(value)) {
        setFormData({
            ...formData,
            [name]: value,
        });
        // Validate after updating the state
        validate();
    } else {
        // Set error if input is invalid
        setErrors(prevErrors => ({
            ...prevErrors,
            designation: 'Designation should only contain letters and spaces.'
        }));
    }
    }
     else if (name === 'phoneNumber') {
        // Allow only digits
        if (/^\d*$/.test(value)) {
            // Update the form data
            setFormData({
                ...formData,
                [name]: value,
            });

            // Validation for the phone number
            if (value.length > 10) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    phoneNumber: 'Phone number cannot exceed 10 digits.'
                }));
            } else if (value.startsWith('0')) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    phoneNumber: 'Phone number cannot start with 0.'
                }));
            } else if (value.length === 10) {
                // Clear the error when exactly 10 digits are entered and starts with a non-zero digit
                setErrors(prevErrors => {
                    const { phoneNumber, ...restErrors } = prevErrors;
                    return restErrors;
                });
            } else {
                // Clear the phone number error if conditions are met during typing
                setErrors(prevErrors => {
                    const { phoneNumber, ...restErrors } = prevErrors;
                    return restErrors;
                });
            }
        } else {
            // Set error if input contains non-digit characters
            setErrors(prevErrors => ({
                ...prevErrors,
                phoneNumber: 'Phone number should only contain digits.'
            }));
        }
    } else {
        setFormData({
            ...formData,
            [name]: value,
        });
        validate(); // Validate for other fields if necessary
    }
};

  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
      setFormData({
        ...formData,
        profileImage: file,
      });
      setErrors({
        ...errors,
        profileImage: "",
      });
    } else {
      setErrors({
        ...errors,
        profileImage: "Profile image must be JPEG or PNG.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const userId = localStorage.getItem("userid");
    const updateUrl = `${process.env.REACT_APP_BASE_URL}/api/user/${userId}`;

    const updatedData = new FormData();
    updatedData.append("name", formData.name);
    updatedData.append("phoneNumber", formData.phoneNumber);
    updatedData.append("email", formData.email);
    updatedData.append("designation", formData.designation);
    updatedData.append("workingPlace", formData.workingPlace);
    if (formData.profileImage) {
      updatedData.append("profileImage", formData.profileImage);
    }

    try {
      await axios.put(updateUrl, updatedData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("User data updated successfully");
      setIsModalOpen(false);

      // Fetch updated user data
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/user/profile/${userId}`);
      setUser(response.data);
    } catch (error) {
      toast.error("Error updating user data");
      console.error("Error updating user data:", error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '3rem 0', width: "100%" }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '5px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', margin: '0' }}>
              <div style={{ backgroundColor: '#212250', flex: '0 0 30%', textAlign: 'center', color: '#fff', padding: '1rem' }}>
                <div style={{ marginBottom: '45px' }}>
                  <img
                    src={`${process.env.REACT_APP_BASE_URL}/profile-images/${user.profileImage}`}
                    alt="User-Profile-Image"
                    style={{ borderRadius: '5px', width: '100%', height: "300px" }}
                  />
                </div>
                <h6 style={{ fontWeight: '600', margin: '0 0 10px' }}>{user.name}</h6>
                <p style={{ margin: 0 }}>{user.designation}</p>
              </div>
              <div style={{ flex: '0 0 70%', padding: '1rem' }}>
                <div className="d-flex justify-between">
                  <h3 style={{ marginBottom: '20px', paddingBottom: '5px', borderBottom: '1px solid #e0e0e0', fontWeight: '800' }}>Information</h3>
                  <span onClick={() => setIsModalOpen(true)}>
                    <PencilSquareIcon
                      className="h-6 w-6 text-gray-600 cursor-pointer"
                    />
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                  <div style={{ flex: '1', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '600' }}>Email Id</p>
                    <h6 style={{ color: '#919aa3', fontWeight: '400' }}>{user.email}</h6>
                  </div>
                  <div style={{ flex: '1', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '600' }}>Mobile Number</p>
                    <h6 style={{ color: '#919aa3', fontWeight: '400' }}>{user.phoneNumber || 'N/A'}</h6>
                  </div>
                </div>
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                  <div style={{ flex: '1', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '600' }}>Designation</p>
                    <h6 style={{ color: '#919aa3', fontWeight: '400' }}>{user.designation || 'N/A'}</h6>
                  </div>
                  <div style={{ flex: '1', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '600' }}>Place of Work</p>
                    <h6 style={{ color: '#919aa3', fontWeight: '400' }}>{user.workingPlace || 'N/A'}</h6>
                  </div>
                </div>
                <h6 style={{ marginBottom: '20px', marginTop: '40px', paddingBottom: '5px', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>Projects</h6>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: '1', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '600' }}>Assigned Projects</p>
                    <h6 style={{ color: '#919aa3', fontWeight: '400' }}>{user.projects.length || 'No recent project'}</h6>
                  </div>
                  {/* <div style={{ flex: '1', marginBottom: '10px' }}>
                    <p style={{ marginBottom: '10px', fontWeight: '600' }}>Total Projects</p>
                    <h6 style={{ color: '#919aa3', fontWeight: '400' }}>{user.mostViewedProject || ''}</h6>
                  </div> */}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '40px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <li>
                    <a href="#!" title="facebook" style={{ borderRadius: '50%', fontSize: '20px', color: '#3b5997', width: '50px', height: '50px', lineHeight: '50px', display: 'block', textAlign: 'center', backgroundColor: 'rgba(69,90,100,0.1)' }}>
                      <i className="mdi mdi-facebook feather icon-facebook" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#!" title="twitter" style={{ borderRadius: '50%', fontSize: '20px', color: '#1da1f2', width: '50px', height: '50px', lineHeight: '50px', display: 'block', textAlign: 'center', backgroundColor: 'rgba(69,90,100,0.1)' }}>
                      <i className="mdi mdi-twitter feather icon-twitter" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#!" title="instagram" style={{ borderRadius: '50%', fontSize: '20px', color: '#e1306c', width: '50px', height: '50px', lineHeight: '50px', display: 'block', textAlign: 'center', backgroundColor: 'rgba(69,90,100,0.1)' }}>
                      <i className="mdi mdi-instagram feather icon-instagram" aria-hidden="true"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for editing user profile */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
{/* <Dialog.Panel className="rounded-md bg-white w-full max-w-lg">
<Dialog.Title as="div" className="bg-white shadow px-6 py-4 rounded-t-md sticky top-0"> */}


                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white  text-left">
                <Dialog.Title as='div' className="bg-white shadow px-6 py-3 rounded-t-md sticky top-0">
                    <h1>Edit Profile</h1>
                    <button onClick={() => setIsModalOpen(false)} className='absolute right-6 top-4 text-gray-500 hover:bg-gray-100 rounded focus:outline-none focus:ring focus:ring-offset-1 focus:ring-indigo-200'>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Dialog.Title>
                  <div className=" p-4">
                    <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label htmlFor="name" className="block text-gray-600">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="block w-full mt-1 p-2 border border-gray-300 rounded"
                        />
                        {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                      </div>
                      <div className="mb-2">
                        <label htmlFor="name" className="block text-gray-600">
                          Mobile Number
                          <span className="required">*</span></label>
                        {/* </label> */}
                        <input
                          type="text"
                          id="phoneNumber"
                          name="phoneNumber"
                          maxLength={10}
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200"
                        />
                        {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                      </div>
                      <div className="mb-2">
                        <label htmlFor="email" className="block text-gray-600">
                          Email Id
                          <span className="required">*</span></label>
                        {/* </label> */}
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div className="mb-2">
                        <label htmlFor="designation" className="block text-gray-600">
                          Designation
                          <span className="required">*</span></label>
                        {/* </label> */}
                        <input
                          type="text"
                          id="designation"
                          name="designation"
                          value={formData.designation || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200"
                        />
                        {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
                      </div>
                      <div className="mb-2">
                        <label htmlFor="designation" className="block text-gray-600">
                          Place of Work
                          <span className="required">*</span></label>
                        {/* </label> */}
                        <input
                          type="text"
                          id="workingPlace"
                          name="workingPlace"
                          value={formData.workingPlace || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200"
                        />
                        {errors.workingPlace && <p className="text-red-500 text-sm mt-1">{errors.workingPlace}</p>}
                      </div>

                      <div className="mb-2">
                        <label htmlFor="profileImage" className="block text-gray-600">
                          Profile Image
                        </label>
                        <input
                          type="file"
                          id="profileImage"
                          name="profileImage"
                          onChange={handleFileChange}
                          className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-200"
                        />
                         <p className="mt-1 text-sm text-gray-400 dark:text-gray-300" id="file_input_help">Only PNG, JPG are Allowed.</p>
                        {errors.profileImage && <p className="text-red-500 text-sm mt-1">{errors.profileImage}</p>}
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-slate-100 bg-red-500 border border-transparent rounded-md hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600">
                          Cancel
                        </button>
                        <BtnPrimary type="submit">Save Changes</BtnPrimary>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default UserProfile;
