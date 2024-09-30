import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      // Password is required only if no OAuth ID is present
      return !this.googleId && !this.facebookId && !this.instagramId;
    },
  },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  isApproved: { type: Boolean, default: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, refPath: "role" },
  lastLogin: { type: Date },
  lastLogout: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpires: Date,
  otp: String,
  otpExpires: Date,
  newEmail: {
    type: String,
    validate: {
      validator: function (v) {
        return v === null || v.length > 0;
      },
      message: "New email cannot be empty",
    },
  },
  emailOtp: String,
  emailOtpExpires: Date,
  googleId: String,
  facebookId: String,
  instagramId: String,
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
