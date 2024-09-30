import Student from "../models/studentModel.js";
import bcrypt from "bcryptjs";

import Hostel from "../models/hostelModel.js";
import User from "../models/userModal.js";

import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();
export const getPassportPhoto = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.passportPhoto) {
      return res.status(404).send("No photo found");
    }
    res.set("Content-Type", student.passportPhoto.contentType);
    res.send(student.passportPhoto.data);
  } catch (error) {
    res.status(500).send("Error retrieving photo");
  }
};

export const getStudentById = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Find the student by ID
    const student = await Student.findById(studentId)
      .populate({
        path: "wishlist",
        select: "name address hostelType beds food verified images",
      })
      .populate({
        path: "hostelVisits.hostel",
        select: "name address hostelType beds food verified images",
      })
      .populate("admittedHostel");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Convert the Mongoose document to a plain JavaScript object
    const studentObj = student.toObject();

    // Find the user by profileId
    const user = await User.findOne({ profileId: studentId });

    if (user) {
      // Add the user's email to the student object if the user is found
      studentObj.email = user.email;
    }

    res.status(200).json(studentObj);
  } catch (error) {
    console.error("Error in getStudentById:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getWishlistByStudentId = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId).populate("wishlist");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student.wishlist);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  const { hostelId } = req.body;
  try {
    if (!req.user || !req.user.profileId) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    console.log("Searching for student with profileId:", req.user.profileId);
    const student = await Student.findById(req.user.profileId);
    console.log("Found student:", student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.wishlistSubmitted) {
      return res.status(400).json({
        message: "Wishlist is already submitted and cannot be modified",
      });
    }
    if (student.wishlist.length >= 5) {
      return res
        .status(400)
        .json({ message: "Wishlist can't exceed 5 hostels" });
    }
    if (student.wishlist.includes(hostelId)) {
      return res.status(400).json({ message: "Hostel already in wishlist" });
    }
    student.wishlist.push(hostelId);
    await student.save();
    res.status(200).json({
      message: "Hostel added to wishlist",
      wishlist: student.wishlist,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  const { hostelId } = req.body;
  try {
    if (!req.user || !req.user.profileId) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    console.log("Searching for student with profileId:", req.user.profileId);
    const student = await Student.findById(req.user.profileId);
    if (student.wishlistSubmitted) {
      return res.status(400).json({
        message: "Wishlist is already submitted and cannot be modified",
      });
    }
    student.wishlist = student.wishlist.filter(
      (id) => id.toString() !== hostelId
    );
    await student.save();
    res.status(200).json({
      message: "Hostel removed from wishlist",
      wishlist: student.wishlist,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const submitWishlist = async (req, res) => {
  try {
    const student = await Student.findById(req.user.profileId);
    if (student.wishlist.length === 0) {
      return res.status(400).json({ message: "Wishlist is empty" });
    }
    if (student.wishlistSubmitted) {
      return res.status(400).json({ message: "Wishlist is already submitted" });
    }
    student.wishlistSubmitted = true;
    await student.save();
    res.status(200).json({ message: "Wishlist submitted for review" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const takeAdmission = async (req, res) => {
  const { hostelId } = req.body;
  try {
    const student = await Student.findById(req.user.profileId);
    if (!student.wishlistApproved) {
      return res
        .status(400)
        .json({ message: "Wishlist must be approved before taking admission" });
    }
    student.admittedHostel = hostelId;
    await student.save();
    res.status(200).json({ message: "Admission taken successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateStudentProfile = async (req, res) => {
  const {
    name,
    number,
    email,
    class: studentClass,
    year,
    school,
    college,
    city,
    address,
    password,
  } = req.body;

  const { profileId } = req.params;

  try {
    // Find the student by profileId
    const existingStudent = await Student.findById(profileId);
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updateData = {
      name,
      number,
      email,
      class: studentClass,
      year,
      school,
      college,
      city,
      address,
    };

    // Handle passport photo if provided
    if (
      req.files &&
      req.files.passportPhoto &&
      req.files.passportPhoto.length > 0
    ) {
      updateData.passportPhoto = {
        data: req.files.passportPhoto[0].buffer,
        contentType: req.files.passportPhoto[0].mimetype,
      };
    }

    // Update the student profile
    const updatedStudent = await Student.findByIdAndUpdate(
      profileId,
      updateData,
      { new: true, runValidators: true }
    );

    const user = await User.findOne({ profileId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's email
    await User.findByIdAndUpdate(user._id, { email });

    // Update the user's password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.findByIdAndUpdate(user._id, { password: hashedPassword });

      console.log(`Password updated for user ${user._id}`);
    }

    res.status(200).json({
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const uploadAdmissionReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const student = await Student.findById(req.user.profileId);
    student.admissionReceipt = req.file.path;
    await student.save();
    res
      .status(200)
      .json({ message: "Admission receipt uploaded successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const submitHostelFeedback = async (req, res) => {
  const { hostelId, rating, comment } = req.body;
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    console.log(req.user.profileId);
    hostel.feedback.push({
      student: req.user.profileId,
      rating,
      comment,
      date: new Date(),
    });

    await hostel.save();
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const submitComplaint = async (req, res) => {
  const { hostelId, description, isAnonymous, complaintType } = req.body;

  try {
    // Find the student submitting the complaint
    const student = await Student.findById(req.user.profileId);

    if (!student.admittedHostel) {
      return res.status(400).json({
        message: "You must be admitted to a hostel to submit a complaint",
      });
    }

    // Find the hostel associated with the complaint
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Validate the complaint type
    const validComplaintTypes = [
      "Rooms",
      "Washroom",
      "Wi-Fi",
      "Cleanliness",
      "Food",
    ];
    if (!validComplaintTypes.includes(complaintType)) {
      return res.status(400).json({ message: "Invalid complaint type" });
    }

    // Create a new complaint document
    const complaint = {
      student: student._id,
      description,
      isAnonymous,
      complaintType,
      images: req.files
        ? req.files.map((file) => ({
            data: file.buffer,
            contentType: file.mimetype,
          }))
        : [],
      status: "open",
    };

    // Associate the complaint with the student
    student.complaints.push(complaint._id);
    await student.save();

    // Associate the complaint with the hostel
    hostel.complaints.push(complaint);
    await hostel.save();

    res.status(200).json({ message: "Complaint submitted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getStudentComplaints = async (req, res) => {
  try {
    // Assuming you have the student's ID from authentication
    const { studentId } = req.params;

    console.log("studnetId", studentId);
    // Find the student and populate the admitted hostel
    const student = await Student.findById(studentId).populate(
      "admittedHostel"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.admittedHostel) {
      return res
        .status(404)
        .json({ message: "Student is not admitted to any hostel" });
    }

    // Find the hostel and filter complaints for this student
    const hostel = await Hostel.findById(student.admittedHostel._id);

    const studentComplaints = hostel.complaints.filter(
      (complaint) => complaint.student.toString() === studentId.toString()
    );

    res.status(200).json(studentComplaints);
  } catch (error) {
    console.error("Error fetching student complaints:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotInterested = async (req, res) => {
  const { hostelId } = req.body;
  const studentId = req.user.profileId;

  if (!hostelId) {
    return res.status(400).json({ message: "Hostel ID is required" });
  }

  try {
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove the hostel visit
    student.hostelVisits = student.hostelVisits.filter(
      (visit) => visit.hostel && visit.hostel.toString() !== hostelId
    );

    // Remove the hostel from the wishlist
    student.wishlist = student.wishlist.filter(
      (id) => id && id.toString() !== hostelId
    );

    // Check if there are any remaining hostel visits
    if (student.hostelVisits.length === 0) {
      student.wishlistSubmitted = false;
      student.wishlistApproved = false;
    }

    await student.save();

    // Find the hostel and its owner
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const owner = await Owner.findOne({ hostels: hostelId });
    if (!owner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }

    // Find the owner's user account to get their email
    const ownerUser = await User.findOne({ profileId: owner._id });
    if (!ownerUser) {
      return res.status(404).json({ message: "Owner user account not found" });
    }

    // Send email to the hostel owner
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
      to: ownerUser.email,
      from: "noreply@stayhomehostels.com",
      subject: "Stay Home Hostels - Student Not Interested",
      text: `Dear ${owner.name},

We regret to inform you that a student has marked your hostel "${hostel.name}" as not interested.

This means the hostel has been removed from their wishlist and they will not be considering it for their stay.

While this may be disappointing, it's an opportunity to review your hostel's offerings and consider ways to make it more appealing to future students.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Stay Home Hostels Team`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message:
        "Marked as not interested, removed from wishlist, and owner notified",
    });
  } catch (error) {
    console.error("Error in markNotInterested:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const requestOrUpdateHostelVisit = async (req, res) => {
  const { hostelId, visitDate, visitTime, studentEmail } = req.body;
  const studentId = req.user.profileId;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if a visit already exists for this hostel
    const existingVisitIndex = student.hostelVisits.findIndex(
      (visit) => visit.hostel && visit.hostel.toString() === hostelId
    );

    if (existingVisitIndex !== -1) {
      // Update existing visit
      student.hostelVisits[existingVisitIndex] = {
        ...student.hostelVisits[existingVisitIndex],
        visitDate,
        visitTime,
        status: "pending",
      };
    } else {
      // Add new visit
      student.hostelVisits.push({
        hostel: hostelId,
        visitDate,
        visitTime,
        status: "pending",
      });
    }

    // Update or add pending visit in hostel
    const existingPendingVisitIndex = hostel.pendingVisits.findIndex(
      (visit) => visit.student && visit.student.toString() === studentId
    );

    if (existingPendingVisitIndex !== -1) {
      hostel.pendingVisits[existingPendingVisitIndex] = {
        ...hostel.pendingVisits[existingPendingVisitIndex],
        visitDate,
        visitTime,
        studentEmail,
      };
    } else {
      hostel.pendingVisits.push({
        student: studentId,
        visitDate,
        visitTime,
        studentEmail,
      });
    }

    await student.save();
    await hostel.save();

    // Find the hostel owner
    const owner = await Owner.findOne({ hostels: hostelId });
    if (!owner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }

    // Find the owner's user account to get their email
    const ownerUser = await User.findOne({ profileId: owner._id });
    if (!ownerUser) {
      return res.status(404).json({ message: "Owner user account not found" });
    }

    // Send email to the hostel owner
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
      to: ownerUser.email,
      from: "noreply@stayhomehostels.com",
      subject: "New Hostel Visit Request",
      text: `Dear ${owner.name},

A new visit request has been received for your hostel "${hostel.name}".

Visit Details:
- Hostel ID: ${hostelId}
- Visit Date: ${visitDate}
- Visit Time: ${visitTime}
- Student Email: ${studentEmail}

Please review this request and respond accordingly through your hostel management dashboard.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Stay Home Hostels Team`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Visit request sent successfully and owner notified" });
  } catch (error) {
    console.error("Error in requestOrUpdateHostelVisit:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
