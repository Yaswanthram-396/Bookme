import client from "./client";

export const listServices = () => client.get("/service");
export const createServices = (data) => client.post("/service", data);
export const updateServices = (id, data) =>
  client.patch(`/service/${id}`, data);
export const deleteServices = (id) => client.delete(`/service/${id}`);
