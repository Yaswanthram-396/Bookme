import {useState,useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';

const AdminDashboard=()=>{
  const navigate=useNavigate();
    const [dashboard,setDashboard]=useState(null);
    const [message,setMessage]=useState(null);