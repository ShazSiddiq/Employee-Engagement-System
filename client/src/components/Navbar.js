import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import useLogout from '../hooks/useLogout';

const Navbar = () => {
  const { user } = useAuthContext(); // Use context to get user details
  const { logout } = useLogout();
  const navigate = useNavigate();

  // console.log("user:", user);

  const handleLogout = () => {
    logout(); // Clear local storage and update context
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className='bg-[#212250] text-slate-100 position-fixed w-full z-[1]'>
      <div className="navbar container mx-auto h-20 flex items-center justify-between header" style={{ padding: "0 10px" }}>
        <Link to="/" className="logo text-2xl font-medium text-sky-400">
          <img src='./image/mtye_logo.png' height="110px" width="110px" alt='logo' />
        </Link>
        <nav className="flex gap-5">
          {!user ? (
            <div className="flex gap-5">
              {/* Add links or buttons for non-logged-in users here */}
            </div>
          ) : (
            <div className="flex gap-5 mr-2">
              <div className="nav-item dropdown mr-5 logout-tab">
                <Link
                  className="nav-link dropdown-toggle text-light mr-5"
                  to="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {user.name} {/* Use user object from context */}
                </Link>
                <ul className="dropdown-menu" style={{ left: "unset" }}>
                  <li>
                    <Link className="dropdown-item text-dark" to="/change-password">
                      Change Password
                    </Link>
                  </li>
                  <hr className='mt-2'></hr>
                  {user.role === "User" && ( /* Conditionally render User Profile link */
                    <>
                      <li>
                        <Link className="dropdown-item text-dark" to="/profile">
                          User Profile
                        </Link>
                      </li>
                      <hr className='mt-2'></hr>
                    </>
                  )}
                  <li>
                    <button
                      onClick={handleLogout}
                      type="button"
                      className="bg-rose-500 text-white py-1 mt-2 ml-3 px-5 rounded-lg hover:bg-red-500 hover:text-black-900 duration-300 capitalize"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Navbar;








// // Navbar.js

// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuthContext } from '../hooks/useAuthContext';
// import useLogout from '../hooks/useLogout';

// const Navbar = () => {
//   const { user } = useAuthContext();
//   const { logout } = useLogout();
//   const navigate = useNavigate();
//   // console.log(user,"hahahahahahah");
//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <div className='bg-[#212250] text-slate-100'>
//       <div className=" navbar  container mx-auto h-20 flex items-center justify-between " style={{padding:"0 10px"}}>
//         <Link to="/" className="logo text-2xl font-medium text-sky-400">
//         <img src='./image/mtye_logo.png' height="110px" width="110px" alt='logo'/>
//         </Link>
//         <nav className="flex gap-5">
//           {!user ? (
//             <div className="flex gap-5">
//             </div>
//           ) : (
//             <div className="flex gap-5 mr-2">
//               <div className="nav-item dropdown mr-5">
//                 <Link
//                   className="nav-link dropdown-toggle text-light mr-5"
//                   to="#"
//                   role="button"
//                   data-bs-toggle="dropdown"
//                   aria-expanded="false"
//                 >
//                   {localStorage.getItem('name')}
//                 </Link>
//                 <ul className="dropdown-menu" style={{left:"-30px"}}>
//                   <li>
//                     <Link className="dropdown-item text-dark" to="/change-password">
//                       Change Password
//                     </Link>
//                   </li>
//                   <hr className='mt-2'></hr>
//                   <li>
//                     <button
//                       onClick={handleLogout}
//                       type="button"
//                       className="bg-rose-500 text-white py-1 mt-2 ml-3 px-5 rounded-lg hover:bg-red-500 hover:text-black-900 duration-300 capitalize"
//                     >
//                       Logout
//                     </button>
//                   </li>
//                 </ul>
//               </div>
//               {/* <button
//                 onClick={handleLogout}
//                 type="button"
//                 className="bg-rose-500 text-white py-2 px-5 rounded-lg hover:bg-sky-50 hover:text-slate-900 duration-300 capitalize"
//               >
//                 Logout
//               </button> */}
//             </div>
//           )}
//         </nav>
//       </div>
//     </div>
//   );
// };

// export default Navbar;
