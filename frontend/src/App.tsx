import { useState, type JSX } from 'react'
import {Navigate,BrowserRouter,Route,Routes, useLocation} from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './admin/adminLoginPage';
import DashboardPage from './pages/dashboard';
import PublicBookingPage from './pages/PublicBookingPage';
import ServicesPage from './pages/ServicesPage';
import AvailabilityPage from './pages/AvailabilityPage';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import PaymentsPage from './pages/PaymentsPage';


const ProtectedRoute=({children}:{children:JSX.Element})=>{
  const location=useLocation();
  const hasToken=!!localStorage.getItem("token");
  if(!hasToken){
    return <Navigate to="/login" replace state={{from:location}}/>
  }
  return children;

}

const AdminProctedRoute=({children}:{children:JSX.Element})=>{
  const hasAdminToken=!!localStorage.getItem("adminToken");
  if(!hasAdminToken){
    return <Navigate to="/admin/login" replace/>
  }
  return children

}
const PublicRoute=({children}:{children:JSX.Element})=>{
  const hasToken=!!localStorage.getItem("token");
  if(hasToken){
    return <Navigate to="/" replace/>
  }
  return children

}

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={
        <ProtectedRoute>
          <DashboardPage/>
        </ProtectedRoute>
        }/>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>}/>
      <Route path="/book/:slug" element={<PublicBookingPage/>}/>
      <Route path="/services" element={<ProtectedRoute><ServicesPage/></ProtectedRoute>}/>
      <Route path="/availability" element={<ProtectedRoute><AvailabilityPage/></ProtectedRoute>}/>
      <Route path="/bookings" element={<ProtectedRoute><BookingsPage/></ProtectedRoute>}/>
      <Route path="/profile" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
      <Route path="/payments" element={<ProtectedRoute><PaymentsPage/></ProtectedRoute>}/>
      <Route path="/admin/login" element={<AdminLoginPage/>}/>
      {/* TODO: /admin/dashboard route once AdminDashboard component is built out (currently a stub) */}
    </Routes>
    </BrowserRouter>
  )

}

export default App;
