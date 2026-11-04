import Stripe from "stripe";

let stripeClient;

export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error("Payments are not configured");
    error.statusCode = 503;
    throw error;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};
