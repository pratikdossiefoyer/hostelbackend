# Hostel Backend

## Overview

This is a robust backend system for a hostel management application, built with Node.js and Express. It uses MongoDB Atlas for database storage and includes email functionality.

## Features

- Express.js server
- MongoDB Atlas database integration
- JWT authentication
- Email notifications using Nodemailer
- Admin setup functionality

## Prerequisites

- Node.js (version 14 or higher recommended)
- MongoDB Atlas account
- MongoDB Compass (optional, for database visualization)

## Getting Started

1. Clone the repository:

   ```
   git clone [repository-url]
   cd [project-directory]
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following content:

   ```
   MONGODB_URI=mongodb+srv://pratik09092001:s4TmGg0OCJIfY7Cj@cluster0.otmde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=4565
   PORT=5000
   ADMIN_SETUP_KEY=pratik
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=pratikmane09092001@gmail.com
   EMAIL_PASS=zkxa cnta uciw dxkn
   ```

   Note: Make sure to keep your `.env` file secure and never commit it to version control.

4. Start the server:
   ```
   npm start
   ```

The server will start running on port 5000 as specified in the `.env` file.

## MongoDB Atlas and Compass Setup

1. MongoDB Atlas Connection:

   - The `MONGODB_URI` in your `.env` file is already set up to connect to your MongoDB Atlas cluster.
   - This URI includes your username, password, and cluster information.

2. Using MongoDB Compass:

   - Download and install MongoDB Compass from [https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
   - Open MongoDB Compass
   - Click on "New Connection"
   - In the URI field, paste your MongoDB connection string:
     ```
     mongodb+srv://pratik09092001:s4TmGg0OCJIfY7Cj@cluster0.otmde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Click "Connect"

   You should now be connected to your MongoDB Atlas cluster and able to view and manage your database through Compass.

## Available Scripts

- `npm start`: Starts the server

## Environment Variables Explanation

- `MONGODB_URI`: Connection string for MongoDB Atlas
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Port on which the server will run
- `ADMIN_SETUP_KEY`: Key for admin setup functionality
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: Configuration for email functionality using Gmail SMTP

## Important Notes

- Keep your `.env` file and MongoDB connection string secure.
- The current setup uses Gmail SMTP for sending emails. Make sure to use an app-specific password or configure your Gmail account to allow less secure apps if necessary.
- The `ADMIN_SETUP_KEY` is used for initial admin setup. Ensure this is kept secret and changed after initial setup.

## License

This project is licensed under the ISC License.

## Author

Dossifoyer

For any additional setup or configuration needs, please refer to the official documentation of the technologies used or contact the project maintainer.
