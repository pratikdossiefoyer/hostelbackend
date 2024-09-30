import Role from "../models/roleModel.js";
import mongoose from "mongoose";
import RolePermission from "../models/rolePermissonModal.js";
import User from "../models/userModal.js";

export const checkPermission = (requiredPermission, action = "read") => {
  return async (req, res, next) => {
    try {
      let role = req.userRole || req.user?.role;
      console.log("checkpermission role", role);

      // New code to handle admin role
      if (req.userId) {
        const user = await User.findById(req.userId).populate("role");
        if (user && user.role.name === "admin") {
          console.log("Admin user found, granting access");
          return next();
        }
      }

      if (!role) {
        console.warn("No role found in request. Denying access.");
        return res
          .status(403)
          .json({ message: "Access denied. No role found." });
      }

      if (typeof role === "string") {
        const roleDoc = await Role.findOne({ name: role });
        if (!roleDoc) {
          console.log(`Invalid role: ${role}`);
          return res.status(403).json({ message: "Invalid role" });
        }
        role = roleDoc;
      } else if (role instanceof mongoose.Types.ObjectId) {
        role = await Role.findById(role);
        if (!role) {
          console.log(`Invalid role ID: ${role}`);
          return res.status(403).json({ message: "Invalid role" });
        }
      }

      console.log(`Checking permissions for role: ${role.name}`);

      const rolePermission = await RolePermission.findOne({
        role: role._id,
      }).populate("permissions");

      if (!rolePermission) {
        console.log(
          `No RolePermission document found for role: ${role.name}. Allowing access.`
        );
        return next();
      }

      console.log(
        `Permissions for role ${role.name}:`,
        JSON.stringify(rolePermission.permissions, null, 2)
      );

      if (rolePermission.permissions.length === 0) {
        console.log(
          `No permissions assigned to role: ${role.name}. Allowing access.`
        );
        return next();
      }

      const permission = rolePermission.permissions.find(
        (p) => p.moduleId === requiredPermission
      );

      if (!permission) {
        console.log(`No permission found for module: ${requiredPermission}`);
        return res.status(403).json({
          message: `Access denied. Your role does not have any permissions for the ${requiredPermission} module.`,
        });
      }

      console.log(
        `Permission found for module ${requiredPermission}:`,
        permission
      );
      console.log(`Checking action: ${action}, Value: ${permission[action]}`);

      if (permission[action] !== true) {
        console.log(
          `Permission denied. ${action} is not allowed for ${requiredPermission}`
        );
        return res.status(403).json({
          message: `Access denied. Your role does not have permission to ${action} in the ${requiredPermission} module.`,
        });
      }

      console.log(`Permission granted for ${action} in ${requiredPermission}`);
      next();
    } catch (error) {
      console.error("Error in checkPermission middleware:", error);
      res
        .status(500)
        .json({ message: "Something went wrong", error: error.message });
    }
  };
};
