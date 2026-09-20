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
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(
      `${process.env.CLIENT_URL}` ||
        "http://localhost:5173/profile?calender=failed",
    );
  }
  try {
    const tokens = await getGoogleTokens(code);
    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      return res.redirect(
        `${process.env.CLIENT_URL}` ||
          "http://localhost:5173/profile?calender=failed",
      );
    }
    await User.findByIdAndUpdate(state, {
      googleRefreshToken: tokens.refresh_token,
      googleCalendarConnected: true,
      googleCalenderId: "primary",
    });
    res.redirect(
      `${process.env.CLIENT_URL}` ||
        "http://localhost:5173/profile?calender=connected",
    );
  } catch (error) {
    res.redirect(
      `${process.env.CLIENT_URL}` ||
        "http://localhost:5173/profile?calender=failed",
    );
  }
};
