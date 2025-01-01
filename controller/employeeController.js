const prisma = require('../config/db')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const nodemailer = require('nodemailer');
const crypto = require('crypto');

async function emploginPage(req,res) {
    try {
        res.render('employee/empLogin')
    } catch (error) {
        console.error(error);       
    }
}

async function empReg(req, res) {
    try {
      const place = await prisma.Place.findMany();
    //   const curlocation = await prisma.curlocation.findMany();
      const jobCategories = await prisma.jobCategory.findMany();
      res.render('employee/empReg', { jobCategories, place:place });
    } catch (error) {
      console.error('Error fetching job categories:', error);
      res.status(500).send('Internal Server Error');
    }
  }

async function employeeRegistration(req, res) {
    const { name, email, password, jobTitle, address, place, curlocation, contact } = req.body;
    console.log(jobTitle);
    
    try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { email },
        });

        if (existingEmployee) {
            return res.status(400).send("Employee already exists with this email");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a confirmation token
        const confirmationToken = crypto.randomBytes(20).toString('hex');
        console.log(confirmationToken);

        // Create a new employee (without allowing login yet)
        const newEmployee = await prisma.employee.create({
            data: {
                name,
                email,
                password: hashedPassword,
                jobCategoryId: parseInt(jobTitle),
                address:address,
                placeId: parseInt(place),
                subplaceId: parseInt(curlocation),
                contact,
                // confirmationToken: confirmationToken,
            },
        });
        
        // Store the token in the employee record
        await prisma.employee.update({
            where: { email: newEmployee.email },
            data: { confirmationToken: confirmationToken },
        });

        // Send confirmation email with the token in the URL
        await sendEmployeeConfirmationEmail(newEmployee.email, confirmationToken);

        // Inform the user that they need to check their email
        res.status(200).send("Registration successful. Please check your email for confirmation.");
        // Render a page with an alert message
        // res.render('employee/empReg', { 
        //     message: 'Registration successful. Please check your email for confirmation.' 
        // });
    } catch (error) {
        console.error('Error registering employee:', error);
        res.status(500).send("Error registering employee");
    }
}

async function selectplace(req,res) {
    try {
        const placeId = parseInt(req.params.placeId, 10); // Get the place ID from the request
        const subplaces = await prisma.subplace.findMany({
            where: {
                placeId: placeId,
            },
        });
        res.json(subplaces);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching subplaces");
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
        // Find the employee by the confirmation token
        const employee = await prisma.employee.findUnique({
            where: { confirmationToken: token },
        });

        if (!employee) {
            return res.status(400).send('Invalid or expired confirmation link');
        }

        // Clear the confirmation token after successful confirmation
        await prisma.employee.update({
            where: { email: employee.email },
            data: { confirmationKey: true },
        });

        // Redirect the employee to the login page
        // res.redirect(`/employee/empLogin?token=${token} `);  // Provide the token so the employee can log in
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
        const confirmationKey = employee.confirmationKey

        if(confirmationKey === false) {
           return res.redirect('/employee/empLogin')
        }

        if (!isPasswordValid) {
            return res.status(401).send("Invalid credentials");
        }

        // Mark emp as active
        await prisma.employee.update({
            where: { email: email },
            data: { 
                isActive: true, 
            },
        });

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

        // const employeeId = req.employeeId; // Assuming employee ID is stored in session or token
        const bookings = await prisma.booking.findMany({
            where: { employeeId: employee.employeeId },
            include: {
                user: true, // Include user details
                // employee: true, // Include employee details if needed
            },
            orderBy: {
                bookingDate: 'desc', 
              },
            // include: {
            //     user: {
            //         select: {
            //             name: true,
            //             contact: true,
            //             maplink: true, // Include the maplink field
            //         },
            //     },
            // },
        });

        const pendingBookings = bookings.filter(b => b.status === 'pending');
        const completedBookings = bookings.filter(b => b.status === 'completed');
        const rejectBooking = bookings.filter(b => b.status === 'rejected');
        // const pendingBookings = await prisma.booking.findMany({
        //     where: { employeeId, status: 'pending' },
        //     include: { user: true },
        // });

        // const acceptedBookings = await prisma.booking.findMany({
        //     where: { employeeId, status: 'accepted' },
        //     include: { user: true },
        // });

        // const completedBookings = await prisma.booking.findMany({
        //     where: { employeeId, status: 'completed' },
        //     include: { user: true },
        // });

        // Render the employee dashboard with the fetched employee data
        res.render('employee/dashboardEmp', { employee,employeeData ,bookings,pendingBookings,completedBookings,rejectBooking});

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving employee dashboard');
    }
}

// Accept Booking
async function acceptBooking(req, res) {
    console.log('Accept request received');
    try {
        const { bookingId } = req.body;

        const updatedBooking = await prisma.booking.update({
            where: { id: parseInt(bookingId) },
            data: { status: 'accepted' },
        });

        // Mark employee as unavailable
        await prisma.employee.update({
            where: { id: updatedBooking.employeeId },
            data: { isBooked: true },
        });

        console.log('Booking Accepted:', updatedBooking);
        res.status(200).json({ message: 'Booking accepted successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Error accepting booking:', error);
        res.status(500).json({ error: 'Failed to accept booking' });
    }
}

// Reject Booking
async function rejectBooking(req, res) {
    console.log('Reject request received');
    try {
        const { bookingId } = req.body;

        const updatedBooking = await prisma.booking.update({
            where: { id: parseInt(bookingId) },
            data: { status: 'rejected' },
        });

        // Mark employee as available
        // await prisma.employee.update({
        //     where: { id: updatedBooking.employeeId },
        //     data: { isBooked: false },
        // });

        console.log('Booking Rejected:', updatedBooking);
        res.status(200).json({ message: 'Booking rejected successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ error: 'Failed to reject booking' });
    }
}

// Complete Booking
async function completeBooking(req, res) {
    try {
      const { bookingId } = req.body;
  
      const updatedBooking = await prisma.booking.update({
        where: { id: parseInt(bookingId) },
        data: { status: 'completed' },
      });
      
  
      // Optionally mark the employee as available again
      await prisma.employee.update({
        where: { id: updatedBooking.employeeId },
        data: { isBooked: false },
      });
  
      console.log('Booking Completed:', updatedBooking);
      // Redirect to dashboardCompleted with bookingId as query
    //   res.status(200).json({ redirectUrl: `/dashboardCompleted?bookingId=${bookingId}` });
      res.render('employee/dashboardCompleted');
    } catch (error) {
      console.error('Error completing booking:', error);
      res.status(500).json({ error: 'Failed to complete booking' });
    }
}

async function dashboardPending (req,res){
    try {
      // Fetch employee data using the authenticated employee ID
      const employee = req.employeeOne; 
      const employeeData = await prisma.employee.findUnique({
          where: { id: employee.employeeId },
      });

      // Fetch pending bookings from the database
      const bookings = await prisma.booking.findMany({
          where: { employeeId: employee.employeeId, status: 'pending' },
          include: { user: true },
      });

      // Fetch accepted bookings
    const accbookings = await prisma.booking.findMany({
        where: { employeeId: employee.employeeId, status: 'accepted' },
        include: { user: true },
      });

      res.render('employee/dashboardPending', { employeeData, bookings,accbookings });
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      res.status(500).send('Server Error');
    }
};

async function dashboardCompleted(req, res) {
    try {
        const employee = req.employeeOne; 
        const employeeData = await prisma.employee.findUnique({
            where: { id: employee.employeeId },
        });
        
        const completedBookings = await prisma.booking.findMany({
            where: { status: 'completed' },
            include: { user: true, employee: true },
        });
  
      res.render('employee/dashboardCompleted', { employeeData,completedBookings });
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
      res.status(500).send('Server Error');
    }
}

async function dashboardRejected(req, res) {
    try {
        const employee = req.employeeOne; 
        const employeeData = await prisma.employee.findUnique({
            where: { id: employee.employeeId },
        });
      const rejectedBookings = await prisma.booking.findMany({
        where: { status: 'rejected' },
        include: { user: true },
      });
  
      res.render('employee/dashboardRejected', { employeeData,rejectedBookings });
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
      res.status(500).send('Server Error');
    }
}
// Rate Booking
async function rateBooking(req, res) {
    try {
        const { bookingId, rating } = req.body;

        // Validate rating (ensure it's between 1 and 5)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Update the booking with the rating
        const updatedBooking = await prisma.booking.update({
            where: { id: parseInt(bookingId) },
            data: { rating: parseInt(rating) },
        });

        const RatedBooking = await prisma.rating.upsert({
            where: { bookingId: parseInt(bookingId) },
            create: {
              bookingId: parseInt(bookingId),
              rating: parseInt(rating),
            },
            update: {
              rating: parseInt(rating),
            },
          });

        console.log('Booking Rated:', updatedBooking);
        res.status(200).json({ message: 'Rating submitted successfully', booking: updatedBooking , RatedBooking });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
}

async function empLogout(req,res) {
    try {

      const token = req.cookies.employeeToken;

        if (!token) {
            return res.redirect('/employee/emplogin'); // If no token, redirect directly
        }

        // Decode the token to get the user ID
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        // Update the user's is_active field to false
        await prisma.employee.update({
            where: { id: decoded.employeeId },
            data: { isActive: false },
        });
        res.clearCookie('employeeToken')
        res.redirect('/employee/Emplogin')        
    } catch (error) {
        console.error(error);
        
    }
}

//for displaying det on view
async function getEmployeeDetails(req, res) {
    const { id } = req.params;

    try {
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id) },
            include: {
                place: true,
                subplace: true,
                jobCategory: true,
                rating: {
                    include: {
                        user: {
                            select: { name: true, profilePhoto: true }, // Fetch user's name for review display
                        },
                    },
                },
            },
        });

        console.log(employee);
        

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        
        res.json({
            name: employee.name,
            jobTitle: employee.jobCategory?.jobName || 'N/A',
            place: employee.subplace?.name || employee.place?.name || 'N/A',
            availability: employee.isBooked ? 'Booked' : 'Available',
            contact: employee.contact || 'No contact available',
            performance: employee.performance || 'No ratings yet',
            reviews: employee.rating.map((review) => ({
                user: review.user.name,
                profilePhoto: review.user.profilePhoto || '/assets/img/png-transparent-user-profile.png', // Include user profile photo
                rating: review.rating,
                comment: review.review || 'No comment',
                createdAt: review.createdAt,
            })),
            // photoUrl: employee.photoUrl || '/assets/img/png-transparent-user-profile.png',
        });
    } catch (error) {
        console.error('Error fetching employee details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//update profile
async function employeeProfile(req, res) {
    try {
      const employee = req.employeeOne;
      const employeeData = await prisma.employee.findUnique({
        where: { id: employee.employeeId }, 
      });

      // Log the data to verify
      console.log('Employee Data:', employeeData.profilePhoto);
  
      res.render('employee/profile', { employeeData: employeeData });
    } catch (error) {
      console.error('Error loading profile:', error);
      res.status(500).send('Error loading profile');
    }
    
}

async function updateEmployeeProfile(req, res) {
    try {
      const employeeId = req.employeeOne.employeeId;
      const { name, contact, address } = req.body;
      let profilePhotoPath = null;
  
      if (req.file) {
        profilePhotoPath = `/uploads/user_profile_photos/${req.file.filename}`;
      }

      // Log the path to verify
      console.log('Profile Photo Path:', profilePhotoPath);
  
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          name,
          contact,
          address,
          profilePhoto: profilePhotoPath || undefined, // Update only if photo is uploaded
        },
      });
       
      res.redirect('/employee/dashboardEmp');
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error updating profile');
    }
}
  

module.exports = {empReg,emploginPage,employeeRegistration,selectplace,confirmEmployee,loginPageConfirm,
    loginHandler,employeeLogin,dashboardEmp,acceptBooking,rejectBooking,dashboardPending,completeBooking,
    dashboardCompleted,dashboardRejected,rateBooking,empLogout,getEmployeeDetails,employeeProfile,updateEmployeeProfile}