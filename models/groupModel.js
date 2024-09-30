// models/groupModel.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  moduleName: { type: String, required: true },
  name: { type: String, required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  dateModified: { type: Date, default: Date.now },
});

const Group = mongoose.model("Group", groupSchema);
export default Group;
