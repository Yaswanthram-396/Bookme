import axios, { type AxiosResponse } from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
});

client.interceptors.request.use((res) => {
  const token = localStorage.getItem("token");
  if (token) {
    res.headers.Authorization = `Bearer ${token}`;
  }
  return res;
});

const persistTokenFromResponse = (res: AxiosResponse) => {
  const token = res?.data?.token;
  if (token) {
    localStorage.setItem("token", token);
  }
  return res;
};

client.interceptors.response.use(persistTokenFromResponse, (error) => {
  if (error.response?.status === 401 && localStorage.getItem("token")) {
    localStorage.removeItem("token");
    window.location.assign("/login");
  }
  return Promise.reject(error);
});

export default client;
