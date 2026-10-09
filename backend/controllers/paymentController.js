import Payment from "../models/Payment.js";
import { calculateFeeSplit } from "../services/feeCalculator.js";

const VALID_PAYMENT_MODES = ["card", "upi", "netbanking"];

export const recordMockPayment = async ({ business, booking, paymentMode }) => {
  const { grossAmount, platformFee, providerAmount } = await calculateFeeSplit(
    Math.round(booking.amount),
  );

  booking.platformFee = platformFee;
  booking.providerAmount = providerAmount;
  await booking.save();

  await Payment.create({
    bookingId: booking._id,
    businessId: business._id,
    customerEmail: booking.customerEmail,
    amount: grossAmount,
    platformFee,
    providerAmount,
    currency: booking.currency,
    status: "paid",
    paymentMode: VALID_PAYMENT_MODES.includes(paymentMode) ? paymentMode : "card",
  });
};

export const refundMockPayment = async (booking) => {
  if (booking.paymentStatus !== "paid") return;

  const payment = await Payment.findOne({ bookingId: booking._id, status: "paid" });
  if (payment) {
    payment.status = "refunded";
    payment.refundAmount = payment.amount;
    await payment.save();
  }

  booking.paymentStatus = "refunded";
  await booking.save();
};

export const getProviderRevenue = async (req, res) => {
  try {
    const payments = await Payment.find({
      businessId: req.user.id,
      status: { $in: ["paid", "refunded", "partially_refunded"] },
    });

    const summary = payments.reduce(
      (acc, payment) => {
        acc.grossRevenue += payment.amount;
        acc.platformFees += payment.platformFee;
        acc.providerRevenue += payment.providerAmount;
        acc.refunds += payment.refundAmount || 0;
        return acc;
      },
      { grossRevenue: 0, platformFees: 0, providerRevenue: 0, refunds: 0 },
    );
    summary.netRevenue = summary.providerRevenue - summary.refunds;

    res.status(200).json({
      success: true,
      summary,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
