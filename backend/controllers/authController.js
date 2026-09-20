import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Users from "../models/User.js";
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
import slugify from "../utils/slug.js";

const createToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    slug: user.slug,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      businessDescription,
      timezone,
      emailOtp,
    } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await Users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpResponse = await verifyEmailOtp({
      email: normalizedEmail,
      purpose: "register",
      code: emailOtp,
      consume: true,
    });
    const slug = slugify(name);

    const baseSlug = slugify(businessName) || slug || "business";
    let finalSlug = baseSlug;
    let counter = 1;

    while (await Users.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    if (!otpResponse.verified) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await Users.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      slug: finalSlug,
      businessName: businessName || "",
      businessDescription: businessDescription || "",
      timezone: timezone || "Asia/Kolkata",
    });
    const token = createToken(user);
    res
      .status(201)
      .json({ message: "User registered successfully", user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    const existingUser = await Users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const otpResponse = await requestEmailOtp({
      email: normalizedEmail,
      purpose: "register",
    });
    res.status(200).json({
      message: "OTP sent successfully",
      email: normalizedEmail,
      otpResponse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, emilOtp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !emilOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const existingUser = await Users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const otpResponse = await verifyEmailOtp({
      email: normalizedEmail,
      purpose: "register",
      code: emilOtp,
      consume: true,
    });
    if (!otpResponse.verified) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    res
      .status(200)
      .json({ message: "OTP verified successfully", email: normalizedEmail });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !emilOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const existingUser = await Users.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(400).json({ message: "User Not Found" });
    }

    const ismatch = await bcrypt.compare(password, existingUser.password);
    if (!ismatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }
    const token = createToken(existingUser._id);
    res.status(200).json({
      message: "Logged in success",
      token,
      existingUser,
    });
  } catch (e) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User Not found",
      });
    }
    return res.status(200).json({
      message: "User found successfully",
      data: user,
    });
  } catch (e) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const {
    name,
    businessName,
    businessDescription,
    timezone,
    brandTheme,
    brandAccent,
  } = req.body;

  const user = await Users.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "No user Found" });
  }

  if (name !== undefined) {
    user.name = name;
  }
  if (businessName !== undefined) {
    user.businessName = businessName;
  }
  if (businessDescription !== undefined) {
    user.businessDescription = businessDescription;
  }
  if (timezone !== undefined) {
    user.timezone = timezone;
  }
  if (brandTheme !== undefined) {
    user.brandTheme = brandTheme;
  }
  if (brandAccent !== undefined) {
    user.brandAccent = brandAccent;
  }
  const slug = slugify(name);

  const baseSlug = slugify(businessName) || slug || "business";
  let finalSlug = baseSlug;
  let counter = 1;

  while (await Users.findOne({ slug: finalSlug })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  user.slug = finalSlug;
  const updatedUser = await user.save();
  if (updatedUser) {
    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } else {
    return res.status(500).json({ message: "Failed to update user" });
  }
};
