import express from "express";
import {
  getAllStudents,
  updateStudent,
  removeStudent,
  getAllHostels,
  updateHostel,
  removeHostel,
  verifyHostel,
  getAllOwners,
  updateOwner,
  removeFromWishlist,
  getAdminById,
  approveStudentWishlist,
  getPendingOwners,
  approveOwner,
  getAllUsers,
  getAdminProfile,
  updateAdminProfile,
  getHostelById,
  assignAdminEmployee,
  getGroups,
  setDefaultPermissions,
  addGroup,
  updateGroup,
  deleteGroup,
  assignGroupToRole,
  updateRolePermissions,
  addUser,
  updateUserRole,
  deleteUser,
  removePermissionFromRole,
  getPermissionsForRole,
  addRole,
  deleteRole,
  getRoles,
} from "../controllers/adminController.js";
import { checkPermission } from "../middlewares/permissionMiddleware.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);
router.get("/admin/:adminId", getAdminById);
router.get(
  "/students",
  authMiddleware,
  checkPermission("Student", "read"),
  getAllStudents
);
router.put(
  "/students",
  authMiddleware,
  checkPermission("Student", "edit"),
  updateStudent
);
router.delete(
  "/students/:studentId",
  authMiddleware,
  checkPermission("Student", "delete"),
  removeStudent
);
router.get(
  "/hostels",
  authMiddleware,
  checkPermission("Hostels", "read"),
  getAllHostels
);
router.get("/hostels/:hostelId", getHostelById);
router.put(
  "/hostels",
  authMiddleware,
  checkPermission("Hostels", "edit"),
  updateHostel
);
router.delete(
  "/hostels/:hostelId",
  authMiddleware,
  checkPermission("hostels", "delete"),
  removeHostel
);
router.put(
  "/hostels/verify",
  authMiddleware,
  checkPermission("verify", "edit"),
  verifyHostel
);
router.get(
  "/owners",
  authMiddleware,
  checkPermission("Owners", "read"),
  getAllOwners
);
router.put(
  "/owners",
  authMiddleware,
  checkPermission("Owners", "edit"),
  updateOwner
);
router.post("/wishlist/remove", removeFromWishlist);

router.post(
  "/approve-wishlist",
  authMiddleware,
  checkPermission("approveWishlist", "edit"),
  approveStudentWishlist
);

router.get("/pending-owners", getPendingOwners);
router.post("/approve-owner", approveOwner);

//UAC Role page get all users , add user, role update,delete role
router.get("/users", getAllUsers);
router.post("/users", addUser);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

//below roles roles to assign group,permission

router.post("/assign-admin-employee", adminAuth, assignAdminEmployee);

router.post("/set-default-permissions", adminAuth, setDefaultPermissions);

router.get("/permissions/:role", getPermissionsForRole);

// create groups module like wish, viewhostels
router.post("/assign-group-to-role", adminAuth, assignGroupToRole);
router.put("/update-role-permissions", adminAuth, updateRolePermissions);
router.post(
  "/remove-permission-from-role",
  adminAuth,
  removePermissionFromRole
);

router.get("/groups", adminAuth, getGroups);
router.post("/groups", adminAuth, addGroup);
router.put("/groups", adminAuth, updateGroup);
router.delete("/groups/:id", adminAuth, deleteGroup);

//add roles
router.post("/roles", addRole);
router.delete("/roles/:roleName", deleteRole);
router.get("/getroles", getRoles);

export default router;

// roles alardy asel tr navin update karyche jai nasel te add karyche
// jai jai permission  ahe the disale pahije so frontend madhe easy jail
