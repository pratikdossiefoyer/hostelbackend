import Student from "../models/studentModel.js";
import Hostel from "../models/hostelModel.js";
import Owner from "../models/ownerModel.js";

import User from "../models/userModal.js";
import Permission from "../models/permissionModel.js";
import Group from "../models/groupModel.js";
import bcrypt from "bcryptjs";

import { handleRoleSpecificData } from "../utils/roleUtils.js";
import RolePermission from "../models/rolePermissonModal.js";
import nodemailer from "nodemailer";
import Role from "../models/roleModel.js";
import mongoose from "mongoose";

export const getHostelById = async (req, res) => {
  const { hostelId } = req.params;

  try {
    const hostel = await Hostel.findById(hostelId).populate(
      "owner",
      "-password"
    );

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    res.status(200).json(hostel);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  const { email } = req.body;
  try {
    const updatedAdmin = await User.findByIdAndUpdate(
      req.userId,
      { email },
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(updatedAdmin);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: "admittedHostel",
        select: "name address hostelType beds food verified images owner",
        populate: {
          path: "owner",
          select: "name number",
        },
      })
      .lean();

    const enhancedStudents = await Promise.all(
      students.map(async (student) => {
        // Find the user by profileId to get the email
        const user = await User.findOne({ profileId: student._id }).select(
          "email"
        );

        // Fetch complaints for this student from all hostels
        const complaints = await Hostel.aggregate([
          { $unwind: "$complaints" },
          {
            $match: {
              "complaints.student": student._id,
            },
          },
          {
            $project: {
              _id: 0,
              hostelId: "$_id",
              hostelName: "$name",
              complaint: "$complaints",
            },
          },
        ]);

        // Fetch feedback for this student from all hostels
        const feedback = await Hostel.aggregate([
          { $unwind: "$feedback" },
          {
            $match: {
              "feedback.student": student._id,
            },
          },
          {
            $project: {
              _id: 0,
              hostelId: "$_id",
              hostelName: "$name",
              feedback: "$feedback",
            },
          },
        ]);

        return {
          ...student,
          email: user ? user.email : null,
          complaints: complaints.map((item) => ({
            ...item.complaint,
            hostelId: item.hostelId,
            hostelName: item.hostelName,
          })),
          feedback: feedback.map((item) => ({
            ...item.feedback,
            hostelId: item.hostelId,
            hostelName: item.hostelName,
          })),
        };
      })
    );

    res.status(200).json(enhancedStudents);
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  const { studentId, ...updateData } = req.body;
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAllHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find().populate("owner", "-password");
    res.status(200).json(hostels);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateHostel = async (req, res) => {
  const { hostelId, ...updateData } = req.body;
  try {
    const updatedHostel = await Hostel.findByIdAndUpdate(hostelId, updateData, {
      new: true,
      runValidators: true,
    }).populate("owner", "-password");
    if (!updatedHostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    res.status(200).json(updatedHostel);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const verifyHostel = async (req, res) => {
  const { hostelId } = req.body;
  try {
    const hostel = await Hostel.findByIdAndUpdate(
      hostelId,
      { verified: true },
      { new: true }
    ).populate("owner", "-password");
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    res.status(200).json(hostel);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAllOwners = async (req, res) => {
  try {
    const owners = await Owner.find().select("-password").populate("hostels");
    res.status(200).json(owners);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateOwner = async (req, res) => {
  const { ownerId, ...updateData } = req.body;
  try {
    const updatedOwner = await Owner.findByIdAndUpdate(ownerId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("hostels");
    if (!updatedOwner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    res.status(200).json(updatedOwner);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  const { studentId, hostelId } = req.body;
  console.log(" studentId, hostelId", studentId, hostelId);
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $pull: { wishlist: hostelId } },
      { new: true }
    ).select("-password");
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const removeStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const deletedStudent = await Student.findByIdAndDelete(studentId);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const removeHostel = async (req, res) => {
  const { hostelId } = req.params;

  try {
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const studentsAdmitted = await Student.find({ admittedHostel: hostelId });

    if (studentsAdmitted.length > 0) {
      return res.status(403).json({
        message: "Hostel cannot be deleted because students are admitted.",
      });
    }

    await Hostel.deleteOne({ _id: hostelId });

    await Owner.findByIdAndUpdate(hostel.owner, {
      $pull: { hostels: hostelId },
    });

    res.status(200).json({ message: "Hostel removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAdminById = async (req, res) => {
  const { adminId } = req.params;
  try {
    const admin = await User.findById(adminId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const approveStudentWishlist = async (req, res) => {
  const { studentId } = req.body;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (!student.wishlistSubmitted) {
      return res.status(400).json({ message: "Wishlist not submitted" });
    }
    student.wishlistApproved = true;
    await student.save();
    res.status(200).json({ message: "Wishlist approved successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getPendingOwners = async (req, res) => {
  try {
    const pendingOwners = await User.find({
      role: "owner",
      isApproved: false,
    }).select("-password");
    res.status(200).json(pendingOwners);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const approveOwner = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "owner") {
      return res
        .status(400)
        .json({ message: "User is not registered as an owner" });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: "User is already approved" });
    }

    user.isApproved = true;
    await user.save();

    res.status(200).json({ message: "Owner approved successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

// UAC

export const assignAdminEmployee = async (req, res) => {
  try {
    const { userId, permissions } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = "adminEmployee";
    user.permissions = permissions;
    await user.save();
    res
      .status(200)
      .json({ message: "Admin employee assigned successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("roles", "name");

    const formattedGroups = groups.map((group) => ({
      _id: group._id,
      moduleId: group.moduleId,
      moduleName: group.moduleName,
      name: group.name,
      dateModified: group.dateModified,
      roles: group.roles.map((role) => role.name),
    }));

    res.status(200).json(formattedGroups);
  } catch (error) {
    console.error("Error in getGroups:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
export const addGroup = async (req, res) => {
  try {
    const { moduleId, moduleName, roleIds } = req.body;

    console.log("Received group data:", req.body);

    // Validate roles
    const roles = await Role.find({ _id: { $in: roleIds } });
    if (roles.length !== roleIds.length) {
      console.log("One or more roles not found");
      return res.status(400).json({ message: "One or more invalid roles" });
    }

    const groupCount = await Group.countDocuments();
    const name = `G${groupCount + 1}`;

    const newGroup = new Group({
      moduleId,
      moduleName,
      name,
      roles: roles.map((role) => role._id),
    });
    await newGroup.save();

    res
      .status(201)
      .json({ message: "Group added successfully", group: newGroup });
  } catch (error) {
    console.error("Error in addGroup:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id, moduleId, moduleName, roleIds } = req.body;

    // Validate roles
    const roles = await Role.find({ _id: { $in: roleIds } });
    if (roles.length !== roleIds.length) {
      return res.status(400).json({ message: "One or more invalid roles" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      {
        moduleId,
        moduleName,
        roles: roles.map((role) => role._id),
        dateModified: Date.now(),
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res
      .status(200)
      .json({ message: "Group updated successfully", group: updatedGroup });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGroup = await Group.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const assignGroupToRole = async (req, res) => {
  try {
    const { role, groupIds } = req.body;

    if (role === "admin") {
      return res
        .status(400)
        .json({ message: "Cannot assign groups to admin role" });
    }

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(404).json({ message: "Role not found" });
    }

    const groups = await Group.find({ _id: { $in: groupIds } });

    const newPermissions = [];

    for (const group of groups) {
      const permission = await Permission.findOneAndUpdate(
        { moduleId: group.moduleId, role: roleDoc._id },
        {
          moduleId: group.moduleId,
          moduleName: group.moduleName,
          name: group.name,
          read: true,
          write: true,
          edit: true,
          delete: true,
          role: roleDoc._id,
        },
        { upsert: true, new: true }
      );
      newPermissions.push(permission);
    }

    // Update RolePermission
    await RolePermission.findOneAndUpdate(
      { role: roleDoc._id },
      {
        $addToSet: { permissions: { $each: newPermissions.map((p) => p._id) } },
      },
      { upsert: true }
    );

    res.status(200).json({
      message: "Groups assigned to role successfully",
      permissions: newPermissions,
    });
  } catch (error) {
    console.error("Error in assignGroupToRole:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const removePermissionFromRole = async (req, res) => {
  try {
    const { role, permissionId } = req.body;

    // Find the Role document by name
    const roleDocument = await Role.findOne({ name: role });
    if (!roleDocument) {
      return res.status(404).json({ message: "Role not found" });
    }

    const rolePermission = await RolePermission.findOne({
      role: roleDocument._id,
    });
    if (!rolePermission) {
      return res.status(404).json({ message: "Role permissions not found" });
    }

    const permission = await Permission.findByIdAndDelete(permissionId);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    rolePermission.permissions = rolePermission.permissions.filter(
      (p) => p.toString() !== permissionId
    );
    await rolePermission.save();

    const updatedRolePermission = await RolePermission.findOne({
      role: roleDocument._id,
    }).populate("permissions");

    res.status(200).json({
      message: "Permission removed from role successfully",
      rolePermissions: updatedRolePermission,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateRolePermissions = async (req, res) => {
  try {
    const { role, permissionId, update } = req.body;

    // Find the role by name
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role === "admin") {
      return res
        .status(400)
        .json({ message: "Cannot update permissions for admin role" });
    }

    // Find and update the specific permission
    const updatedPermission = await Permission.findOneAndUpdate(
      { _id: permissionId, role: roleDoc._id },
      { $set: update },
      { new: true }
    );

    if (!updatedPermission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.status(200).json({
      message: "Permission updated successfully",
      updatedPermission,
    });
  } catch (error) {
    console.error("Error updating permission:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const setDefaultPermissions = async (req, res) => {
  try {
    const { role } = req.body;
    const defaultPermissions = {
      student: ["cust_id", "wish"],
      hostelOwner: ["hostel_dash", "hstl_vw", "hstl_add"],
      admin: [
        "cust_id",
        "hostel_dash",
        "widget1_id",
        "widget2_id",
        "hstl_vw",
        "hstl_add",
        "wish",
      ],
      websiteOwner: [
        "cust_id",
        "hostel_dash",
        "widget1_id",
        "widget2_id",
        "hstl_vw",
        "hstl_add",
        "wish",
      ],
      adminEmployee: ["cust_id", "hostel_dash", "hstl_vw", "wish"],
    };

    const groups = await Group.find({
      moduleId: { $in: defaultPermissions[role] },
    });
    const permissions = groups.map((group) => ({
      moduleId: group.moduleId,
      moduleName: group.moduleName,
      read: true,
      write: true,
      edit: true,
      delete: true,
    }));

    const newPermissions = await Permission.create(permissions);
    const user = await User.findOne({ role });
    if (user) {
      user.permissions = newPermissions.map((p) => p._id);
      await user.save();
      res
        .status(200)
        .json({ message: "Default permissions set successfully", user });
    } else {
      res.status(404).json({ message: "Role not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getPermissionsForRole = async (req, res) => {
  try {
    const { role } = req.params;

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(404).json({ message: "Role not found" });
    }

    const rolePermission = await RolePermission.findOne({
      role: roleDoc._id,
    }).populate("permissions");

    if (!rolePermission) {
      return res.status(404).json({ message: "Role permissions not found" });
    }

    const groupedPermissions = rolePermission.permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.moduleName]) {
          acc[permission.moduleName] = [];
        }
        acc[permission.moduleName].push(permission);
        return acc;
      },
      {}
    );

    res.status(200).json({
      role,
      permissions: groupedPermissions,
    });
  } catch (error) {
    console.error("Error in getPermissionsForRole:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

/// UAC User page roles assign role a, add roles , delete roles

export const changeUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    //Send email to user about password change
    // await sendEmail(
    //   user.email,
    //   "Password Changed",
    //   `Your password has been changed by an administrator. New temporary password: ${newPassword} `
    // );
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      to: user.email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels Password change",
      text: `Your password has been changed by an administrator. New temporary password: ${newPassword} 
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to change password",
      error: error.message,
    });
  }
};

export const addUser = async (req, res) => {
  try {
    const { email, roleName, password, ...additionalData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const profileId = await handleRoleSpecificData(
      roleName,
      additionalData,
      "create"
    );

    const newUser = new User({
      email,
      password,
      role: role._id,
      profileId,
    });
    await newUser.save();
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      to: email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels admin addedyou",
      text: `your email id is ${email} , password is :${password}, role is ${role.name}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({
      message: "User created successfully",
      user: {
        ...newUser.toObject(),
        roleName: role.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, email, password } = req.body;

    console.log("Received request body:", req.body);

    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Found user:", user);

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: "Invalid role" });
    }

    console.log("Found role:", role);

    if (email && email !== user.email) {
      user.email = email;
    }

    if (password) {
      user.password = password; // The pre-save hook will hash this
    }

    // Check if user.role exists and if it's different from the new role
    if (!user.role || user.role.toString() !== role._id.toString()) {
      if (user.profileId) {
        await handleRoleSpecificData(
          user.role ? (await Role.findById(user.role)).name : "unknown",
          null,
          "delete",
          user.profileId
        );
      }

      const newProfileId = await handleRoleSpecificData(roleName, {}, "create");

      user.role = role._id;
      user.profileId = newProfileId;
    }

    await user.save();
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log("updated role", user.role.name);
    const mailOptions = {
      to: user.email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels role is updated",
      text: `your role is updated to ${roleName}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: "User updated successfully",
      user: {
        ...user.toObject({ getters: true, virtuals: false }),
        roleName: role.name,
      },
    });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.role) {
      return res.status(400).json({ message: "User has no associated role" });
    }

    if (user.profileId) {
      try {
        await handleRoleSpecificData(
          user.role.name,
          null,
          "delete",
          user.profileId
        );
      } catch (roleError) {
        console.error("Error in handleRoleSpecificData:", roleError);
        return res.status(400).json({
          message: "Failed to delete user's role-specific data",
          error: roleError.message,
        });
      }
    }

    await User.findByIdAndDelete(id);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      to: user.email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels deleted your account by admin",
      text: `Hi ${email}admin is deleted your account`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("role", "name");
    const usersWithHashedPasswords = users.map((user) => {
      const userObject = user.toObject();
      return {
        ...userObject,

        roleName:
          userObject.role && userObject.role.name
            ? userObject.role.name
            : "No Role Assigned",
      };
    });

    res.status(200).json(usersWithHashedPasswords);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

// Add role
export const addRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newRole = new Role({
      _id: new mongoose.Types.ObjectId(),
      name,
      description,
    });
    await newRole.save();
    res.status(201).json({ message: "Role added successfully", role: newRole });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Role already exists" });
    }
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

// Delete role
export const deleteRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    const deletedRole = await Role.findOneAndDelete({ name: roleName });
    if (!deletedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    await Permission.deleteMany({ role: deletedRole._id });
    await RolePermission.deleteOne({ role: deletedRole._id });
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
