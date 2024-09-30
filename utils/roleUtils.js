// utils/roleUtils.js
import Owner from "../models/ownerModel.js";
import Profile from "../models/ProfileModal.js";
import Student from "../models/studentModel.js";
import Role from "../models/roleModel.js";

export async function handleRoleSpecificData(
  roleName,
  data,
  operation = "create",
  profileId = null
) {
  let result;

  console.log("handleRoleSpecificData called with:", {
    roleName,
    operation,
    profileId,
  });

  if (!roleName) {
    throw new Error("Role name is required");
  }

  const role = await Role.findOne({ name: roleName });
  console.log("Found role:", role);

  if (!role) {
    throw new Error(`Invalid role: ${roleName}`);
  }

  switch (roleName.toLowerCase()) {
    case "student":
      if (operation === "create") {
        const student = new Student({ ...data, role: role._id });
        await student.save();
        result = student._id;
      } else if (operation === "delete") {
        await Student.findByIdAndDelete(profileId);
      } else if (operation === "update") {
        await Student.findByIdAndUpdate(profileId, data);
      }
      break;

    case "hostelowner":
      if (operation === "create") {
        const owner = new Owner({ ...data, role: role._id });
        await owner.save();
        result = owner._id;
      } else if (operation === "delete") {
        await Owner.findByIdAndDelete(profileId);
      } else if (operation === "update") {
        await Owner.findByIdAndUpdate(profileId, data);
      }
      break;

    default:
      if (operation === "create") {
        const profile = new Profile({ role: role._id, ...data });
        await profile.save();
        result = profile._id;
      } else if (operation === "delete") {
        if (!profileId) {
          throw new Error("Profile ID is required for delete operation");
        }
        await Profile.findByIdAndDelete(profileId);
      } else if (operation === "update") {
        if (!profileId) {
          throw new Error("Profile ID is required for update operation");
        }
        await Profile.findByIdAndUpdate(profileId, data);
      }
  }

  return result;
}
