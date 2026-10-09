import client from './client';

export const register =(data:{name:string,email:string,password:string,businessName?:string,businessDescription?:string,timezone?:string,emailOtp:string})=> client.post('/auth/register',data);

export const requestRegistrationOtp=(email:string)=>client.post('/auth/register/request-otp',{email});
export const verifyRegistrationOtp=(email:string,emailOtp:string)=>client.post('/auth/register/verify-otp',{email,emailOtp});
export const login=(data:{email:string,password:string})=>client.post('/auth/login',data);
export const getme=()=>client.get('/auth/me');
export const updateProfile=(data:{name?:string,businessName?:string,businessDescription?:string,timezone?:string,brandTheme?:string,brandAccent?:string,payoutDetails?:{accountHolderName?:string,accountNumber?:string,ifscCode?:string,bankName?:string,bankBranch?:string,bankAddress?:string,upiId?:string}})=>client.post('/auth/update-profile',data);
