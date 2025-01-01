const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const JWT_KEY = process.env.JWT_KEY;

function authuser(req,res,next) {
    const token = req.cookies.userToken;
    // console.log('Token from cookies:', token);
    if(!token) {
        res.redirect('/user/userlogin')
    }

    try {
        const user = jwt.verify(token,JWT_KEY)
        // console.log('Token verified, user:', user);
        req.userOne = user;
        next();
    } catch (error) {
        console.error(error);
        // console.error('Token verification failed:', error);
        res.clearCookie('userToken')
        // return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
        res.redirect('/user/userlogin')
    }
}

module.exports = authuser;