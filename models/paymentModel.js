const mongoose = require('mongoose');
const User = require('../models/user')

const paymentSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.ObjectId,
    ref:User,
    required:true
},
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    default:'Nill'
  },
  phone: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true
  },
  isPaid:{
    type: Boolean,
    required:true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
