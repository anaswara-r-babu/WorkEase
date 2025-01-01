var express = require('express');
var router = express.Router();
const adminController = require('../controller/adminController');
const userController = require('../controller/userController')
const employeeController = require('../controller/employeeController')
const authAdmin = require('../middleware/authAdmin');
const authUser = require('../middleware/authUser')
const authEmp = require('../middleware/authEmp')
const authBook = require('../middleware/authBook')
const upload = require('../middleware/upload');

// Add the landing page route
router.get('/', adminController.landingPage); //authUser,

router.post('/landing',adminController.searchEmployees)

router.get('/admin/login',adminController.loginPage)

router.post('/admin/loginProcess',adminController.loginProcess)

router.get('/admin/dashboard',authAdmin,adminController.dashboardPage)

router.get('/admin/logout',adminController.logout)

router.get('/admin/addCategory',authAdmin,adminController.addCategory)

router.post('/admin/addCategoryProcess', authAdmin, adminController.addCategoryProcess);

// router.get('/admin/viewCategory', authAdmin, adminController.viewCategory)
router.get('/admin/userOverview',authAdmin,adminController.userDetOverview)
router.get('/admin/employeeOverview',authAdmin,adminController.employeeDetOverview)
router.get('/admin/bookingDetails',authAdmin,adminController.bookingDetails)




router.get('/user/userlogin',userController.userloginPage)

router.get('/user/userReg',userController.userReg)
// router.post('/user/userRegProcess',userController.userRegProcess)
router.post('/user/userReg',userController.userRegistration)

router.post('/user/userlogin',userController.userLoginProcess);

router.get('/user/confirm', (req, res) => res.render('user/confirm'));
 // Render confirmation page
router.post('/user/confirm', userController.confirmKey);

router.get('/user/dashboardUser',authUser,userController.dashboardUser)

router.get('/user/logout',userController.userLogout) 

router.post('/user/register-complaint', authUser,userController.registerComplaint);

// router.post('/book/:employeeId', authUser, userController.userBooking)

// Booking Routes
router.post('/book',userController.bookEmployee);


router.get('/user/bookStatus', authUser, userController.getBookStatus);
router.post('/user/withdraw-booking', authUser, userController.withdrawBooking);
router.post('/user/rate-booking', authUser, userController.rateBooking);

router.get('/user/profile',authUser,userController.userprofile)
//uploading pp
router.post('/user/update-profile', upload.single('profilePhoto'), authUser, userController.updateUserProfile);
// router.post('/withdraw-booking', userController.withdrawBooking);

// router.patch('/booking/:id/status', userController.updateBookingStatus);

// router.post('/user/userlogin',userController.userLogin)

// router.get('/user/userReg',userController.userReg)

router.post('/rate-booking', employeeController.rateBooking);



router.get('/employee/empReg',employeeController.empReg)
// router.get('/employee/empLogin',employeeController.emploginPage)

router.post('/employee/empReg',employeeController.employeeRegistration)

router.get('/employee/selectplace/:placeId',employeeController.selectplace);

router.get('/employee/confirm',employeeController.confirmEmployee)

router.post('/employee/empLogin',employeeController.employeeLogin)

router.get('/employee/empLogin',employeeController.emploginPage)

router.get('/employee/dashboardEmp',authEmp,employeeController.dashboardEmp)

router.get('/employee/dashboardPending', authEmp, employeeController.dashboardPending);

router.get('/employee/dashboardRejected', authEmp, employeeController.dashboardRejected);

router.post('/accept-booking',authEmp, employeeController.acceptBooking);

router.post('/reject-booking',authEmp, employeeController.rejectBooking);

router.get('/employee/logout',authEmp,employeeController.empLogout) 

router.get('/employee/dashboardCompleted', authEmp, employeeController.dashboardCompleted);

router.post('/complete-booking', authEmp, employeeController.completeBooking);

//pp
router.get('/employee/edit-Profile',authEmp,employeeController.employeeProfile);

router.get('/employee/:id',authEmp,employeeController.getEmployeeDetails);

router.post('/employee/profile',authEmp,upload.single('profilePhotoemp'),employeeController.updateEmployeeProfile);

module.exports = router;
