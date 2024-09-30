import axios from "axios";
import { describe, it } from "mocha";
import { expect } from "chai";

const baseUrl = "https://hostelbackend-tzrj.onrender.com/api/auth";

describe("User API Tests", () => {
  let userId;

  afterEach(async () => {
    if (userId) {
      await axios.post(`${baseUrl}/delete`, { _id: userId });
    }
  });

  it("should create a user successfully", async () => {
    const userData = {
      email: `user${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: "1234",
      roleName: "student",
      name: "John Doe",
      number: "123-456-7890",
      class: "10th",
      year: "2023",
      school: "Example School",
      city: "Example City",
      address: "123 Example St",
    };

    try {
      const response = await axios.post(`${baseUrl}/register`, userData);
      expect(response.status).to.be.oneOf([200, 201]);
      expect(response.data).to.be.an("object");
      expect(response.data.message).to.include("registered successfully");
      //userId = response.data.data._id;
    } catch (error) {
      throw error;
    }
  });

  it("should return an error for missing required fields", async () => {
    const incompleteUserData = {
      email: "incomplete@example.com",
      // Missing required fields like password, roleName, etc.
    };

    try {
      await axios.post(`${baseUrl}/register`, incompleteUserData);
    } catch (error) {
      if (error.response) {
        expect(error.response.status).to.equal(400); // Bad Request
        expect(error.response.data.message).to.be.a("string");
      } else {
        console.error("No response from the server:", error.message);
      }
    }
  });

  it("should return an error for duplicate user email", async () => {
    const duplicateUserData = {
      email: "duplicate@example.com",
      password: "1234",
      roleName: "student",
      name: "Jane Doe",
      number: "987-654-3210",
    };

    try {
      // First, create a user
      await axios.post(`${baseUrl}/register`, duplicateUserData);

      // Then, try to create another user with the same email
      await axios.post(`${baseUrl}/register`, duplicateUserData);
    } catch (error) {
      if (error.response) {
        expect(error.response.status).to.equal(409); // Conflict
        expect(error.response.data.message).to.include("Email already exists");
      } else {
        console.error("No response from the server:", error.message);
      }
    }
  });
});
