import { useState, type JSX } from 'react'
import {Navigate,BrowserRouter,Route,Routes} from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './admin/adminLoginPage';
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
    return <Navigate to="/dashboard" replace/>
  }
  return children

}

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>}/>
      <Route path="/admin/login" element={<AdminLoginPage/>}/>
      {/* <Route path="/admin/dashboard" element={<AdminProctedRoute><AdminDashboard/></AdminProctedRoute>}/> */}
    </Routes>
    </BrowserRouter>
  )
  
}

export default App;
