const express = require("express");
const Router = express.Router();
const {newUser, newPayment, deletePayment, getPaymentsByPhone, getAllUsersWithLastPayment,editOldData, getPayment, getTrashUsers, PermenentDelete, restore} = require('../controlls/payment')
const auth = require("../middleware/authentication");
Router.post('/newUser',auth,newUser)
Router.delete('/delete/:id', auth,deletePayment);
Router.post('/newPayment',auth,newPayment);
Router.get('/payments/user-phone/:phone',auth,getPaymentsByPhone);
Router.get('/getAllusers', auth, getAllUsersWithLastPayment);
Router.put('/editOldData', auth, editOldData);
Router.get('/getPayment/:userId', auth,getPayment);
Router.get('/trash', getTrashUsers);
Router.delete('/PermenentDelete/:userId', auth,PermenentDelete);
Router.get('/restore/:userId', auth,restore);

module.exports = Router;