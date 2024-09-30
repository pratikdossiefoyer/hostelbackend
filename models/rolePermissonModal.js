// models/rolePermissionModel.js
import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
    unique: true,
  },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
});

const RolePermission = mongoose.model("RolePermission", rolePermissionSchema);
export default RolePermission;
