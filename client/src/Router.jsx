import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuthContext } from "./hooks/useAuthContext";
import AppLayout from './components/AppLayout';
import { Toaster } from 'react-hot-toast';

export default function Router() {
  const { user } = useAuthContext();
  return (
    <>
      <Routes>
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" />}
        />
      <Route path="/:projectId" element={<Task />} />
      <AppLayout>
      <Toaster
        position="top-right"
        gutter={8}
        />
        <Route path="/dashboard" element={
          <div className="flex flex-col items-center w-full pt-10">
            <img src="./image/welcome.svg" className="w-5/12" alt="" />
            <h1 className="text-lg text-gray-600">Select or create new project</h1>
          </div>
        } />
    </AppLayout>
      </Routes>
    </>
  )
}
