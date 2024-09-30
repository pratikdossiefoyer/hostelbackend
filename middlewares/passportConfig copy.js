import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModal.js";
import Role from "../models/roleModel.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Student from "../models/studentModel.js";
import Owner from "../models/ownerModel.js";

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables"
  );
  process.exit(1);
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let roleId;
        if (req.query.state) {
          try {
            const decodedState = JSON.parse(atob(req.query.state));
            roleId = decodedState.roleId;
          } catch (error) {
            console.error("Error parsing state:", error);
          }
        }

        console.log("Received roleId:", roleId);

        let user = await User.findOne({
          email: profile.emails[0].value,
        }).populate("role");

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        } else {
          if (!roleId) {
            console.error("No role ID provided");
            return done(new Error("No role selected"));
          }

          const role = await Role.findById(roleId);
          if (!role) {
            console.error("Invalid role ID:", roleId);
            return done(new Error("Invalid role selected"));
          }

          console.log("Found role:", role.name);

          let profileDoc;
          if (role.name === "student") {
            profileDoc = new Student({ name: profile.displayName });
          } else if (role.name === "hostelOwner") {
            profileDoc = new Owner({ name: profile.displayName });
          } else {
            console.error("Unexpected role name:", role.name);
            return done(new Error("Unexpected role type"));
          }
          await profileDoc.save();

          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            role: role._id,
            profileId: profileDoc._id,
          });
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        console.error("Error in Google Strategy:", error);
        return done(error);
      }
    }
  )
);

export default passport;
