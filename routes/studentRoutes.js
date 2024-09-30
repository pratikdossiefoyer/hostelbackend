import express from "express";
import {
  addToWishlist,
  removeFromWishlist,
  submitWishlist,
  getStudentById,
  getWishlistByStudentId,
  updateStudentProfile,
  uploadAdmissionReceipt,
  submitHostelFeedback,
  takeAdmission,
  getPassportPhoto,
  submitComplaint,
  getStudentComplaints,
  markNotInterested,
  requestOrUpdateHostelVisit,
} from "../controllers/studentController.js";

import { authMiddleware, verifyToken } from "../middlewares/authMiddleware.js";
import { checkPermission } from "../middlewares/permissionMiddleware.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

router.get("/:studentId", getStudentById);

router.get("/getphoto/:id", getPassportPhoto);

router.post("/wishlist/submit", authMiddleware, submitWishlist);

router.post("/submit-feedback", authMiddleware, submitHostelFeedback);
router.put(
  "/update-profile/:profileId",
  upload.fields([{ name: "passportPhoto", maxCount: 1 }]),
  authMiddleware,
  checkPermission("updateprofile", "edit"),
  updateStudentProfile
);

router.post(
  "/upload-receipt",
  upload.single("admissionReceipt"),
  authMiddleware,
  uploadAdmissionReceipt
);

router.post("/take-admission", authMiddleware, takeAdmission);

// Complaints
router.post(
  "/complaints",
  upload.array("images", 5),
  authMiddleware,
  submitComplaint
);

router.get("/complaints/:studentId", getStudentComplaints);
// router.put("/complaints/:complaintId/notice", markComplaintAsNoticed);
// router.delete("/complaints/:complaintId", deleteComplaint);

router.get(
  "/wishlist/:studentId",
  authMiddleware,
  checkPermission("wishlist", "read"),
  getWishlistByStudentId
);
router.post(
  "/wishlist/remove",
  authMiddleware,
  checkPermission("wishlist", "delete"),
  removeFromWishlist
);
router.post(
  "/wishlist/add",
  verifyToken,
  checkPermission("wishlist", "write"),
  addToWishlist
);

// visiting student

router.post("/request-visit", authMiddleware, requestOrUpdateHostelVisit);
router.post("/not-interested", authMiddleware, markNotInterested);

export default router;
