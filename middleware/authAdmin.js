const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const JWT_KEY = process.env.JWT_KEY;

function authAdmin(req,res,next) {
    const token = req.cookies.adminToken;

    if(!token) {
        res.redirect('/admin/login')
    }

    try {
        const admin = jwt.verify(token,JWT_KEY)
        req.adminOne = admin;
        next();
    } catch (error) {
        console.error(error);
        res.clearCookie('adminToken')
        res.redirect('/admin/login')
    }
}

module.exports = authAdmin;