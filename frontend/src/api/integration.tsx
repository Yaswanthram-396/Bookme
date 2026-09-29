import client from "./client";

export const getGoogleConnectUrl = () => client.get('/integrations/google/connect');
export const getGoogleConnectionStatus = () => client.get('/integrations/google/status');
export const disconnectGoogleCalendar = () => client.delete('/integrations/google/disconnect');