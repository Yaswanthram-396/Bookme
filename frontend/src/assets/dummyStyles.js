import "./dashboard.css";

export const dashboardPageStyles = new Proxy(
  {},
  {
    get: (_, property) => String(property),
  },
);
