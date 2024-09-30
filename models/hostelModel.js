import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  date: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  description: String,
  isAnonymous: Boolean,
  images: [
    {
      data: Buffer,
      contentType: String,
    },
  ],
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["open", "noticed", "resolved"],
    default: "open",
  },
  complaintType: {
    type: String,
    enum: ["Rooms", "Washroom", "Wi-Fi", "Cleanliness", "Food"],
    required: false,
  },
});

const rentStructureSchema = new mongoose.Schema({
  studentsPerRoom: { type: Number, required: true },
  rentPerStudent: { type: Number, required: true },
});

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
  registerDate: { type: Date, default: Date.now },
  number: { type: String, required: true },
  address: { type: String, required: true },
  hostelType: {
    type: String,
    enum: ["boys", "girls"],
    required: true,
  },
  beds: { type: Number, required: true },
  studentsPerRoom: { type: Number, required: true },
  food: {
    type: Boolean,
    default: false,
  },
  foodType: {
    type: String,
    enum: ["veg", "nonveg", "both"],
    required: function () {
      return this.food === true;
    },
  },
  mealOptions: {
    type: [String],
    enum: ["breakfast", "lunch", "dinner", "all"],
    validate: {
      validator: function (v) {
        if (!this.food) return true;
        if (v.includes("all")) return v.length === 1;
        return (
          v.length > 0 &&
          v.length <= 3 &&
          v.every((option) => ["breakfast", "lunch", "dinner"].includes(option))
        );
      },
      message:
        "At least one meal option must be selected when food is provided",
    },
  },
  images: [
    {
      data: Buffer,
      contentType: String,
    },
  ],
  wifi: { type: Boolean, default: false },
  ac: { type: Boolean, default: false },
  mess: { type: Boolean, default: false },
  solar: { type: Boolean, default: false },
  studyRoom: { type: Boolean, default: false },
  tuition: { type: Boolean, default: false },
  kitchenType: {
    type: String,
    enum: ["inHouse", "Outsourced", "Not available"],
  },
  verified: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  pendingVisits: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
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
  rentStructure: [rentStructureSchema],
  feedback: [feedbackSchema],
  complaints: [complaintSchema],
});

hostelSchema.index({ owner: 1 });
hostelSchema.index({ name: 1 });

const Hostel = mongoose.model("Hostel", hostelSchema);

export default Hostel;
