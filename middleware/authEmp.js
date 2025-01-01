const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const JWT_KEY = process.env.JWT_KEY;

function authEmp(req,res,next) {
    const token = req.cookies.employeeToken;
    // console.log('Token from cookies:', token);
    if(!token) {
        res.redirect('/employee/empLogin')
    }

    try {
        const employee = jwt.verify(token,JWT_KEY)
        // console.log('Token verified, employee:', employee);
        req.employeeOne = employee;
        next();
    } catch (error) {
        console.error(error);
        // console.error('Token verification failed:', error);
        res.clearCookie('employeeToken')
        res.redirect('/employee/empLogin')
    }
}

module.exports = authEmp;