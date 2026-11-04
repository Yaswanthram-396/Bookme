import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Service from "../models/service.js";
import User from "../models/User.js";
import { getStripe } from "../config/stripe.js";
import { calculateFeeSplit } from "../services/feeCalculator.js";
import { buildCustomerCalenderUrl } from "../utils/calenderlink.js";
import { createBookingCalendarEvent } from "../utils/googleCalender.js";
import { sendBookingNotification } from "../utils/bookingNotification.js";
import { verifyEmailOtp } from "../utils/emailOtp.js";
import { generateSlots } from "../utils/slotGenerator.js";
import { timeOverlap } from "../utils/overlap.js";

// Stripe requires Checkout Sessions to expire between 30 minutes and 24 hours.
const SESSION_TTL_SECONDS = 30 * 60;
const MIN_CHARGE = 50; // smallest amount (minor units) Stripe accepts for INR

const clientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

/**
 * POST /api/payment/create-checkout-session
 * The customer is authenticated by the booking email OTP. Price, slot and
 * service are re-derived from the database; only identifiers come from the
 * client.
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const {
      slug,
      serviceId,
      customerName,
      customerEmail,
      customerAvatar,
      date,
      startTime,
      endTime,
      notes,
      emailOtp,
    } = req.body || {};

    const required = [
      slug,
      serviceId,
      customerName,
      customerEmail,
      date,
      startTime,
      endTime,
      emailOtp,
    ];
    if (!required.every((v) => typeof v === "string" && v.trim())) {
      return fail(res, 400, "All booking fields are required");
    }

    const email = customerEmail.toLowerCase().trim();

    const business = await User.findOne({ slug }).select("-password");
    if (!business) return fail(res, 404, "Business not found");

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    });
    if (!service) return fail(res, 404, "Service not found");

    const amount = Math.round(service.price * 100);
    if (!(service.price > 0) || amount < MIN_CHARGE) {
      return fail(res, 400, "This service does not require online payment");
    }

    const slots = await generateSlots(business._id, service, date);
    if (!slots.some((s) => s.startTime === startTime && s.endTime === endTime)) {
      return fail(res, 409, "That slot is no longer available");
    }

    const activeBookings = await Booking.find({
      userId: business._id,
      date,
      active: true,
    });

    // Retry by the same customer for the same slot: reuse the open session
    // instead of creating a duplicate booking/payment.
    const own = activeBookings.find(
      (b) =>
        b.status === "pending" &&
        b.paymentStatus === "pending" &&
        b.customerEmail === email &&
        b.startTime === startTime &&
        b.endTime === endTime &&
        String(b.serviceId) === String(service._id),
    );
    if (own) {
      const existing = await Payment.findOne({
        bookingId: own._id,
        status: "pending",
      });
      if (existing?.stripeSessionId) {
        const session = await getStripe().checkout.sessions.retrieve(
          existing.stripeSessionId,
        );
        if (session.status === "open" && session.url) {
          return res.json({ success: true, url: session.url });
        }
      }
    }

    if (
      activeBookings.some(
        (b) =>
          b !== own && timeOverlap(startTime, endTime, b.startTime, b.endTime),
      )
    ) {
      return fail(res, 409, "That slot is no longer available");
    }

    const otpResult = await verifyEmailOtp({
      email,
      purpose: "booking",
      code: emailOtp,
      consume: true,
    });
    if (!otpResult.verified) {
      return fail(res, 400, otpResult.reason || "Email verification is required");
    }

    const currency = "inr";
    const { platformFee, providerAmount } = await calculateFeeSplit(amount);

    let booking;
    try {
      booking = await Booking.create({
        userId: business._id,
        serviceId: service._id,
        customerName: customerName.trim(),
        customerEmail: email,
        customerAvatar: customerAvatar || "A1.png",
        date,
        startTime,
        endTime,
        notes: typeof notes === "string" ? notes : "",
        amount,
        currency,
        platformFee,
        providerAmount,
        payoutStatus: "not_required",
        status: "pending",
        paymentStatus: "pending",
        active: true, // holds the slot until paid or the session expires
        customerCalendarUrl: buildCustomerCalenderUrl({
          business,
          service,
          booking: {
            date,
            startTime,
            endTime,
            customerName,
            customerEmail: email,
            notes,
          },
        }),
      });
    } catch (createError) {
      if (createError.code === 11000) {
        return fail(res, 409, "That slot is no longer available");
      }
      throw createError;
    }

    const payment = await Payment.create({
      bookingId: booking._id,
      businessId: business._id,
      customerEmail: email,
      amount,
      platformFee,
      providerAmount,
      currency,
      status: "pending",
    });

    const ids = {
      bookingId: String(booking._id),
      paymentId: String(payment._id),
    };

    let session;
    try {
      session = await getStripe().checkout.sessions.create(
        {
          mode: "payment",
          customer_email: email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount: amount,
                product_data: {
                  name: service.name,
                  description: `${date} ${startTime}-${endTime} with ${
                    business.businessName || business.name
                  }`,
                },
              },
            },
          ],
          client_reference_id: ids.bookingId,
          metadata: ids,
          payment_intent_data: { metadata: ids },
          expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
          success_url: `${clientUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${clientUrl()}/payment/cancel?slug=${encodeURIComponent(slug)}`,
        },
        { idempotencyKey: `checkout-${payment._id}` },
      );
    } catch (stripeError) {
      // Release the held slot if Stripe rejected the request.
      booking.active = false;
      booking.status = "cancelled";
      booking.paymentStatus = "failed";
      await booking.save();
      payment.status = "failed";
      payment.failureReason = "checkout_session_creation_failed";
      await payment.save();
      console.error(
        "Stripe session creation failed:",
        stripeError.type,
        stripeError.code,
      );
      return fail(res, 502, "Could not start payment. Please try again.");
    }

    payment.stripeSessionId = session.id;
    await payment.save();

    return res.status(201).json({ success: true, url: session.url });
  } catch (error) {
    console.error("createCheckoutSession error:", error.message);
    return fail(
      res,
      error.statusCode || 500,
      error.statusCode ? error.message : "Server error",
    );
  }
};

/**
 * GET /api/payment/status?session_id=cs_...
 * Reports what the webhook has recorded. The unguessable Checkout Session id
 * is the credential; the query string alone never proves payment.
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return fail(res, 400, "A valid session_id is required");
    }
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    if (!payment) return fail(res, 404, "Payment not found");

    const booking = await Booking.findById(payment.bookingId).populate(
      "serviceId",
      "name",
    );
    return res.json({
      success: true,
      payment: {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
      },
      booking: booking && {
        id: booking._id,
        status: booking.status,
        service: booking.serviceId?.name,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        customerEmail: booking.customerEmail,
        customerCalendarUrl: booking.customerCalendarUrl,
      },
    });
  } catch (error) {
    return fail(res, 500, "Server error");
  }
};

const finalizePaidBooking = async (payment) => {
  const booking = await Booking.findById(payment.bookingId);
  if (!booking) return;
  const [business, service] = await Promise.all([
    User.findById(booking.userId).select("-password"),
    Service.findById(booking.serviceId),
  ]);
  try {
    const result = await createBookingCalendarEvent({ business, service, booking });
    booking.googleEventId = result.googleEventId || "";
    booking.customerCalendarUrl =
      result.customerCalendarUrl || booking.customerCalendarUrl;
    await booking.save();
  } catch (calendarError) {
    console.error("Calendar event failed:", calendarError.message);
  }
  sendBookingNotification({ business, service, booking, type: "confirmed" }).catch(
    (emailError) =>
      console.error("Booking confirmation email failed:", emailError.message),
  );
};

// Every transition is a conditional atomic update, so a re-delivered event
// matches nothing and has no effect (idempotent), and side effects run once.
const handleCheckoutCompleted = async (session, eventId) => {
  if (session.payment_status !== "paid") return; // async methods: wait for the success event
  const payment = await Payment.findOneAndUpdate(
    {
      stripeSessionId: session.id,
      status: { $in: ["pending", "failed", "expired"] },
    },
    {
      $set: {
        status: "paid",
        paidAt: new Date(),
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined,
        lastStripeEventId: eventId,
        paymentMode: "card",
      },
      $unset: { failureReason: "" },
    },
    { new: true },
  );
  if (!payment) return;

  if (
    payment.amount !== session.amount_total ||
    payment.currency !== session.currency
  ) {
    console.error(`Amount mismatch for payment ${payment._id}`);
  }

  try {
    await Booking.updateOne(
      { _id: payment.bookingId },
      { $set: { paymentStatus: "paid", status: "confirmed", active: true } },
    );
  } catch (error) {
    // Slot was released on expiry and re-booked by someone else: needs a refund.
    console.error(
      `Paid booking ${payment.bookingId} conflicts with another booking:`,
      error.message,
    );
    return;
  }
  await finalizePaidBooking(payment);
};

const handleCheckoutExpired = async (session, eventId) => {
  const payment = await Payment.findOneAndUpdate(
    { stripeSessionId: session.id, status: { $in: ["pending", "failed"] } },
    { $set: { status: "expired", lastStripeEventId: eventId } },
    { new: true },
  );
  if (!payment) return;
  await Booking.updateOne(
    { _id: payment.bookingId, paymentStatus: { $in: ["pending", "failed"] } },
    { $set: { active: false, status: "cancelled", paymentStatus: "failed" } },
  );
};

const handlePaymentFailed = async (intent, eventId) => {
  // The customer may retry inside the same Checkout Session, so record the
  // failure but keep the slot held; session expiry releases it.
  const payment = await Payment.findOneAndUpdate(
    {
      status: "pending",
      $or: [
        { stripePaymentIntentId: intent.id },
        ...(intent.metadata?.paymentId
          ? [{ _id: intent.metadata.paymentId }]
          : []),
      ],
    },
    {
      $set: {
        status: "failed",
        stripePaymentIntentId: intent.id,
        failureReason: intent.last_payment_error?.code || "payment_failed",
        lastStripeEventId: eventId,
      },
    },
    { new: true },
  );
  if (payment) {
    await Booking.updateOne(
      { _id: payment.bookingId, paymentStatus: "pending" },
      { $set: { paymentStatus: "failed" } },
    );
  }
};

/**
 * POST /api/payment/webhook — mounted with express.raw() in app.js.
 */
export const handleWebhook = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(503).send("Webhook not configured");
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      secret,
    );
  } catch (error) {
    console.warn("Stripe webhook signature verification failed");
    return res.status(400).send("Invalid signature");
  }

  try {
    const object = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(object, event.id);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(object, event.id);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(object, event.id);
        break;
      default:
        break;
    }
    return res.json({ received: true });
  } catch (error) {
    console.error(`Webhook ${event.type} processing failed:`, error.message);
    return res.status(500).send("Webhook handler failed"); // Stripe retries
  }
};
