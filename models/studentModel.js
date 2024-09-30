import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: false },
  number: { type: String, required: false },
  parentnumber: { type: String, required: false },
  parentname: { type: String, required: false },
  class: { type: String, required: false },
  year: { type: String, required: false },
  school: { type: String },
  gender: { type: String, enum: ["male", "female", "other"], required: false },
  college: { type: String },
  city: { type: String, required: false },
  address: { type: String, required: false },
  passportPhoto: {
    data: Buffer,
    contentType: String,
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
  wishlistSubmitted: { type: Boolean, default: false },
  wishlistApproved: { type: Boolean, default: false },
  cashbackApplied: { type: Boolean, default: false },
  admittedHostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  admissionReceipt: {
    data: Buffer,
    contentType: String,
  },
  hostelVisits: [
    {
      hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
      visitDate: Date,
      visitTime: String,
      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "rejected",
          "completed",
          "not_interested",
        ],
        default: "pending",
      },
    },
  ],
  complaints: [
    {
      hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
      description: String,
      isAnonymous: Boolean,
      images: [
        {
          data: Buffer,
          contentType: String,
        },
      ],
      date: { type: Date, default: Date.now },
      noticed: { type: Boolean, default: false },
    },
  ],
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
