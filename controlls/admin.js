const mongoose = require("mongoose");
const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function signup(req, res) {
  try {
    const { email, name, phone, password } = req.body;

    // Check if admin with the same phone already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin document
    const newAdmin = await Admin.create({
      email,
      name,
      phone,
      password: hashedPassword,
    });

    // Generate JWT token
    // const token = jwt.sign(
    //   { id: newAdmin._id, phone: newAdmin.phone },
    //   process.env.SECRET_KEY,
    //   { expiresIn: "7d" }
    // );

    // Set token in cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production", // true in production
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    // Send response without password
    const { password: _, ...adminWithoutPassword } = newAdmin.toObject();
    res.status(201).json(adminWithoutPassword);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user by phone
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Check if admin flag is true
    if (!admin.isAdmin) {
      return res.status(403).json({ message: "Access denied: Not an admin" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, phone: admin.phone, role: admin.role },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin.toObject();
    res.status(200).json(adminWithoutPassword);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

const checkUser = async (req, res) => {
  let id = req.User.id;
  try {
    if (!id) {
      return res.status(401).json({ message: "Unauthorized" });
    }else{
      return res.status(200).json({ message: "User is authenticated" });
    }
    
  } catch (error) {
    console.error("Error in checkUser:", error);
    return res.status(401).json({ message: "error found in check user",error })
  }

};

const logout = async (req, res) => {
    try {
      await res.clearCookie("token");
      return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });

    } catch (error) {
      console.error('error found in logout:',error)
      return res.status(500).json({ message: "Internal server error" });
      
    }
}

module.exports = { signup,login,checkUser,logout };
