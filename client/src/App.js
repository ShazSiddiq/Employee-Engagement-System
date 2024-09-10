import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Task from "./components/Task";
import { Toaster } from "react-hot-toast";
import Home from "./components/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuthContext } from "./hooks/useAuthContext";
import Navbar from "./components/Navbar";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import ChangePassword from "./components/ChangePassword";
import Dashboard from "./Admin/Dashboard";
import ProtectedRoute from "./context/ProtectedRoute"; // Import ProtectedRoute

import Footer from "./components/Footer";
import UserProfile from "./components/Profile";
import ForgetPassword from "./pages/ForgetPass";
import ResetPassword from "./pages/ResetPassword";
import UserTaskHistory from "./components/UserTaskHistory";
import TaskHistoryAdmin from "./Admin/TaskHistoryAdmin";
import AdminTaskDetails from "./Admin/TaskDetailsAdmin";

function App() {
  const { user } = useAuthContext();
  const location = useLocation();
  const noLayoutPaths = ["/login", "/signup", "/dashboard","/admin-task-history","/admin-task-details"];
  const isLayoutNeeded = !noLayoutPaths.includes(location.pathname);

  // Determine if AppLayout is needed based on user role
  const showAppLayout = user && user.role !== "Admin" && !noLayoutPaths.includes(location.pathname);

  return (
    <>
      <div className="app min-h-screen">
        <Navbar />
        <Toaster position="top-right" gutter={8} />
        {showAppLayout ? (
          <AppLayout>
            <Routes>
              <Route path="/:projectId" element={<Task />} />
              <Route path="/" element={<Home />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/task-history" element={<UserTaskHistory />} />

            </Routes>
          </AppLayout>
        ) : (
          <Routes>
            <Route path="/" element={user ? <Navigate to={user.role === "Admin" ? "/dashboard" : "/"} /> : <Login />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgetPassword/>}/>
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/task-history" element={<UserTaskHistory />} />
            <Route path="/admin-task-history" element={<TaskHistoryAdmin />} />
            <Route path="/admin-task-details" element={<AdminTaskDetails />} />
            <Route path="/change-password" element={user?.role === "Admin" ? <ChangePassword/> : <Navigate to="/change-password" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute role="Admin">
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        )}
      </div>
    </>
  );
}

export default App;
