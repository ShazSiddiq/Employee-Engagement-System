// Navbar.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import useLogout from '../hooks/useLogout';

const Navbar = () => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const navigate = useNavigate();
  // console.log(user,"hahahahahahah");
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='bg-slate-900 text-slate-100'>
      <div className=" navbar  container mx-auto h-20 flex items-center justify-between ">
        <Link to="/" className="logo text-2xl font-medium text-sky-400">
        <img src='./image/logo.png' alt='logo'/>
        
        </Link>

        <nav className="flex gap-5">
          {!user ? (
            <div className="flex gap-5">
            </div>
          ) : (
            <div className="flex gap-5 mr-2">
              <div className="nav-item dropdown mr-5">
                <Link
                  className="nav-link dropdown-toggle text-light mr-5"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {localStorage.getItem('name')}
                </Link>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item text-dark" to="/change-password">
                      Change Password
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      type="button"
                      className="bg-rose-500 text-white py-1 ml-2 px-5 rounded-lg hover:bg-red-500 hover:text-black-900 duration-300 capitalize"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
              {/* <button
                onClick={handleLogout}
                type="button"
                className="bg-rose-500 text-white py-2 px-5 rounded-lg hover:bg-sky-50 hover:text-slate-900 duration-300 capitalize"
              >
                Logout
              </button> */}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
