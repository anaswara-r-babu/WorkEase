// const multer = require('multer');
// const path = require('path');

// // Configure storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/profile_photos'); // Directory to store files
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${file.originalname}`;
//     cb(null, uniqueName);
//   },
// });

// // File validation
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPEG, JPG, and PNG files are allowed'), false);
//   }
// };

// const upload = multer({ storage, fileFilter });

// module.exports = upload;

const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dynamic directory selection based on the route
    const uploadPath = req.baseUrl.includes('/employee') 
      ? 'public/uploads/emp_profile_photos' 
      : 'public/uploads/user_profile_photos';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, and PNG files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
