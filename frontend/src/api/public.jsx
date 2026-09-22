import client from "./client";

export const getPublicBusiness = (slug) => client.get(`/public/${slug}`);
export const getPublicSlots = (slug, params) =>
  client.get(`/public/${slug}/slots`, { params });
export const requestPublicBookingOtp = (slug, customerEmail) =>
  client.get(`/public/${slug}/request-otp`, { customerEmail });
export const verifyPublicBookingOtp = (slug, data) =>
  client.post(`/public/${slug}/verify-otp`, data);
export const createPublicBooking = (slug, data) =>
  client.post(`/public/${slug}/book`, data);
export const getPublicBookingStatus = (params) =>
  client.get(`/public/booking/status`, { params });
export const calcelPublicBookingPayments = (bookingId) =>
  client.get(`/public/booking/calcel-payment`, { booking_id: bookingId });
