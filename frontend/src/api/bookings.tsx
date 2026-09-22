import client from "./client";

export const listBookings = (params={}) => client.get('/bookings',{params});
 export const updateBookingStatus = (id:string,status:string) => client.patch(`/bookings/${id}`,{status});
 export const rescheduleBooking = (id:string,data) => client.patch(`/bookings/${id}/reschedule`,data);
