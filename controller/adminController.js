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

async function testRegistration() {
    try {
        const username = 'anash';  
        const password = '12345'; 
        
        const hashedPwd = await bcrypt.hash(password, 10);
        
        const newAdmin = await prisma.admin.create({
            data: {
                username: username,
                password: hashedPwd
            }
        });
        console.log('Admin registered:', newAdmin);
    } catch (error) {
        console.error('Error registering admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function loginProcess(req,res) {
    try {
      
        const { username,password} = req.body    
        const admin = await prisma.admin.findUnique( {
            where : {
                username: username
            }
        })

        console.log('Found admin:', admin);
        if(!admin) {
            // return res.status(404).json({message : 'admin not found'})
            console.log('Admin not found');
            return;
        }

        let isMatch = await bcrypt.compare(password,admin.password)

        if(!isMatch){
            // return res.status(404).json({message : 'Invalid password'})
            console.log('Invalid password');
            return;
        }

        const token = jwt.sign({adminId : admin.id}, JWT_KEY,{expiresIn: '1h'})
        // console.log('Login successful! Token:', token);
        res.cookie('adminToken',token,{httpOnly:true})
        res.redirect('/admin/dashboard')
    } catch (error) {
        console.error(error);
        await prisma.$disconnect();
    }
}

(async () => {
    await testRegistration();
    await loginProcess();
})();

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

        // Fetch the counts for bookings, complaints, employees, and users
        const [totalBookings, totalComplaints, totalEmployees, totalUsers] = await Promise.all([
            prisma.booking.count(), // Count of bookings
            prisma.complaints.count(), // Count of complaints
            prisma.employee.count(), // Count of employees
            prisma.user.count(), // Count of users
            
        ]);

        const adminData = await prisma.admin.findUnique({
            where:{ id: admin.adminId}
        })
        const pendingBookings = await prisma.booking.count({
            where: { status: 'pending' },
        });
        const completedBookings = await prisma.booking.count({
            where: { status: 'completed' },
        });
        const withdrawnBookings = await prisma.booking.count({
            where: { status: 'withdrawn' },
        });

        // Get booking count per month
        const monthlyBookings = await prisma.booking.groupBy({
            by: ['bookingDate'],
            where: {
                bookingDate: {
                    gte: new Date('2024-01-01'), // Adjust this to fit your needs
                    lte: new Date('2024-12-31')
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                bookingDate: 'asc'
            }
        });

        // Format monthly booking data for the chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const bookingCounts = new Array(12).fill(0); // Initialize array for 12 months

        monthlyBookings.forEach(booking => {
            const month = booking.bookingDate.getMonth(); // Get the month index (0 = Jan, 11 = Dec)
            bookingCounts[month] += booking._count.id; // Add count to the respective month
        });

        // Fetch employee ratings
        const ratings = await prisma.rating.groupBy({
            by: ['rating'],
            _count: {
                rating: true
            },
            where: {
                rating: {
                    in: [1, 2, 3] // Assuming 1 = worst, 2 = average, 3 = best
                }
            }
        });

        // Group ratings into worst, average, and best
        const ratingsData = {
            worst: 0,
            average: 0,
            best: 0
        };

        ratings.forEach(rating => {
            if (rating.rating === 1) ratingsData.worst = rating._count.rating;
            if (rating.rating === 2) ratingsData.average = rating._count.rating;
            if (rating.rating === 3) ratingsData.best = rating._count.rating;
        });

        // Define the activity window (e.g., last 15 minutes)
        const activityWindow = new Date();
        activityWindow.setMinutes(activityWindow.getMinutes() - 15);

        // Query to count active users
        const totalActiveUsers = await prisma.user.count({
            where: {
                // lastLogin: {
                //     gte: activityWindow, // Users logged in within the last 15 minutes
                // },
                is_active: true,
            },
        });

        const mostBookedEmployee = await prisma.employee.findFirst({
            include: {
                bookings: true,
            },
            orderBy: {
                bookings: {
                    _count: 'desc',
                },
            },
        });

        // Fetch employees who received a 5-star rating
        const employeesWithFiveStarRating = await prisma.employee.findMany({
            where: {
                rating: {
                    some: {
                        rating: 5 
                    }
                }
            },
            include: {
                rating: true 
            }
        });

        console.log(adminData)
        
        res.render('admin/dashboard',{adminData: adminData,
            totalBookings,
            totalComplaints,
            totalEmployees,
            totalUsers,
            pendingBookings: pendingBookings,
            completedBookings: completedBookings,
            withdrawnBookings:withdrawnBookings,
            bookingCounts,
            ratingsData ,
            totalActiveUsers,
            mostBookedEmployee,
            employeesWithFiveStarRating,
        })
    } catch (error) {
        console.error(error);       
    }
}
async function userDetOverview(req,res) {
    try {
        const admin = req.adminOne
        const adminData = await prisma.admin.findUnique({
            where:{ id: admin.adminId}
        })
        // Fetch the necessary data for the dashboard
        const totalUsers = await prisma.user.count();
        // const activeUsers = await prisma.user.count({
        //     where: { isActive: true },
        // });
        // const pendingBookings = await prisma.booking.count({
        //     where: { status: 'pending' },
        // });
        // const completedBookings = await prisma.booking.count({
        //     where: { status: 'completed' },
        // });
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, lastLogin:true, createdAt: true},
            orderBy: { createdAt: 'desc' },
        });

        // Pass the data to the view
        res.render('admin/userOverview', {
            adminData: adminData,
            totalUsers: totalUsers,
            // activeUsers: activeUsers,
            // pendingBookings: pendingBookings,
            // completedBookings: completedBookings,
            users: users,
        });
    } catch (error) {
        console.error(error);       
    }
}
async function employeeDetOverview(req,res) {
    try {
        const admin = req.adminOne
        const adminData = await prisma.admin.findUnique({
            where:{ id: admin.adminId}
        })
        // Fetch the necessary data for the dashboard
        const totalemployees = await prisma.employee.count();

        // Fetch available employees
        const availableEmployees = await prisma.employee.count({
            where: { isBooked: false },
        });

        // Fetch booked employees
        const bookedEmployees = await prisma.employee.count({
            where: { isBooked: true },
        });

        const employees = await prisma.employee.findMany({
            select: { id: true, name: true, email: true, createdAt: true, isBooked: true},
            orderBy: { createdAt: 'desc' },
        });

        res.render('admin/employeeOverview',{adminData: adminData,
            totalemployees, 
            employees:employees,
            availableEmployees,
            bookedEmployees,
        })
    } catch (error) {
        console.error(error);       
    }
}

async function bookingDetails(req,res) {
    try {
        const admin = req.adminOne
        const adminData = await prisma.admin.findUnique({
            where:{ id: admin.adminId}
        })

        const booking = await prisma.booking.findMany({
            select:{code:true, 
                description:true, 
                status:true,
                bookingDate: true,
                user: {
                  select: {
                    name: true,
                    contact: true,
                  },
                },
                employee: {
                  select: {
                    name: true,
                  },
                },
                rating:{
                    select:{rating:true}    
                },
                complaints:{
                    select:{description:true}
                }
            },
            orderBy:{code:'asc'},
        })

        res.render('admin/bookingDetails',{adminData: adminData,booking})
    } catch (error) {
        console.error(error);       
    }
}
// async function adminDashboard(req, res) {
//     try {
//         const allBookings = await prisma.booking.findMany({
//             include: {
//                 user: true,
//                 employee: true,
//             },
//         });

//         const pendingBookings = allBookings.filter(b => b.status === 'pending');
//         const completedBookings = allBookings.filter(b => b.status === 'completed');
//         const rejectedBookings = allBookings.filter(b => b.status === 'rejected');

//         res.render('admin/dashboard', { 
//             pendingBookings, 
//             completedBookings, 
//             rejectedBookings 
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Error loading admin dashboard");
//     }
// }

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

async function landingPage(req, res) {
    try {
        const userToken = req.cookies.userToken;
        if(userToken === undefined) {
            try {
                        // Fetch unique places from the employee table
                const places = await prisma.Place.findMany({
                    distinct: ['name'], // Ensures unique places are fetched
                });
                
                const subplaces = await prisma.Subplace.findMany({
                    distinct: ['name'], // Ensures unique places are fetched
                });
                // const uniqueEmpPlaces = places.map(place => place.place);
                const uniquePlacesSet = new Set([
                    ...places.map(place => place.name),
                    ...subplaces.map(place => place.name),
                ]);
                const uniquePlaces = Array.from(uniquePlacesSet);
                const jobCategories = await prisma.jobCategory.findMany();
                // Pass user info if logged in
                const user = req.userOne || null;
                
                res.render('landing', {places:uniquePlaces, jobCategories, user , userActive: false, userId: null }); //places:uniquePlaces,
            } catch (error) {
                console.error(error);               
            }
        } else {
                try {
                    const u = jwt.verify(userToken, JWT_KEY)
                    console.log(u);     

                    const pk = parseInt(u.userId);

                    const userdetails = await prisma.User.findUnique({
                        where :{
                            id:pk
                        }
                    })
                    
                    // Fetch unique places from the employee table
                    const places = await prisma.Place.findMany({
                        distinct: ['name'], // Ensures unique places are fetched
                    });
                    
                    const subplaces = await prisma.Subplace.findMany({
                        distinct: ['name'], // Ensures unique places are fetched
                    });
                    // const uniqueEmpPlaces = places.map(place => place.place);
                    const uniquePlacesSet = new Set([
                        ...places.map(place => place.name),
                        ...subplaces.map(place => place.name),
                    ]);
                    const uniquePlaces = Array.from(uniquePlacesSet);
                    const jobCategories = await prisma.jobCategory.findMany();
                    // Pass user info if logged in
                    const user = req.userOne || null;
                    
                    res.render('landing', {places:uniquePlaces, jobCategories, user, userActive: true, userdetails, userId: userdetails ? userdetails.id : null,});
                } catch (error) {
                    console.error(error);  
                }
        }
      } catch (error) {
        console.error('Error fetching job categories:', error);
        res.status(500).send('Internal Server Error');
      }
}

async function searchEmployees(req, res) {
    const { place, jobTitle } = req.body;

    try {
        let employees = [];

        const mainPlace = await prisma.Place.findFirst({ where: { name: place } });
        if (mainPlace) {
            employees = await prisma.Employee.findMany({
                where: {
                    OR: [
                        { placeId: mainPlace.id },
                        { subplace: { placeId: mainPlace.id } }
                    ],
                    jobCategoryId: jobTitle ? parseInt(jobTitle) : undefined,
                },
                include: { place: true, subplace: true, jobCategory: true },
            });
        } else {
            const subPlace = await prisma.Subplace.findFirst({ where: { name: place } });
            if (subPlace) {
                employees = await prisma.Employee.findMany({
                    where: {
                        subplaceId: subPlace.id,
                        jobCategoryId: jobTitle ? parseInt(jobTitle) : undefined,
                    },
                    include: { place: true, subplace: true, jobCategory: true },
                });
            }
        }

        res.json(employees);
    } catch (error) {
        console.error('Error searching employees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {loginProcess,loginPage,dashboardPage,//adminDashboard,
logout,addCategory,userDetOverview,employeeDetOverview,bookingDetails,addCategoryProcess,landingPage,searchEmployees}