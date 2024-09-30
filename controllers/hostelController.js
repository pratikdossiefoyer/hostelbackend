import Owner from "../models/ownerModel.js";
import Hostel from "../models/hostelModel.js";
import User from "../models/userModal.js";
import Student from "../models/studentModel.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import multer from "multer";

import dotenv from "dotenv";
dotenv.config();

export const updateOwnerProfile = async (req, res) => {
  const { name, number, email, address, password } = req.body;
  const { profileId } = req.params;

  try {
    const existingOwner = await Owner.findById(profileId);
    if (!existingOwner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const updateData = {
      name,
      number,
      email,
      address,
    };

    if (req.files && req.files.idProof && req.files.idProof.length > 0) {
      updateData.idProof = {
        data: req.files.idProof[0].buffer,
        contentType: req.files.idProof[0].mimetype,
      };
    }

    const updatedOwner = await Owner.findByIdAndUpdate(profileId, updateData, {
      new: true,
      runValidators: true,
    });

    if (email || password) {
      const user = await User.findOne({ profileId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (email) user.email = email;

      if (password) {
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);
        user.password = password;
        console.log(`Password updated for user ${user._id}`);
      }

      await user.save();
    }

    res.status(200).json({
      message: "Profile updated successfully",
      owner: updatedOwner,
    });
  } catch (error) {
    console.error("Error updating owner profile:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const removeHostel = async (req, res) => {
  const { hostelId } = req.params;

  try {
    // Find the hostel by ID
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if any students are admitted to the hostel
    const studentsAdmitted = await Student.find({ admittedHostel: hostelId });

    // If students are admitted, prevent deletion
    if (studentsAdmitted.length > 0) {
      return res.status(403).json({
        message: "Hostel cannot be deleted because students are admitted.",
      });
    }

    // If no students are admitted, delete the hostel
    await Hostel.deleteOne({ _id: hostelId });

    // Remove hostel reference from the owner's hostel list
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

export const getAllHostelsWithOwnerDetails = async (req, res) => {
  try {
    const hostelsWithOwners = await Hostel.aggregate([
      {
        $lookup: {
          from: "owners",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      {
        $unwind: "$ownerDetails",
      },
      {
        $project: {
          "ownerDetails.password": 0,
        },
      },
    ]);

    if (hostelsWithOwners.length === 0) {
      return res.status(404).json({ message: "No hostels found" });
    }

    res.status(200).json(hostelsWithOwners);
  } catch (error) {
    console.error("Error in getAllHostelsWithOwnerDetails:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
};

export const addHostel = async (req, res) => {
  const {
    name,
    number,
    address,
    hostelType,
    beds,
    studentsPerRoom,
    food,
    foodType,
    mealOptions,
    rentStructure,
    wifi,
    ac,
    mess,
    solar,
    studyRoom,
    tuition,
    kitchenType,
  } = req.body;

  try {
    let processedMealOptions = [];
    let processedFoodType = null;

    if (food === true || food === "true") {
      // Process meal options
      if (Array.isArray(mealOptions)) {
        processedMealOptions = mealOptions;
      } else if (typeof mealOptions === "string") {
        processedMealOptions = JSON.parse(mealOptions);
      }

      if (processedMealOptions.includes("all")) {
        processedMealOptions = ["all"];
      }

      // Process food type
      processedFoodType = foodType;
    }

    const newHostel = new Hostel({
      name,
      owner: req.user.profileId,
      number,
      address,
      hostelType,
      beds: parseInt(beds),
      studentsPerRoom: parseInt(studentsPerRoom),
      food: food === true || food === "true",
      foodType: processedFoodType,
      mealOptions: processedMealOptions,
      images: req.files
        ? req.files.map((file) => ({
            data: file.buffer,
            contentType: file.mimetype,
          }))
        : [],
      rentStructure: JSON.parse(rentStructure).map((item) => ({
        studentsPerRoom: parseInt(item.studentsPerRoom),
        rentPerStudent: parseFloat(item.rentPerStudent),
      })),
      wifi: wifi === true || wifi === "true",
      ac: ac === true || ac === "true",
      mess: mess === true || mess === "true",
      solar: solar === true || solar === "true",
      studyRoom: studyRoom === true || studyRoom === "true",
      tuition: tuition === true || tuition === "true",
      kitchenType,
      verified: false, // Always set to false initially
    });

    const savedHostel = await newHostel.save();

    await Owner.findByIdAndUpdate(req.user.profileId, {
      $push: { hostels: savedHostel._id },
    });

    res.status(201).json({
      message: "Hostel added successfully",
      hostel: savedHostel,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
}).array("images", 10); // Change 'newImages' to 'images'

export const updateHostelDetails = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: "Multer error", error: err.message });
    } else if (err) {
      return res
        .status(400)
        .json({ message: "Unknown error", error: err.message });
    }

    try {
      const {
        hostelId,
        rentStructure,
        foodType,
        mealOptions,
        food,
        wifi,
        solar,
        mess,
        studyRoom,
        tuition,
        kitchenType,
        existingImages,
        ...updateData
      } = req.body;

      const hostel = await Hostel.findById(hostelId);
      if (!hostel) {
        return res.status(404).json({ message: "Hostel not found" });
      }

      // Handle existing images
      let updatedImages = hostel.images;
      if (existingImages) {
        const existingImageIds = JSON.parse(existingImages);
        updatedImages = updatedImages.filter((img) =>
          existingImageIds.includes(img._id.toString())
        );
      }

      // Handle new images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => ({
          data: file.buffer,
          contentType: file.mimetype,
        }));
        updatedImages = [...updatedImages, ...newImages];
      }

      // Parse rent structure
      const parsedRentStructure =
        typeof rentStructure === "string"
          ? JSON.parse(rentStructure)
          : rentStructure;

      // Process meal options and food type
      let processedMealOptions = [];
      let processedFoodType = null;
      if (food === true || food === "true") {
        processedMealOptions = Array.isArray(mealOptions)
          ? mealOptions
          : typeof mealOptions === "string"
          ? JSON.parse(mealOptions)
          : [];

        if (processedMealOptions.includes("all")) {
          processedMealOptions = ["all"];
        }
        processedFoodType = foodType;
      }

      const updatedHostel = await Hostel.findByIdAndUpdate(
        hostelId,
        {
          $set: {
            ...updateData,
            images: updatedImages,
            rentStructure: parsedRentStructure,
            food: food === true || food === "true",
            foodType: processedFoodType,
            mealOptions: processedMealOptions,
            wifi: wifi === true || wifi === "true",
            ac: updateData.ac === true || updateData.ac === "true",
            mess: mess === true || mess === "true",
            solar: solar === true || solar === "true",
            studyRoom: studyRoom === true || studyRoom === "true",
            tuition: tuition === true || tuition === "true",
            kitchenType,
          },
        },
        { new: true, runValidators: true }
      );

      res.json(updatedHostel);
    } catch (error) {
      console.error("Error updating hostel:", error);
      res
        .status(500)
        .json({ message: "Error updating hostel", error: error.message });
    }
  });
};

export const getHostelById = async (req, res) => {
  const { id } = req.params;
  try {
    const hostel = await Hostel.findById(id).populate({
      path: "owner",
      select: "-password",
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const ownerWithHostels = await Owner.findById(hostel.owner.profileId)
      .select("-password")
      .populate("hostels", "name address hostelType beds");

    const response = {
      hostel: {
        profileId: hostel.profileId,
        name: hostel.name,
        number: hostel.number,
        address: hostel.address,
        hostelType: hostel.hostelType,
        beds: hostel.beds,
        studentsPerRoom: hostel.studentsPerRoom,
        food: hostel.food,
        foodType: hostel.foodType,
        mealOptions: hostel.mealOptions,
        images: hostel.images,
        verified: hostel.verified,
        paymentStatus: hostel.paymentStatus,
        registerDate: hostel.registerDate,
        wifi: hostel.wifi,
        ac: hostel.ac,
        mess: hostel.mess,
        solar: hostel.solar,
        studyRoom: hostel.studyRoom,
        tuition: hostel.tuition,
        kitchenType: hostel.kitchenType,
        pendingVisits: hostel.pendingVisits,
        rentStructure: hostel.rentStructure,
        feedback: hostel.feedback,
        complaints: hostel.complaints,
      },
      owner: {
        profileId: ownerWithHostels.profileId,
        name: ownerWithHostels.name,
        email: ownerWithHostels.email,
        number: ownerWithHostels.number,
        address: ownerWithHostels.address,
        hostels: ownerWithHostels.hostels,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getOwnerById = async (req, res) => {
  const ownerId = req.params.id;
  try {
    const owner = await Owner.findById(ownerId).select("-password").populate({
      path: "hostels",
      select: "name address hostelType beds",
    });

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const response = {
      owner: {
        profileId: owner.profileId,
        name: owner.name,
        email: owner.email,
        number: owner.number,
        address: owner.address,
        hostels: owner.hostels,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getHostelWishlistStudents = async (req, res) => {
  const { hostelId } = req.params;
  try {
    const students = await Student.find({ wishlist: hostelId }).select(
      "-password -wishlist -admissionReceipt"
    );
    res.status(200).json(students);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const getAdmittedStudents = async (req, res) => {
  const { hostelId } = req.params;
  const ownerId = req.user.profileId;

  try {
    const hostel = await Hostel.findOne({ _id: hostelId, owner: ownerId });

    if (!hostel) {
      return res.status(404).json({
        message:
          "Hostel not found or you're not authorized to access this data",
      });
    }
    console.log("hostelid", hostelId);
    const students = await Student.find({
      admittedHostel: hostelId,
    }).select("-complaints -wishlist -passportPhoto");

    console.log("student", students);
    const studentsWithReceipts = await Promise.all(
      students.map(async (student) => {
        if (student.admitReceipt) {
          const receiptBuffer = await fs.promises.readFile(
            student.admitReceipt
          );
          const binaryReceipt = receiptBuffer.toString("base64");
          return { ...student.toObject(), binaryAdmitReceipt: binaryReceipt };
        }
        return student.toObject();
      })
    );

    const hostelWithStudents = {
      _id: hostel._id,
      name: hostel.name,
      admittedStudents: studentsWithReceipts,
      totalAdmittedStudents: studentsWithReceipts.length,
    };

    if (studentsWithReceipts.length === 0) {
      hostelWithStudents.message =
        "No admitted students found for this hostel.";
    }

    res.status(200).json(hostelWithStudents);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const applyCashback = async (req, res) => {
  const { studentId, hostelId } = req.body;
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    if (hostel.owner.toString() !== req.user.profileId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to apply cashback for this hostel" });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (student.cashbackApplied) {
      return res.status(400).json({ message: "Cashback already applied" });
    }
    student.cashbackApplied = true;
    await student.save();
    res.status(200).json({ message: "Cashback applied successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

//get hostal images
export const getPhotos = async (req, res) => {
  try {
    const hostelId = req.params.id;
    const hostel = await Hostel.findById(hostelId);

    if (!hostel || !hostel.images || hostel.images.length === 0) {
      return res.status(404).send("No photos found");
    }

    const imagesBase64 = hostel.images.map((image) => ({
      contentType: image.contentType,
      data: image.data.toString("base64"),
    }));

    res.json(imagesBase64);
  } catch (error) {
    res.status(500).send("Error retrieving photos");
  }
};
// get Idproof
export const getIdproofPhoto = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner || !owner.idProof) {
      return res.status(404).send("No photo found");
    }
    res.set("Content-Type", owner.idProof.contentType);
    res.send(owner.idProof.data);
  } catch (error) {
    res.status(500).send("Error retrieving photo");
  }
};

// complaints
export const getHostelComplaints = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.hostelId).populate({
      path: "complaints.student",
      select: "name -_id",
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const complaints = hostel.complaints.map((complaint) => ({
      ...complaint.toObject(),
      studentName: complaint.isAnonymous ? "Anonymous" : complaint.student.name,
      images: complaint.images.map((image) => ({
        contentType: image.contentType,
        data: image.data.toString("base64"),
      })),
    }));

    const complaintStats = {
      total: complaints.length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      open: complaints.filter((c) => c.status === "open").length,
    };

    res.status(200).json({ complaints, stats: complaintStats });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  const { complaintId } = req.params;
  const { status } = req.body;

  if (!["open", "noticed", "resolved"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const hostel = await Hostel.findOneAndUpdate(
      { "complaints._id": complaintId },
      { $set: { "complaints.$.status": status } },
      { new: true }
    );

    if (!hostel) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.status(200).json({ message: `Complaint status updated to ${status}` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const deleteComplaint = async (req, res) => {
  const { complaintId } = req.params;
  try {
    const hostel = await Hostel.findOne({
      owner: req.user.profileId,
      "complaints._id": complaintId,
    });

    if (!hostel) {
      return res
        .status(404)
        .json({ message: "Complaint not found or you're not authorized" });
    }

    const complaint = hostel.complaints.id(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status !== "resolved") {
      return res
        .status(400)
        .json({ message: "Complaint must be resolved before deletion" });
    }

    hostel.complaints.pull(complaintId);
    await hostel.save();

    res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

// visting student
export const getPendingVisits = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.hostelId)
      .populate({
        path: "pendingVisits.student",
        select:
          "name email number class year school college city address passportPhoto",
      })
      .lean();

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const pendingVisits = hostel.pendingVisits.filter((visit) => {
      // Check if status exists, if not, assume it's pending
      const status = visit.status || "pending";

      return ["pending", "accepted", "not_interested"].includes(status);
    });

    console.log(
      "Filtered pendingVisits:",
      JSON.stringify(pendingVisits, null, 2)
    );

    const formattedVisits = pendingVisits.map((visit) => ({
      ...visit,
      status: visit.status || "pending", // Ensure status is set
      hostelName: hostel.name,
      hostelAddress: hostel.address,
      hostelType: hostel.hostelType,
      hostelBeds: hostel.beds,
      hostelStudentsPerRoom: hostel.studentsPerRoom,
      hostelFood: hostel.food,
      hostelImages: hostel.images
        ? hostel.images.map((img) => ({
            contentType: img.contentType,
            data: img.data ? img.data.toString("base64") : null,
          }))
        : [],
    }));

    res.status(200).json(formattedVisits);
  } catch (error) {
    console.error("Error in getPendingVisits:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const respondToVisitRequest = async (req, res) => {
  const { hostelId, studentId, response } = req.body;

  try {
    const hostel = await Hostel.findById(hostelId);
    const student = await Student.findById(studentId);

    if (!hostel || !student) {
      return res.status(404).json({ message: "Hostel or student not found" });
    }

    // Ensure hostel.pendingVisits is an array
    if (!Array.isArray(hostel.pendingVisits)) {
      return res.status(400).json({ message: "Invalid hostel visit data" });
    }

    const visitIndex = hostel.pendingVisits.findIndex(
      (visit) => visit.student?.toString() === studentId
    );

    if (visitIndex === -1) {
      return res.status(404).json({ message: "Visit request not found" });
    }

    const visit = hostel.pendingVisits[visitIndex];

    // Ensure student.hostelVisits is an array
    if (!Array.isArray(student.hostelVisits)) {
      return res.status(400).json({ message: "Invalid student visit data" });
    }

    const studentVisit = student.hostelVisits.find(
      (v) => v.hostel?.toString() === hostelId && v.status === "pending"
    );

    if (!studentVisit) {
      return res
        .status(404)
        .json({ message: "Corresponding student visit not found" });
    }

    if (response === "accept") {
      studentVisit.status = "accepted";
    } else if (response === "reject") {
      studentVisit.status = "rejected";
    }

    hostel.pendingVisits.splice(visitIndex, 1);

    await hostel.save();
    await student.save();

    // Find the user associated with the student
    const user = await User.findOne({ profileId: studentId });

    if (user) {
      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Define email options
      const mailOptions = {
        to: user.email,
        from: "noreply@stayhomehostels.com",
        subject: `Stay Home Hostels Visit Request ${
          response === "accept" ? "Accepted" : "Rejected"
        }`,
        text: `Your visit request to ${hostel.name} has been ${
          response === "accept" ? "accepted" : "rejected"
        }.`,
      };

      // Send email
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: `Visit request ${response}ed` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const markVisitCompleted = async (req, res) => {
  const { hostelId, studentId } = req.body;

  try {
    console.log(
      `Attempting to mark visit as completed for student ${studentId} and hostel ${hostelId}`
    );

    const student = await Student.findById(studentId);

    if (!student) {
      console.log(`Student with ID ${studentId} not found`);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log(`Student found: ${student.name}`);
    console.log(`Hostel visits: ${JSON.stringify(student.hostelVisits)}`);

    const visitIndex = student.hostelVisits.findIndex(
      (v) =>
        v.hostel.equals(new mongoose.Types.ObjectId(hostelId)) &&
        v.status === "accepted"
    );

    if (visitIndex === -1) {
      console.log(`No accepted visit found for hostel ${hostelId}`);
      return res.status(404).json({ message: "Accepted visit not found" });
    }

    console.log(`Found accepted visit at index ${visitIndex}`);

    const result = await Student.updateOne(
      {
        _id: studentId,
        "hostelVisits._id": student.hostelVisits[visitIndex]._id,
      },
      { $set: { "hostelVisits.$.status": "completed" } }
    );

    console.log(`Update result: ${JSON.stringify(result)}`);

    if (result.modifiedCount === 0) {
      console.log("Failed to update visit status");
      return res.status(400).json({ message: "Failed to update visit status" });
    }

    // Find the user associated with the student
    const user = await User.findOne({ profileId: studentId });

    if (user) {
      // Get hostel details
      const hostel = await Hostel.findById(hostelId);

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Define email options
      const mailOptions = {
        to: user.email,
        from: "noreply@stayhomehostels.com",
        subject: "Stay Home Hostels Visit Completed",
        text: `Dear ${student.name},

We hope you enjoyed your visit to ${hostel.name}!

Your visit has been marked as completed. We'd love to hear about your experience. Please take a moment to rate your stay and provide any feedback you may have.

If you have any questions or need further assistance, please don't hesitate to contact us.

Thank you for choosing Stay Home Hostels!

Best regards,
The Stay Home Hostels Team`,
      };

      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`Completion email sent to ${user.email}`);
    }

    res.status(200).json({ message: "Visit marked as completed" });
  } catch (error) {
    console.error("Error in markVisitCompleted:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
