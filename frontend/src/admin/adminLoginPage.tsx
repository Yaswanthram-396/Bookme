import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { adminLogin } from '../api/admin';
import logo from "../../assets/logo.png";



export default function AdminLoginPage(){
    const navigate=useNavigate();
    const [form,setForm]=useState({email:"",password:""});
    const [loading,setLoading]=useState(false);
    const [message,setMesssage]=useState("");
    const handleSubmit=async(e:React.FormEvent)=>{
        e.preventDefault();
        setLoading(true);
        setMesssage("");
        try{
            const{data}=await adminLogin(form);
            if(data.token){
                localStorage.setItem("adminToken",data.token);
                navigate("/admin/dashboard");
            }
        }catch(error){
            const response = (error as { response?: { data?: { message?: string } } }).response;
            setMesssage(response?.data?.message || "Something went wrong");
            
        }
        finally{
            setLoading(false);
        }
    }

return(
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-center">
                <img src={logo} alt="Logo" className="w-12 h-12" />
                <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1 text-sm">
                    <label htmlFor="email" className="block text-gray-600">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div className="space-y-1 text-sm">
                    <label htmlFor="password" className="block text-gray-600">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                {message && <p className="text-red-500">{message}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    </div>    
);
}