import client from "./client";

export const getRevenue = () => client.get('/payments/revenue');
