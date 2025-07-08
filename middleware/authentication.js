const jwt = require('jsonwebtoken')
require('dotenv').config()

async function auth(req,res,next) {
    let token = req.cookies?.token  
      
    if(!token){
        res.status(400).json({message:"token not found"})
    }else{
        try {
            const acessUser =  jwt.verify(token,process.env.SECRET_KEY); 
            if(!acessUser){
              res.status(500).send("something error");
            } else{
                req.User = acessUser;                
                next();
            }
        } catch (error) {
            console.error("Error in authentication middleware:", error);
            res.clearCookie("token");
            res.status(500).send("Error token not found");
        }
    } 
}

module.exports = auth