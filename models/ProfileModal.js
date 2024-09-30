import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { strict: false }
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
