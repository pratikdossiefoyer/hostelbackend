// models/roleModel.js
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
});

const Role = mongoose.model("Role", roleSchema);
export default Role;
