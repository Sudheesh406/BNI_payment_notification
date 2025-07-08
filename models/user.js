const mongoose = require("mongoose");

const paidUserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
   name:{
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", paidUserSchema);
