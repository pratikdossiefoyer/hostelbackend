// models/GroupRole.js
import mongoose from "mongoose";

const groupRoleSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  role: {
    type: String,
    enum: ["student", "hostelOwner", "websiteOwner", "adminEmployee"],
    required: true,
  },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
});

const GroupRole = mongoose.model("GroupRole", groupRoleSchema);
export default GroupRole;
