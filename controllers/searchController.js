// controllers/searchController.js
import User from "../models/userModel.js";
import Hostel from "../models/hostelModel.js";

export const search = async (req, res) => {
  try {
    const { query } = req.query;
    const regex = new RegExp(query, "i");

    const users = await User.find({
      $or: [{ email: regex }, { role: regex }],
    }).select("-password");

    const hostels = await Hostel.find({
      $or: [{ name: regex }, { address: regex }, { hostelType: regex }],
    });

    res.status(200).json({ users, hostels });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
