import jwt from "jsonwebtoken";
import User from "../models/userModal.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authorizationHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    req.role = user.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      _id: decodedToken.id,
      role: decodedToken.role,
      profileId: decodedToken.profileId,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};
