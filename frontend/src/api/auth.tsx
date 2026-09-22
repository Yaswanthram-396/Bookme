import client from './client';

export const register =(data:{email:string,password:string})=> client.post('/auth/register',data);

export const requestRegistrationOtp=(email:string)=>client.post('/auth/register/request-otp',{email});
export const verifyRegistrationOtp=(email:string,otp:string)=>client.post('/auth/register/verify-otp',{email,otp});
export const login=(data:{email:string,password:string})=>client.post('/auth/login',data);
export const getme=()=>client.get('/auth/me');
export const updateProfile=(data:{name?:string,email?:string,password?:string})=>client.put('/auth/profile',data);
