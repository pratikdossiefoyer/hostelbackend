// models/permissionModel.js
import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  moduleName: { type: String, required: true },
  name: { type: String, required: true },
  read: { type: Boolean, default: false },
  write: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
});

permissionSchema.index({ moduleId: 1, role: 1 }, { unique: true });
const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
