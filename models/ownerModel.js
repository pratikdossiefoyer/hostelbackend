import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: false },
  number: { type: String, required: false },
  address: { type: String, required: false },
  idProof: {
    data: Buffer,
    contentType: String,
  },
  hostels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" }],
});

const Owner = mongoose.model("Owner", ownerSchema);

export default Owner;
