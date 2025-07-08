const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({

  email:{
   type: String,
   required: true,
   unique: true
 },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: { 
    type: String,
    required: true,
 },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Admin', adminSchema);
