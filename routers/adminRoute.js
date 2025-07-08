const express = require("express");
const Router = express.Router();
const {login,signup, checkUser,logout} = require('../controlls/admin')
const auth = require("../middleware/authentication");
Router.post('/auth/login',login)
Router.post('/auth/signup',signup)
Router.get("/authentication", auth,checkUser); 
Router.get("/auth/logout", logout); 

module.exports = Router;