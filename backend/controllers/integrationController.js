import User from "../models/User.js";
import { getGoogleAuthUrl, getGoogleTokens } from "../utils/googleCalender.js";

export const getGoogleConnectUrl = async (req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URL
  ) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth credentials are not set",
    });
  }
  res.status(200).json({ success: true, url: getGoogleAuthUrl(req.user.id) });
};

export const handleGoogleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(`${clientUrl}/profile?calender=failed`);
  }
  try {
    const tokens = await getGoogleTokens(code);
    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      return res.redirect(`${clientUrl}/profile?calender=failed`);
    }
    await User.findByIdAndUpdate(state, {
      googleRefreshToken: tokens.refresh_token,
      googleCalendarConnected: true,
      googleCalendarId: "primary",
    });
    res.redirect(`${clientUrl}/profile?calender=connected`);
  } catch (error) {
    res.redirect(`${clientUrl}/profile?calender=failed`);
  }
};

export const disconnectGoogleCalendar = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleRefreshToken: "",
      googleCalendarConnected: false,
      googleCalendarId: "",
    });
    res.status(200).json({ success: true, message: "Google Calendar disconnected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGoogleConnectionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "googleCalendarConnected googleCalendarId",
    );
    res.status(200).json({
      success: true,
      connected: user?.googleCalendarConnected || false,
      calendarId: user?.googleCalendarId || "",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
