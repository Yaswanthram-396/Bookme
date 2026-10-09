const toGoogleDateTime = (date, time) => {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
};

export const buildCustomerCalenderUrl = ({ business, service, booking }) => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${service.name} with ${business.businessName || business.name}`,
    dates: `${toGoogleDateTime(booking.date, booking.startTime)}/${toGoogleDateTime(booking.date, booking.endTime)}`,
    details:
      booking.notes ||
      `Booking with ${business.businessName} for ${service.name}`,
    ctz: business.timezone || "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
