import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";

export const studentAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decodedToken.id);
    if (!student) {
      throw new Error("Student not found");
    }
    req.student = student;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};
