// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModal.js";
import Student from "../models/studentModel.js";
import Owner from "../models/ownerModel.js";
import Role from "../models/roleModel.js";
import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req, res) => {
  const { email, password, roleName, setupKey, ...profileData } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    console.log("step 1", existingUser);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: "Invalid role" });
    }

    let profile;
    let isApproved = false;

    if (setupKey && setupKey === process.env.ADMIN_SETUP_KEY) {
      role = await Role.findOne({ name: "admin" });
      isApproved = true;

      const existingAdmin = await User.findOne({ role: role._id });
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" });
      }
    } else {
      if (role.name === "student") {
        // if (!req.files || !req.files.passportPhoto) {
        //   return res
        //     .status(400)
        //     .json({ message: "Passport photo is required for students" });
        // }
        profile = new Student({
          ...profileData,
          // passportPhoto: {
          //   data: req.files.passportPhoto[0].buffer,
          //   contentType: req.files.passportPhoto[0].mimetype,
          // },
        });
      } else if (role.name === "hostelOwner") {
        // if (!req.files || !req.files.idProof) {
        //   return res
        //     .status(400)
        //     .json({ message: "ID proof is required for hostel owners" });
        // }
        profile = new Owner({
          ...profileData,
          // idProof: {
          //   data: req.files.idProof[0].buffer,
          //   contentType: req.files.idProof[0].mimetype,
          // },
        });
      } else {
        return res.status(400).json({ message: "Invalid role" });
      }
    }

    if (profile) {
      await profile.save();
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    const newUser = new User({
      email,
      password,
      role: role._id,
      isApproved,
      profileId: profile ? profile._id : undefined,
      otp,
      otpExpires,
    });
    await newUser.save();

    // Send OTP email
    const mailOptions = {
      to: email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels Registration OTP",
      text: `Your OTP for registration is: ${otp}\n\nThis OTP will expire in 10 minutes. Do not share this OTP with anyone.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: `${
        role.name.charAt(0).toUpperCase() + role.name.slice(1)
      } registered successfully. Please check your email for the OTP to complete registration.`,
      userId: newUser._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    // Clear the OTP after successful validation
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isApproved = true;

    await user.save();

    res.status(200).json({ message: "Registration completed successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, oauthProvider } = req.body;

    const user = await User.findOne({ email }).populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isAuthenticated = false;

    if (oauthProvider) {
      // OAuth-based login
      switch (oauthProvider) {
        case "google":
          isAuthenticated = !!user.googleId;
          break;
        case "facebook":
          isAuthenticated = !!user.facebookId;
          break;
        case "instagram":
          isAuthenticated = !!user.instagramId;
          break;
        default:
          return res.status(400).json({ message: "Invalid OAuth provider" });
      }
    }

    // If OAuth authentication failed or wasn't provided, try password login
    if (!isAuthenticated && password) {
      if (user.password) {
        isAuthenticated = await bcrypt.compare(password, user.password);
      } else {
        return res
          .status(401)
          .json({ message: "No password set for this account" });
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role.name, profileId: user.profileId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      token,
      userId: user._id,
      role: user.role.name,
      profileId: user.profileId,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("userid", user.lastLogout);
    user.lastLogout = new Date();
    await user.save();

    res.status(200).json({
      message: "Logged out successfully",
      lastLogout: user.lastLogout,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const generateAndSendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpiration;

    console.log("Saving OTP:", otp, "Expiration:", otpExpiration);

    await user.save();

    console.log("User after save:", user);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error generating and sending OTP:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const verifyOTPAndChangePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log("Received email:", email);
  console.log("Received OTP:", otp);

  try {
    // First, find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found with email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.email);
    console.log("Stored OTP:", user.resetPasswordOTP);
    console.log("OTP Expiration:", user.resetPasswordOTPExpires);

    // Check if OTP matches and is not expired
    if (user.resetPasswordOTP !== otp) {
      console.log("OTP does not match");
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetPasswordOTPExpires < Date.now()) {
      console.log("OTP has expired");
      return res.status(400).json({ message: "OTP has expired" });
    }

    // // Hash new password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    console.log("Password changed successfully for user:", user.email);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error verifying OTP and changing password:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
