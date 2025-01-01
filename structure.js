const prisma = require('../config/db')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');
const geolib = require('geolib');
dotenv.config();
const JWT_KEY = process.env.JWT_KEY
async function loginPage(req,res) {
    try {
        res.render('admin/login')
    } catch (error) {
        console.error(error);       
    }
}
async function dashboardPage(req,res) {
    try {
        const admin = req.adminOne
        const adminData = await prisma.admin.findUnique({
            where:{ id: admin.adminId}
        })
        console.log(adminData)
        res.render('admin/dashboard',{adminData: adminData})
    } catch (error) {
        console.error(error);       
    }
}
async function logout(req,res) {
    try {
        res.clearCookie('adminToken')
        res.redirect('/admin/login')
    } catch (error) {
        console.error(error);
    }
}
async function addCategory(req,res) {
    try {
        const admin = req.adminOne
        const adminData = await prisma.admin.findUnique({
            where:{ id: admin.adminId}
        })
        // Fetch job categories
        const jobCategories = await prisma.JobCategory.findMany({
            where: { adminId: admin.adminId },
        });
        res.render('admin/addCategory',{adminData: adminData, jobCategories: jobCategories})
    } catch (error) {
        console.error(error);
    }
}
async function addCategoryProcess(req,res) {
    try {
        const admin = req.adminOne;
        const jobName = req.body.jobName;
        const newJobCategory = await prisma.JobCategory.create({
            data: { jobName: jobName,
                adminId: admin.adminId,
            }
        })
        console.log("New Job Category Created:", newJobCategory);
        res.redirect('addCategory');
    } catch (error) {
        console.error(error);   
    }    
}
async function userReg(req,res) {
    try {
        res.render('user/userReg')
    } catch (error) {
        console.error(error);       
    }
}
async function userRegistration(req, res) {
    const { name, email, password, address, place, contact } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).send("User already exists with this email");
        }
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: place, // The place provided by the user
                format: 'json', // Response format
                limit: 1, // Get the first match
            },
        });
        if (response.data.length === 0) {
            return res.status(400).send("Unable to fetch location data. Please check the place provided.");
        }
        const { lat, lon } = response.data[0];
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create a new user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                address,
                place,
                contact,
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
            },
        });
        console.log(newUser);
        console.log();
        res.redirect('/'); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Error registering user");
    }
};
// Generate and send confirmation key
async function sendConfirmationKey(email) {
    const confirmationKey = crypto.randomBytes(4).toString('hex'); // Generate a random 8-char key
    // Save the confirmation key temporarily (for demo purposes, store in DB)
    await prisma.user.update({
        where: { email },
        data: { confirmationKey },
    });
    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // Your email
            pass: process.env.APP_PASSWORD, // Your app password
        },
    });
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your Confirmation Key',
        text: `Your confirmation key is: ${confirmationKey}`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation key sent to ${email}`);
}
async function userLoginProcess(req, res) {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email: email } 
        });
        if (!user) {
            console.log('User not found');
            return res.status(404).send('Invalid username or password');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password');
            return res.status(401).send('Invalid username or password');
        }
         await sendConfirmationKey(email);
         res.render('user/confirm', { email });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
}
// Confirmation process
async function confirmKey(req, res) {
    const { email, confirmationKey } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || user.confirmationKey !== confirmationKey) {
            return res.status(401).send('Invalid confirmation key');
        }
        await prisma.user.update({
            where: { email },
            data: { confirmationKey: null },
        });
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_KEY, { expiresIn: '1h' });
        res.cookie('userToken', token, { httpOnly: true });
        console.log('Confirmation successful:', user);
        res.redirect('/user/dashboardUser');
    } catch (error) {
        console.error('Error during confirmation:', error);
        res.status(500).send('Error during confirmation');
    }
}
async function dashboardUser(req,res) {
    try {
        const user = req.userOne
        const userData = await prisma.user.findUnique({
            where:{ id: user.userId}
        })
        res.render('user/dashboardUser',{userData: userData})
    } catch (error) {
        console.error(error);       
    }
}
async function userloginPage(req,res) {
    try {
        res.render('user/userlogin')
    } catch (error) {
        console.error(error);       
    }
}
async function userLogout(req,res) {
    try {
        res.clearCookie('userToken')
        res.redirect('/user/userlogin')
    } catch (error) {
        console.error(error);   
    }
}
async function emploginPage(req,res) {
    try {
        res.render('employee/empLogin')
    } catch (error) {
        console.error(error);       
    }
}
async function empReg(req, res) {
    try {
      const jobCategories = await prisma.jobCategory.findMany();
      res.render('employee/empReg', { jobCategories });
    } catch (error) {
      console.error('Error fetching job categories:', error);
      res.status(500).send('Internal Server Error');
    }
  }
async function employeeRegistration(req, res) {
    const { name, email, password, jobTitle, address, place, contact } = req.body;
    try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { email },
        });

        if (existingEmployee) {
            return res.status(400).send("Employee already exists with this email");
        }
        // Get geocoding data from Nominatim
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: place, // The place provided by the user
                format: 'json', // Response format
                limit: 1, // Get the first match
            },
        });
        if (response.data.length === 0) {
            return res.status(400).send("Unable to fetch location data. Please check the place provided.");
        }
        const { lat, lon } = response.data[0];
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create a new employee (without allowing login yet)
        const newEmployee = await prisma.employee.create({
            data: {
                name,
                email,
                password: hashedPassword,
                jobCategoryId: parseInt(jobTitle),
                address:address,
                place,
                contact,
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
            },
        });
        // Generate a confirmation token
        const confirmationToken = crypto.randomBytes(20).toString('hex');
        console.log(confirmationToken);
        // Store the token in the employee record
        await prisma.employee.update({
            where: { email: newEmployee.email },
            data: { confirmationToken: confirmationToken },
        });
        // Send confirmation email with the token in the URL
        await sendEmployeeConfirmationEmail(newEmployee.email, confirmationToken);
        // Inform the user that they need to check their email
        res.status(200).send("Registration successful. Please check your email for confirmation.");
    } catch (error) {
        console.error('Error registering employee:', error);
        res.status(500).send("Error registering employee");
    }
}
async function sendEmployeeConfirmationEmail(email, confirmationToken) {
    const confirmationLink = `http://localhost:3001/employee/confirm?token=${confirmationToken}`;
    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // Your email
            pass: process.env.APP_PASSWORD, // Your app password
        },
    });
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Please Confirm Your Registration',
        text: `Please confirm your registration by clicking the following link: ${confirmationLink}`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation link sent to ${email}`);
}
async function confirmEmployee(req, res) {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('Token is required.');
    }
    try {
        const employee = await prisma.employee.findUnique({
            where: { confirmationToken: token },
        });
        if (!employee) {
            return res.status(400).send('Invalid or expired confirmation link');
        }
        await prisma.employee.update({
            where: { email: employee.email },
            data: { confirmationToken: null },
        });
        res.redirect(`/employee/empLogin?message=confirmed`);
    } catch (error) {
        console.error('Error confirming employee:', error);
        res.status(500).send('Error confirming employee');
    }
}
async function loginPageConfirm(req,res) {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('No confirmation token provided.');
    }
    // Render the login page (you can use a template or HTML for this)
    res.render('empLogin', { token });
}
async function loginHandler(req,res) {
    const { email, password, token } = req.body;
    try {
        // Find the employee by email (make sure their token is cleared after confirmation)
        const employee = await prisma.employee.findUnique({
            where: { email },
        });
        if (!employee) {
            return res.status(400).send('No such employee found.');
        }
        // Verify the password
        const isValidPassword = await bcrypt.compare(password, employee.password);
        if (!isValidPassword) {
            return res.status(400).send('Incorrect password.');
        }
        // Log the employee in (e.g., create a session, send a response)
        res.status(200).send('Employee logged in successfully');
    } catch (error) {
        console.error('Error logging in employee:', error);
        res.status(500).send('Error logging in employee');
    }
}
async function employeeLogin(req, res) {
    const { email, password } = req.body;
    try {
        const employee = await prisma.employee.findUnique({
            where: { email },
        });
        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(401).send("Invalid credentials");
        }
        // Generate JWT token
        const token = jwt.sign({ employeeId: employee.id }, process.env.JWT_KEY,);
        res.cookie('employeeToken', token, { httpOnly: true });
        res.redirect('/employee/dashboardEmp'); // Redirect to employee dashboard
    } catch (error) {
        console.error("Error logging in employee:", error);
        res.status(500).send("Error logging in employee");
    }
}
// Function for Employee Dashboard
async function dashboardEmp(req, res) {
    try {
        const employee = req.employeeOne; 
        const employeeData = await prisma.employee.findUnique({
            where: { id: employee.employeeId },
        });
        // Render the employee dashboard with the fetched employee data
        res.render('employee/dashboardEmp', { employeeData: employeeData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving employee dashboard');
    }
}
async function landingPage(req, res) {
    try {
        const {  place, jobTitle } = req.body;
         // Fetch unique places from the employee table
         const Empplaces = await prisma.employee.findMany({
            select: {
                place: true,
            },
            distinct: ['place'], // Ensures unique places are fetched
        });
        const Userplaces = await prisma.user.findMany({
            select: {
                place: true,
            },
            distinct: ['place'], // Ensures unique places are fetched
        });
        const employees = await prisma.employee.findMany({
            where: {
              jobCategory: { jobName: jobTitle },
              isActive: true,
            },
            include: { jobCategory: true },
          });
        // const uniqueEmpPlaces = places.map(place => place.place);
        const uniquePlacesSet = new Set([
            ...Empplaces.map(place => place.place),
            ...Userplaces.map(place => place.place),
        ]);
        const uniquePlaces = Array.from(uniquePlacesSet);
        const jobCategories = await prisma.jobCategory.findMany();
        res.render('landing', {places:uniquePlaces, jobCategories,employees }); //places:uniquePlaces,
      } catch (error) {
        console.error('Error fetching job categories:', error);
        res.status(500).send('Internal Server Error');
      }
}
// Haversine formula to calculate distance between two lat-long points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
async function searchEmployees(req, res) {
    const { place, jobTitle } = req.body;
    let employees = [];
    let nearbyEmployees = [];
    let userPlace = place; // The searched place
    let jobCategoryId = parseInt(jobTitle, 10);; // The searched job category

    // Get latitude and longitude for the user’s searched place
    const userLocation = await prisma.User.findMany({
        where: { place: userPlace }
    });
    if (!userLocation) {
        return res.render('landing', { employees: [], places: [], jobCategories: [] });
    }
    const userLat = userLocation.latitude;
    const userLon = userLocation.longitude;
    // Query employees based on job category and place
    employees = await prisma.Employee.findMany({
        where: {
            jobCategoryId: jobCategoryId,
            place: {
                contains: userPlace, // This could be partial match (e.g., for nearby places)
            },
        },
    });
    nearbyEmployees = employees.filter(employee => {
        const distance = calculateDistance(userLat, userLon, employee.latitude, employee.longitude);
        return distance >= 5 && distance <= 10; // Filter employees within 5-10 km range
    });
    const allEmployees = [...employees, ...nearbyEmployees];
    res.render('landing', {
        employees: allEmployees,
        places: [], // Add places data if needed
        jobCategories: [], // Add job categories if needed
    });
}
module.exports = {loginPage,dashboardPage,logout,addCategory,addCategoryProcess,
    userloginPage,userReg,userRegistration,userLoginProcess,dashboardUser,userLogout,confirmKey,
    empReg,emploginPage,employeeRegistration,confirmEmployee,loginPageConfirm,loginHandler,employeeLogin,dashboardEmp,
    landingPage,searchEmployees}