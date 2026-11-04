import client from "./client";

export const getRevenue = () => client.get('/payments/revenue');

export const createCheckoutSession = (data: Record<string, unknown>) =>
  client.post<{ success: boolean; url: string }>('/payment/create-checkout-session', data);

export const getPaymentStatus = (sessionId: string) =>
  client.get('/payment/status', { params: { session_id: sessionId } });
