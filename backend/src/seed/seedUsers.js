import mongoose from "mongoose";
import User from "../models/User.js";

// $2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri = Bogamedithi123!

// const seeds = [
//   {
//     fullName: "Alice Johnson",
//     email: "alice@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Bob Smith",
//     email: "bob@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Charlie Brown",
//     email: "charlie@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Diana Prince",
//     email: "diana@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Ethan Hunt",
//     email: "ethan@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Fiona Apple",
//     email: "fiona@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "George Miller",
//     email: "george@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Hannah Lee",
//     email: "hannah@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Ivan Petrov",
//     email: "ivan@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
//   {
//     fullName: "Julia Roberts",
//     email: "julia@example.com",
//     password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
//   },
// ];

const seeds = [
  {
    fullName: "Ngọc Yên",
    email: "ngocyen@gmail.com",
    password: "$2b$10$EPR.x3zwr7G4uVZSmvwiHe/c7723QKiOgaXsC2dR0piKtSxOnysri",
  },
];

const MONGO_URI = ``;
(async () => {
  try {
    await mongoose.connect(MONGO_URI);

    await User.insertMany(seeds, { ordered: false });
    console.log("Seeded users successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
})();
