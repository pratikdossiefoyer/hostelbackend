import User from "../models/userModal.js";

export const determineRole = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).populate("role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "User is not approved" });
    }

    if (!user.role) {
      return res.status(400).json({ message: "User role is not assigned" });
    }

    req.user = user;
    req.userRole = user.role.name;
    next();
  } catch (error) {
    console.error("Error in determineRole middleware:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
