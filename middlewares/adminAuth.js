import jwt from "jsonwebtoken";
import User from "../models/userModal.js";

export const adminAuth = async (req, res, next) => {
  try {
    console.log("Authorization header:", req.headers.authorization);
    const token = req.headers.authorization.split(" ")[1];
    console.log("Extracted token:", token);

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decodedToken);

    const user = await User.findById(decodedToken.id).populate("role");
    console.log("Found user:", user);

    if (!user || user.role.name !== "admin") {
      console.log("User not found or not admin");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    req.userId = decodedToken.id;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
