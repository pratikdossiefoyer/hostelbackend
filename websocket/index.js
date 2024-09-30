import { Server } from "socket.io";
import User from "../models/userModal.js";
import Hostel from "../models/hostelModel.js";

export const setupWebSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("New WebSocket connection");

    socket.on("search", async (query) => {
      const regex = new RegExp(query, "i");

      const users = await User.find({
        $or: [{ email: regex }, { role: regex }],
      }).select("-password");

      const hostels = await Hostel.find({
        $or: [{ name: regex }, { address: regex }, { hostelType: regex }],
      });

      socket.emit("searchResults", { users, hostels });
    });
  });
};
