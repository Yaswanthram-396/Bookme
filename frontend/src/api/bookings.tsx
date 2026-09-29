import client from "./client";

export const listBookings = (params={}) => client.get('/bookings',{params});
export const getBooking = (id:string) => client.get(`/bookings/${id}`);
export const cancelBooking = (id:string) => client.patch(`/bookings/${id}/cancel`);
export const rescheduleBooking = (id:string,data:{date:string,startTime:string,endTime:string}) => client.patch(`/bookings/${id}/reschedule`,data);
