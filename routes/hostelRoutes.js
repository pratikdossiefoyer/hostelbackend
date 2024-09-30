import express from "express";

import {
  addHostel,
  getAllHostelsWithOwnerDetails,
  getHostelById,
  getOwnerById,
  removeHostel,
  getHostelWishlistStudents,
  getAdmittedStudents,
  applyCashback,
  getPhotos,
  updateHostelDetails,
  getHostelComplaints,
  updateComplaintStatus,
  deleteComplaint,
  getIdproofPhoto,
  updateOwnerProfile,
  getPendingVisits,
  respondToVisitRequest,
  markVisitCompleted,
} from "../controllers/hostelController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import Hostel from "../models/hostelModel.js";
import { checkPermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

router.get("/all", getAllHostelsWithOwnerDetails);
router.get("/:id", getHostelById);

router.get("/gethostalphotos/:id", getPhotos);
router.get("/getidproof/:id", getIdproofPhoto);
router.post(
  "/add-hostel",
  authMiddleware,
  checkPermission("hostel_view", "write"),
  upload.array("images", 10),
  addHostel
);
router.put(
  "/update-hostel",
  authMiddleware,
  checkPermission("hostel_view", "edit"),
  updateHostelDetails
);
router.get("/owners/:id", getOwnerById);
router.put("/owner/:profileId", updateOwnerProfile);

router.delete(
  "/delete/:hostelId",
  authMiddleware,
  checkPermission("hostel_view", "delete"),
  removeHostel
);

router.get(
  "/:ownerId/hostels",
  authMiddleware,
  checkPermission("hostel_view", "read"),
  async (req, res) => {
    try {
      const ownerHostels = await Hostel.find({
        owner: req.params.ownerId,
      });

      res.status(200).json({ hostels: ownerHostels });
    } catch (error) {
      console.error("Backend error:", error);
      res
        .status(500)
        .json({ message: "Something went wrong", error: error.message });
    }
  }
);

router.get(
  "/:hostelId/wishlist-students",
  authMiddleware,
  getHostelWishlistStudents
);

router.get("/:hostelId/admitted-students", authMiddleware, getAdmittedStudents);
router.post("/apply-cashback", authMiddleware, applyCashback);

router.get("/:hostelId/complaints", authMiddleware, getHostelComplaints);

router.patch("/complaints/:complaintId/status", updateComplaintStatus);

router.delete("/complaints/:complaintId", deleteComplaint);

// visitingroutes
router.get("/:hostelId/pending-visits", authMiddleware, getPendingVisits);
router.post("/respond-visit", authMiddleware, respondToVisitRequest);
router.post("/complete-visit", authMiddleware, markVisitCompleted);
export default router;
