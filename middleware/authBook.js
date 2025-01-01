const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const JWT_KEY = process.env.JWT_KEY;

function authBook(req, res, next) {
    // const token = req.cookies.userToken;

    // if (!token) {
    //     req.user = null; // Not logged in
    //     return next();
    // }

    // try {
    //     const user = jwt.verify(token, JWT_KEY);
    //     req.user = user; // Attach user data
    //     console.log(user); 
    //     next();
    // } catch (error) {
    //     console.log(req.user);
    //     console.error('Authentication Error:', error);
    //     req.user = null;        
    //     return next(); // Continue without authentication
    // }
    try {
        const token = req.cookies.authToken; // Retrieve the token from cookies
        if (!token) {
          return res.redirect('/user/userlogin'); // Redirect to login if no token
        }
    
        const decoded = jwt.verify(token, 'your_jwt_secret'); // Replace 'your_jwt_secret' with your secret key
        // const user = await prisma.User.findById(decoded.id); // Ensure the user exists in the database
        if (!user) {
          return res.redirect('/user/userlogin'); // Redirect if user is not found
        }
    
        req.user = user; // Attach user details to the request
        next(); // Allow access to the route
      } catch (error) {
        console.log('Authentication error:', error);
        res.redirect('/user/userlogin'); // Redirect if authentication fails
      }
}

module.exports = authBook;
