// import Owner from "../models/ownerModel.js";
// import Hostel from "../models/hostelModel.js";
// import User from "../models/userModal.js";
// import Student from "../models/studentModel.js";
// import bcrypt from "bcrypt";
// import mongoose from "mongoose";
// import nodemailer from "nodemailer";

// import dotenv from "dotenv";
// dotenv.config();

// export const updateOwnerProfile = async (req, res) => {
//   const { name, number, email, address, password } = req.body;
//   const { profileId } = req.params;

//   try {
//     const existingOwner = await Owner.findById(profileId);
//     if (!existingOwner) {
//       return res.status(404).json({ message: "Owner not found" });
//     }

//     const updateData = {
//       name,
//       number,
//       email,
//       address,
//     };

//     if (req.files && req.files.idProof && req.files.idProof.length > 0) {
//       updateData.idProof = {
//         data: req.files.idProof[0].buffer,
//         contentType: req.files.idProof[0].mimetype,
//       };
//     }

//     const updatedOwner = await Owner.findByIdAndUpdate(profileId, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     if (email || password) {
//       const user = await User.findOne({ profileId });
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       if (email) user.email = email;

//       if (password) {
//         // const salt = await bcrypt.genSalt(10);
//         // const hashedPassword = await bcrypt.hash(password, salt);
//         user.password = password;
//         console.log(`Password updated for user ${user._id}`);
//       }

//       await user.save();
//     }

//     res.status(200).json({
//       message: "Profile updated successfully",
//       owner: updatedOwner,
//     });
//   } catch (error) {
//     console.error("Error updating owner profile:", error);
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const removeHostel = async (req, res) => {
//   const { hostelId } = req.params;

//   try {
//     const hostel = await Hostel.findById(hostelId);

//     if (!hostel) {
//       return res.status(404).json({ message: "Hostel not found" });
//     }

//     await Hostel.deleteOne({ profileId: hostelId });

//     await Owner.findByIdAndUpdate(hostel.owner, {
//       $pull: { hostels: hostelId },
//     });

//     res.status(200).json({ message: "Hostel removed successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };
// export const getAllHostelsWithOwnerDetails = async (req, res) => {
//   try {
//     const hostelsWithOwners = await Hostel.aggregate([
//       {
//         $lookup: {
//           from: "owners",
//           localField: "owner",
//           foreignField: "_id",
//           as: "ownerDetails",
//         },
//       },
//       {
//         $unwind: "$ownerDetails",
//       },
//       {
//         $project: {
//           "ownerDetails.password": 0,
//         },
//       },
//     ]);

//     if (hostelsWithOwners.length === 0) {
//       return res.status(404).json({ message: "No hostels found" });
//     }

//     res.status(200).json(hostelsWithOwners);
//   } catch (error) {
//     console.error("Error in getAllHostelsWithOwnerDetails:", error);
//     res.status(500).json({
//       message: "Something went wrong",
//       error: {
//         message: error.message,
//         stack: error.stack,
//       },
//     });
//   }
// };

// export const addHostel = async (req, res) => {
//   const {
//     name,
//     number,
//     address,
//     hostelType,
//     beds,
//     studentsPerRoom,
//     food,
//     rentStructure,
//   } = req.body;

//   try {
//     const newHostel = new Hostel({
//       name,
//       owner: req.user.profileId,
//       number,
//       address,
//       hostelType,
//       beds: parseInt(beds),
//       studentsPerRoom: parseInt(studentsPerRoom),
//       food: food === "true",
//       images: req.files
//         ? req.files.map((file) => ({
//             data: file.buffer,
//             contentType: file.mimetype,
//           }))
//         : [],
//       rentStructure: JSON.parse(rentStructure).map((item) => ({
//         studentsPerRoom: parseInt(item.studentsPerRoom),
//         rentPerStudent: parseFloat(item.rentPerStudent),
//       })),
//     });

//     const savedHostel = await newHostel.save();
//     await Owner.findByIdAndUpdate(req.user.profileId, {
//       $push: { hostels: savedHostel._id },
//     });

//     res
//       .status(201)
//       .json({ message: "Hostel added successfully", hostel: savedHostel });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const updateHostelDetails = async (req, res) => {
//   try {
//     const { hostelId, rentStructure, ...updateData } = req.body;
//     const existingImages = JSON.parse(req.body.existingImages || "[]");

//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) {
//       return res.status(404).json({ message: "Hostel not found" });
//     }

//     let updatedImages = [...hostel.images];

//     existingImages.forEach((image) => {
//       if (!updatedImages.some((img) => img.toString() === image)) {
//         updatedImages.push(image);
//       }
//     });

//     if (req.files && req.files.length > 0) {
//       const newImages = req.files.map((file) => ({
//         data: file.buffer,
//         contentType: file.mimetype,
//       }));
//       updatedImages = [...updatedImages, ...newImages];
//     }

//     // Parse the rentStructure if it's a string
//     const parsedRentStructure =
//       typeof rentStructure === "string"
//         ? JSON.parse(rentStructure)
//         : rentStructure;

//     const updatedHostel = await Hostel.findByIdAndUpdate(
//       hostelId,
//       {
//         $set: {
//           ...updateData,
//           images: updatedImages,
//           rentStructure: parsedRentStructure,
//         },
//       },
//       { new: true }
//     );

//     res.json(updatedHostel);
//   } catch (error) {
//     console.error("Error updating hostel:", error);
//     res
//       .status(500)
//       .json({ message: "Error updating hostel", error: error.message });
//   }
// };
// export const getHostelById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const hostel = await Hostel.findById(id).populate({
//       path: "owner",
//       select: "-password",
//     });

//     if (!hostel) {
//       return res.status(404).json({ message: "Hostel not found" });
//     }

//     const ownerWithHostels = await Owner.findById(hostel.owner.profileId)
//       .select("-password")
//       .populate("hostels", "name address hostelType beds");

//     const response = {
//       hostel: {
//         profileId: hostel.profileId,
//         name: hostel.name,
//         number: hostel.number,
//         address: hostel.address,
//         hostelType: hostel.hostelType,
//         beds: hostel.beds,
//         studentsPerRoom: hostel.studentsPerRoom,
//         food: hostel.food,
//         images: hostel.images,
//         verified: hostel.verified,
//         paymentStatus: hostel.paymentStatus,
//       },
//       owner: {
//         profileId: ownerWithHostels.profileId,
//         name: ownerWithHostels.name,
//         email: ownerWithHostels.email,
//         number: ownerWithHostels.number,
//         address: ownerWithHostels.address,
//         hostels: ownerWithHostels.hostels,
//       },
//     };

//     res.status(200).json(response);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const getOwnerById = async (req, res) => {
//   const ownerId = req.params.id;
//   try {
//     const owner = await Owner.findById(ownerId).select("-password").populate({
//       path: "hostels",
//       select: "name address hostelType beds",
//     });

//     if (!owner) {
//       return res.status(404).json({ message: "Owner not found" });
//     }

//     const response = {
//       owner: {
//         profileId: owner.profileId,
//         name: owner.name,
//         email: owner.email,
//         number: owner.number,
//         address: owner.address,
//         hostels: owner.hostels,
//       },
//     };

//     res.status(200).json(response);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const getHostelWishlistStudents = async (req, res) => {
//   const { hostelId } = req.params;
//   try {
//     const students = await Student.find({ wishlist: hostelId }).select(
//       "-password -wishlist -admissionReceipt"
//     );
//     res.status(200).json(students);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const getAdmittedStudents = async (req, res) => {
//   const { hostelId } = req.params;
//   const ownerId = req.user.profileId;

//   try {
//     const hostel = await Hostel.findOne({ _id: hostelId, owner: ownerId });

//     if (!hostel) {
//       return res.status(404).json({
//         message:
//           "Hostel not found or you're not authorized to access this data",
//       });
//     }
//     const students = await Student.find({
//       admittedHostel: hostelId,
//     }).select("-complaints -wishlist -passportPhoto");

//     const hostelWithStudents = {
//       _id: hostel._id,
//       name: hostel.name,
//       admittedStudents: students,
//       totalAdmittedStudents: students.length,
//     };

//     if (students.length === 0) {
//       hostelWithStudents.message =
//         "No admitted students found for this hostel.";
//     }

//     res.status(200).json(hostelWithStudents);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// // export const getAdmittedStudents = async (req, res) => {
// //   const { hostelId } = req.params;
// //   try {
// //     const hostel = await Hostel.findById(hostelId);
// //     if (!hostel) {
// //       return res.status(404).json({ message: "Hostel not found" });
// //     }
// //     if (hostel.owner.toString() !== req.user.profileId.toString()) {
// //       return res
// //         .status(403)
// //         .json({ message: "Not authorized to view this hostel's data" });
// //     }
// //     const students = await Student.find({
// //       admittedHostel: hostelId,
// //       admissionReceipt: { $exists: true, $ne: null },
// //     }).select("-password");

// //     const hostelWithStudents = {
// //       profileId: hostel.profileId,
// //       name: hostel.name,
// //       admittedStudents: students,
// //     };

// //     res.status(200).json(hostelWithStudents);
// //   } catch (error) {
// //     res
// //       .status(500)
// //       .json({ message: "Something went wrong", error: error.message });
// //   }
// // };

// export const applyCashback = async (req, res) => {
//   const { studentId, hostelId } = req.body;
//   try {
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) {
//       return res.status(404).json({ message: "Hostel not found" });
//     }
//     if (hostel.owner.toString() !== req.user.profileId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to apply cashback for this hostel" });
//     }
//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }
//     if (student.cashbackApplied) {
//       return res.status(400).json({ message: "Cashback already applied" });
//     }
//     student.cashbackApplied = true;
//     await student.save();
//     res.status(200).json({ message: "Cashback applied successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// //get hostal images
// export const getPhotos = async (req, res) => {
//   try {
//     const hostelId = req.params.id;
//     const hostel = await Hostel.findById(hostelId);

//     if (!hostel || !hostel.images || hostel.images.length === 0) {
//       return res.status(404).send("No photos found");
//     }

//     const imagesBase64 = hostel.images.map((image) => ({
//       contentType: image.contentType,
//       data: image.data.toString("base64"),
//     }));

//     res.json(imagesBase64);
//   } catch (error) {
//     res.status(500).send("Error retrieving photos");
//   }
// };
// // get Idproof
// export const getIdproofPhoto = async (req, res) => {
//   try {
//     const owner = await Owner.findById(req.params.id);
//     if (!owner || !owner.idProof) {
//       return res.status(404).send("No photo found");
//     }
//     res.set("Content-Type", owner.idProof.contentType);
//     res.send(owner.idProof.data);
//   } catch (error) {
//     res.status(500).send("Error retrieving photo");
//   }
// };

// // complaints
// export const getHostelComplaints = async (req, res) => {
//   try {
//     const hostel = await Hostel.findById(req.params.hostelId).populate({
//       path: "complaints.student",
//       select: "name -_id",
//     });

//     if (!hostel) {
//       return res.status(404).json({ message: "Hostel not found" });
//     }

//     const complaints = hostel.complaints.map((complaint) => ({
//       ...complaint.toObject(),
//       studentName: complaint.isAnonymous ? "Anonymous" : complaint.student.name,
//       images: complaint.images.map((image) => ({
//         contentType: image.contentType,
//         data: image.data.toString("base64"),
//       })),
//     }));

//     const complaintStats = {
//       total: complaints.length,
//       resolved: complaints.filter((c) => c.status === "resolved").length,
//       open: complaints.filter((c) => c.status === "open").length,
//     };

//     res.status(200).json({ complaints, stats: complaintStats });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const updateComplaintStatus = async (req, res) => {
//   const { complaintId } = req.params;
//   const { status } = req.body;

//   if (!["open", "noticed", "resolved"].includes(status)) {
//     return res.status(400).json({ message: "Invalid status" });
//   }

//   try {
//     const hostel = await Hostel.findOneAndUpdate(
//       { "complaints._id": complaintId },
//       { $set: { "complaints.$.status": status } },
//       { new: true }
//     );

//     if (!hostel) {
//       return res.status(404).json({ message: "Complaint not found" });
//     }

//     res.status(200).json({ message: `Complaint status updated to ${status}` });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const deleteComplaint = async (req, res) => {
//   const { complaintId } = req.params;
//   try {
//     const hostel = await Hostel.findOne({
//       owner: req.user.profileId,
//       "complaints._id": complaintId,
//     });

//     if (!hostel) {
//       return res
//         .status(404)
//         .json({ message: "Complaint not found or you're not authorized" });
//     }

//     const complaint = hostel.complaints.id(complaintId);

//     if (!complaint) {
//       return res.status(404).json({ message: "Complaint not found" });
//     }

//     if (complaint.status !== "resolved") {
//       return res
//         .status(400)
//         .json({ message: "Complaint must be resolved before deletion" });
//     }

//     hostel.complaints.pull(complaintId);
//     await hostel.save();

//     res.status(200).json({ message: "Complaint deleted successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// // visting student
// export const getPendingVisits = async (req, res) => {
//   try {
//     const hostel = await Hostel.findById(req.params.hostelId).populate({
//       path: "pendingVisits.student",
//       select: "name email",
//     });

//     if (!hostel) {
//       return res.status(404).json({ message: "Hostel not found" });
//     }

//     const pendingVisits = hostel.pendingVisits.filter((visit) =>
//       ["pending", "accepted", "not_interested"].includes(visit.status)
//     );

//     res.status(200).json(pendingVisits);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const respondToVisitRequest = async (req, res) => {
//   const { hostelId, studentId, response } = req.body;

//   try {
//     const hostel = await Hostel.findById(hostelId);
//     const student = await Student.findById(studentId);

//     if (!hostel || !student) {
//       return res.status(404).json({ message: "Hostel or student not found" });
//     }

//     const visitIndex = hostel.pendingVisits.findIndex(
//       (visit) => visit.student.toString() === studentId
//     );

//     if (visitIndex === -1) {
//       return res.status(404).json({ message: "Visit request not found" });
//     }

//     const visit = hostel.pendingVisits[visitIndex];
//     const studentVisit = student.hostelVisits.find(
//       (v) => v.hostel.toString() === hostelId && v.status === "pending"
//     );

//     if (response === "accept") {
//       studentVisit.status = "accepted";
//     } else if (response === "reject") {
//       studentVisit.status = "rejected";
//     }

//     hostel.pendingVisits.splice(visitIndex, 1);

//     await hostel.save();
//     await student.save();

//     // Find the user associated with the student
//     const user = await User.findOne({ profileId: studentId });

//     if (user) {
//       // Create nodemailer transporter
//       const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         secure: false,
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       // Define email options
//       const mailOptions = {
//         to: user.email,
//         from: "noreply@stayhomehostels.com",
//         subject: `Stay Home Hostels Visit Request ${
//           response === "accept" ? "Accepted" : "Rejected"
//         }`,
//         text: `Your visit request to ${hostel.name} has been ${
//           response === "accept" ? "accepted" : "rejected"
//         }.`,
//       };

//       // Send email
//       await transporter.sendMail(mailOptions);
//     }

//     res.status(200).json({ message: `Visit request ${response}ed` });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };

// export const markVisitCompleted = async (req, res) => {
//   const { hostelId, studentId } = req.body;

//   try {
//     console.log(
//       `Attempting to mark visit as completed for student ${studentId} and hostel ${hostelId}`
//     );

//     const student = await Student.findById(studentId);

//     if (!student) {
//       console.log(`Student with ID ${studentId} not found`);
//       return res.status(404).json({ message: "Student not found" });
//     }

//     console.log(`Student found: ${student.name}`);
//     console.log(`Hostel visits: ${JSON.stringify(student.hostelVisits)}`);

//     const visitIndex = student.hostelVisits.findIndex(
//       (v) =>
//         v.hostel.equals(new mongoose.Types.ObjectId(hostelId)) &&
//         v.status === "accepted"
//     );

//     if (visitIndex === -1) {
//       console.log(`No accepted visit found for hostel ${hostelId}`);
//       return res.status(404).json({ message: "Accepted visit not found" });
//     }

//     console.log(`Found accepted visit at index ${visitIndex}`);

//     const result = await Student.updateOne(
//       {
//         _id: studentId,
//         "hostelVisits._id": student.hostelVisits[visitIndex]._id,
//       },
//       { $set: { "hostelVisits.$.status": "completed" } }
//     );

//     console.log(`Update result: ${JSON.stringify(result)}`);

//     if (result.modifiedCount === 0) {
//       console.log("Failed to update visit status");
//       return res.status(400).json({ message: "Failed to update visit status" });
//     }

//     // Find the user associated with the student
//     const user = await User.findOne({ profileId: studentId });

//     if (user) {
//       // Get hostel details
//       const hostel = await Hostel.findById(hostelId);

//       // Create nodemailer transporter
//       const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         secure: false,
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       // Define email options
//       const mailOptions = {
//         to: user.email,
//         from: "noreply@stayhomehostels.com",
//         subject: "Stay Home Hostels Visit Completed",
//         text: `Dear ${student.name},

// We hope you enjoyed your visit to ${hostel.name}!

// Your visit has been marked as completed. We'd love to hear about your experience. Please take a moment to rate your stay and provide any feedback you may have.

// If you have any questions or need further assistance, please don't hesitate to contact us.

// Thank you for choosing Stay Home Hostels!

// Best regards,
// The Stay Home Hostels Team`,
//       };

//       // Send email
//       await transporter.sendMail(mailOptions);
//       console.log(`Completion email sent to ${user.email}`);
//     }

//     res.status(200).json({ message: "Visit marked as completed" });
//   } catch (error) {
//     console.error("Error in markVisitCompleted:", error);
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// };
