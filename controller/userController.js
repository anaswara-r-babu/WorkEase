const prisma = require('../config/db')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const JWT_KEY = process.env.JWT_KEY
// USER 

async function userReg(req,res) {
    try {
        res.render('user/userReg')
    } catch (error) {
        console.error(error);       
    }
}

async function userRegistration(req, res) {

    const { name, email, password, address, place, map, contact } = req.body;

    try {
        // Check for existing user
        // const { latitude, longitude } = await getCoordinates(address);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).send("User already exists with this email");
        }

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
                maplink: map,
                contact
            },
        });

        // const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_KEY, { expiresIn: '1h' });
        // res.cookie('userToken', token, { httpOnly: true });
        console.log(newUser);
        
        // session 
        // req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };

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
// async function userLogin (req, res) {
//     const { email, password } = req.body;

//     try {
//         // Hash password before saving
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Save new user to database
//         const newUser = new User({
//             email: email,
//             password: hashedPassword,
//         });

//         await newUser.save();
//         res.redirect('/user/userlogin'); 
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server error');
//     }
// };

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

        // Update the lastLogin field with the current timestamp
        // await prisma.user.update({
        //   where: { email: email },
        //   data: { lastLogin: new Date() }
        // });

        // Mark user as active
        await prisma.user.update({
            where: { email: email },
            data: { 
                lastLogin: new Date(),
                is_active: true, // Mark as active
            },
        });

         // Send confirmation key to email
         await sendConfirmationKey(email);

         // Redirect to confirmation page
         res.render('user/confirm', { email });

        // // Generate JWT token
        // const token = jwt.sign({ userId: user.id, email: user.email }, JWT_KEY, { expiresIn: '1h' });

        // // Set token in cookies
        // res.cookie('userToken', token, { httpOnly: true });
        // console.log('Login successful:', user);
        // res.redirect('dashboardUser');

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

        // Clear confirmation key and log in the user
        await prisma.user.update({
            where: { email },
            data: { confirmationKey: null },
        });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_KEY, { expiresIn: '1h' });

        // Set token in cookies and redirect to dashboard
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

        // Fetch completed bookings for the logged-in user
        // const completedBookings = await prisma.booking.findMany({
        //     where: {
        //         userId: user.id, // Match the logged-in user's ID
        //         status: 'completed',
        //     },
        //     include: {
        //         user: true, // Include user details if necessary
        //         employee: true, // Include employee details if necessary
        //     },
        //     orderBy: {
        //         bookingDate: 'desc', // Sort by booking date
        //     },
        // });

        // Calculate total bookings made
        // const totalBookingsMade = completedBookings.length;

        // Fetch all bookings for the logged-in user
        const allBookings = await prisma.booking.findMany({
            where: {
                userId: user.userId, // Match the logged-in user's ID
            },
            include: {
                employee: true, // Include employee details if necessary
            },
        });

        // Calculate total bookings made
        const totalBookingsMade = allBookings.length;

        // Fetch ratings given by the user
        const ratings = await prisma.rating.findMany({
            where: {
                userId: user.userId
            }
        });

        // Number of Complaints Registered
        const complaints = await prisma.Complaints.findMany({
            where: { userId: user.userId },
        });
        const totalComplaints = complaints.length;

        

        // Calculate total employees rated
        const totalEmployeesRated = new Set(ratings.map(rating => rating.employeeId)).size;

        // Calculate average rating given
        // const averageRatingGiven = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length || 0;
        
        res.render('user/dashboardUser',{userData: userData , //completedBookings,
            totalBookingsMade: totalBookingsMade,
            totalEmployeesRated: totalEmployeesRated,
            totalComplaints
            //averageRatingGiven: averageRatingGiven.toFixed(2)
            })
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

      const token = req.cookies.userToken;

        if (!token) {
            return res.redirect('/user/userlogin'); // If no token, redirect directly
        }

        // Decode the token to get the user ID
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        // Update the user's is_active field to false
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { is_active: false },
        });
        res.clearCookie('userToken')
        res.redirect('/user/userlogin')        
    } catch (error) {
        console.error(error);
        
    }
}

// Book an employee
async function bookEmployee(req, res) {

    const generateBookingCode = async () => {
        const prefix = "BK";
      
        // Fetch the latest booking code from the database
        const lastBooking = await prisma.booking.findFirst({
          orderBy: { id: 'desc' }, // Get the latest booking
          select: { code: true },
        });
      
        // Determine the next number
        let nextNumber = 1; // Default to 1 if no bookings exist
        if (lastBooking && lastBooking.code) {
          const lastNumber = parseInt(lastBooking.code.replace(prefix, ""), 10); // Extract the numeric part
          nextNumber = lastNumber + 1;
        }
      
        // Generate the new booking code
        const paddedNumber = nextNumber.toString().padStart(4, '0'); // Ensure it's 4 digits
        return prefix + paddedNumber; // Combine prefix with padded number
      };
      

    try {
        const {employeeId,userId,description} = req.body;
        const code = await generateBookingCode(); // Generate unique code

        const newBooking = await prisma.booking.create({
        data: {
            code,
            description,
            employeeId: parseInt(employeeId),
            userId: parseInt(userId),
            status: 'pending',
        },
        });

        console.log('New Booking Created:', newBooking);

        // code on employee sccepts the req
        // await prisma.employee.update({
        //     where :{
        //         id: parseInt(employeeId),
        //     },
        //     data :{ isBooked: true}
        // })
        res.status(200).json({ message: 'Booking successful', booking: newBooking });       
    } catch (error) {
        console.error(error);
        
    }
}

// Fetch bookings for a user
async function getBookStatus(req, res) {
    try {
      const user = req.userOne; // Ensure user is authenticated
      if (!user || !user.userId) {
        throw new Error('User not authenticated');
      }
  
      // Fetch user data
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
      });
  
      const bookings = await prisma.booking.findMany({
        where: {
          userId: user.userId,
          status: { in: ['pending', 'accepted', 'completed'] },
        },
        include: {
          user: true,
          employee: true,
          rating: true, // Include rating for the booking
        },
        orderBy: {
          bookingDate: 'desc',
        },
      });
  
      res.render('user/bookStatus', { userData, bookings });
    } catch (error) {
      console.error('Error fetching booking status:', error);
      res.status(500).send('Error fetching booking status');
    }
} 
  
// Withdraw a booking
async function withdrawBooking(req, res) {
    try {
        const { bookingId } = req.body;

        // Fetch the booking to verify
        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
        });

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Update the booking status to 'withdrawn'
        const updatedBooking = await prisma.booking.update({
            where: { id: parseInt(bookingId) },
            data: { status: 'withdrawn' },
        });

        res.status(200).json({ success: true, message: 'Booking withdrawn successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Error withdrawing booking:', error);
        res.status(500).json({ success: false, error: 'Failed to withdraw booking' });
    }
}

// Rate a booking
async function rateBooking(req, res) {
    try {
      const { bookingId, rating, review } = req.body;
  
      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
  
      // Find the booking
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) },
      });
  
      // Ensure the booking exists and is completed
      if (!booking || booking.status !== 'completed') {
        return res
          .status(400)
          .json({ error: 'Rating is only allowed for completed bookings' });
      }
  
    //   // Check if a rating already exists for this booking
    //   const existingRating = await prisma.rating.findFirst({
    //     where: {
    //       userId: booking.userId,
    //       employeeId: booking.employeeId,
    //     },
    //   });
  
    //   let ratingResponse;
  
    //   // Update or create the rating
    //   if (existingRating) {
    //     ratingResponse = await prisma.rating.update({
    //       where: { id: existingRating.id },
    //       data: { rating: parseInt(rating), review },
    //     });
    //   } else {
    //     ratingResponse = await prisma.rating.create({
    //       data: {
    //         rating: parseInt(rating),
    //         review,
    //         userId: booking.userId,
    //         employeeId: booking.employeeId,
    //       },
    //     });
    //   }
  
    //   res.status(200).json({
    //     message: 'Rating submitted successfully',
    //     rating: ratingResponse,
    //   });
    // } catch (error) {
    //   console.error('Error submitting rating:', error);
    //   res.status(500).json({ error: 'Failed to submit rating' });
    // }
    // Check if a rating already exists for this booking
    const existingRating = await prisma.rating.findFirst({
        where: {
            bookingId: parseInt(bookingId),
        },
    });

    if (existingRating) {
        return res
            .status(400)
            .json({ error: 'Rating has already been submitted for this booking.' });
    }

    // Create a new rating
    const ratingResponse = await prisma.rating.create({
        data: {
            rating: parseInt(rating),
            review,
            userId: booking.userId,
            employeeId: booking.employeeId,
            bookingId: parseInt(bookingId),
        },
    });

    // Update employee performance
    await updateEmployeePerformance(booking.employeeId);

    // res.status(200).json({
    //     message: 'Rating submitted successfully',
    //     rating: ratingResponse,
    // });
    res.redirect('/user/bookStatus')
} catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
}
}

async function registerComplaint(req, res) {
    try {
      const { employeeId,bookingId, description } = req.body;
      const userId = req.userOne.userId; // Authenticated user's ID
  
      if (!employeeId || !description) {
        // return res.status(400).json({ success: false, message: "Employee ID, booking ID, and description are required." });
        return res.status(400).json({ error: "Employee ID and description are required." });
      }

      // Check if the user has already registered a complaint for this employee
        const existingComplaint = await prisma.Complaints.findFirst({
        where: {
          userId: userId,
        //   employeeId: parseInt(employeeId), can complaint on same employee
          bookingId: parseInt(bookingId), // Ensure we check by booking ID
        },
      });
  
      if (existingComplaint) {
        return res.status(400).json({ success: false, message: "You have already registered a complaint for this booking." });
      }
  
      const complaint = await prisma.Complaints.create({
        data: {
          employeeId: parseInt(employeeId),
          bookingId: parseInt(bookingId),
          userId,
          description,
        },
      });
  
      res.status(201).json({ success: true, message: "Complaint registered successfully.", complaint });
    } catch (error) {
      console.error("Error registering complaint:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
}
  
const updateEmployeePerformance = async (employeeId) => {
    try {
      // Fetch all ratings for the employee
      const ratings = await prisma.rating.findMany({
        where: { employeeId },
        select: { rating: true },
      });
  
      // If no ratings exist, set performance to "No Ratings"
      if (ratings.length === 0) {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { performance: "No Ratings" },
        });
        return;
      }
  
      // Calculate the average rating
      const totalRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRatings / ratings.length;
  
      // Determine the performance category
      let performance;
      if (averageRating >= 4.5) {
        performance = "Best";
      } else if (averageRating >= 3) {
        performance = "Average";
      } else {
        performance = "Worst";
      }
  
      // Update the employee's performance in the database
      await prisma.employee.update({
        where: { id: employeeId },
        data: { performance },
      });
    } catch (error) {
      console.error("Error updating performance:", error);
      throw new Error("Failed to update performance");
    }
};

async function userprofile(req,res) {
    try {
        const user = req.userOne
        const userData = await prisma.user.findUnique({
            where:{ id: user.userId}
        })

        res.render('user/profile',{userData: userData})
    } catch (error) {
        console.error(error);       
    }
}

// Update profile function
async function updateUserProfile(req, res) {
    try {
      const userId = req.userOne.userId; // Assume user ID is stored in session or token
      const { name, contact, address, place } = req.body;
      let profilePhotoPath = null;
  
      if (req.file) {
        profilePhotoPath = `/uploads/user_profile_photos/${req.file.filename}`;
      }
  
      await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          contact,
          address,
          place,
          profilePhoto: profilePhotoPath || undefined,
        },
      });
  
      res.redirect('/user/dashboardUser');
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error updating profile');
    }
}


module.exports = {userloginPage,userReg,userRegistration,userLoginProcess,dashboardUser,userLogout,confirmKey,
    bookEmployee,getBookStatus,withdrawBooking,rateBooking,registerComplaint,userprofile,updateUserProfile //updateBookingStatus,userOverview
}