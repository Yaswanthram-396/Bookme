import axios from "axios";

const adminClient = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || "http://localhost:3001/api",
});

adminClient.interceptors.request.use((res) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    res.headers.Authorization = `Bearer ${token}`;
  }
  return res;
});

adminClient.interceptors.response.use((res) => {
  const token = res.data?.token;
  if (token) {
    localStorage.setItem("adminToken", token);
  }
  return res;
});

export const adminLogin = (data: { email: string; password: string }) => adminClient.post("/admin/login", data);
export const getAdminDashboard = () => adminClient.get("/admin/dashboard");
export const getAdminSummary = () => adminClient.get("/admin/summary");
export default adminClient;
