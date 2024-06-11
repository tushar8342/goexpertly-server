// routes/adminRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment=require('../models/Enrollment')
const Coupon  = require('../models/Coupon')
const router = express.Router();
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({ email, password: hashedPassword });
    res.status(201).json(newAdmin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ adminId: admin.id, email: admin.email }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});
// Middleware function to authenticate admin
const authenticateAdmin = (req, res, next) => {
    // Extract token from the Authorization header
    const authHeader  = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or malformed token' });
    }
    // Extract the token part from the header
    const token = authHeader.split(' ')[1];
    console.log("Received token:", token);
    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
      // Pass the decoded payload to the next middleware/route handler
      req.admin = decoded;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Invalid token' });
    }
  };
// Get all users (Admin endpoint)
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await User.findAll();
  
      // Send the list of users in the response
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  router.get('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch the user by ID from the database
        const user = await User.findByPk(userId);

        if (user) {
            // Send the user in the response if found
            res.status(200).json(user);
        } else {
            // Send a 404 response if the user is not found
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
});
// Update user information
router.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { email, fullName } = req.body;
  try {
    const [updateRow,updatedRowsCount] = await User.update(
      { email, fullName },
      { where: { id: userId }, returning: true }
    );
    console.log(updatedRowsCount);
    if (updatedRowsCount === undefined) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updatedRowsCount > 0) {
      const updatedRows = await User.findAll({ where: { id: userId } });
      return res.status(200).json(updatedRows);
    } else {
      // Handle case where no rows were updated
      console.log("No rows were updated.");
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const deletedRowCount = await User.destroy({ where: { id: userId } });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Create a new course
router.post('/courses', authenticateAdmin, async (req, res) => {
  console.log(req);
  try {
    const { title,imageSrc, description, instructors, duration, price, discountedPrice, rating, numReviews, detailsLink, features,what_you_will_learn,content } = req.body;

    // Basic validation (consider using a validation library for more complex checks)
    if (!title || !description || !price) {
      return res.status(400).json({ message: 'Missing required fields: title, description, and price' });
    }

    const newCourse = await Course.create({
      title,
      imageSrc,
      instructors: instructors ? JSON.stringify(instructors) : null, // Handle optional array field
      duration,
      price,
      discountedPrice,
      rating,
      numReviews,
      detailsLink,
      features: features ? JSON.stringify(features) : null, // Handle optional array field
      description,
      what_you_will_learn,
      content
    });

    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error occurred' });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});
// Search courses
router.get('/courses/search', async (req, res) => {
  try {
    const { keyword } = req.query;
console.log(keyword);
    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required for searching' });
    }

    // Query courses based on the keyword
    const courses = await Course.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ]
      }
    });

    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to search courses' });
  }
});
// Get a specific course by ID
router.get('/courses/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

// Update course information
router.put('/courses/:courseId', authenticateAdmin, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { title,imageSrc, description, instructors, duration, price, discountedPrice, rating, numReviews, detailsLink, features,what_you_will_learn,content  } = req.body;
    const [updatedRowCount, updatedCourses] = await Course.update(
      {  title,
        imageSrc,
        instructors: instructors ? JSON.stringify(instructors) : null, // Handle optional array field
        duration,
        price,
        discountedPrice,
        rating,
        numReviews,
        detailsLink,
        features: features ? JSON.stringify(features) : null, // Handle optional array field
        description,
        what_you_will_learn,
        content },
      { where: { CourseID: courseId }, returning: true }
    );
    if (updatedRowCount === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(updatedCourses[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update course' });
  }
});

// Delete course
router.delete('/courses/:courseId', authenticateAdmin, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const deletedRowCount = await Course.destroy({ where: { CourseID: courseId } });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
});
router.get('/enrolls', authenticateAdmin, async (req, res) => {
  try {
    // Include user and course data in the response (optional)
    const enrollments = await Enrollment.findAll({
      include: [
        { model: User, as: 'User', attributes: ['id', 'fullName'] },
        { model: Course, as: 'Course', attributes: ['courseID', 'title'] },
      ],
      attributes: ['id', 'userId', 'courseId', 'invoiceUrl'],
    });
    res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
});
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION, 
  });
  router.get('/presigned-url', async (req, res) => {
    const fileName = req.query.filename || 'course-image.jpg'; // Optional: Allow specifying filename

    const params = {
      Bucket: 'goexpertly-bucket', // Replace with your bucket name
      Key: fileName,
      Expires: 3600, // Pre-signed URL expires in 1 hour
      ContentType: 'image/jpeg', // Replace with appropriate content type based on file extension
    };

    try {
      const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
      res.json({ url: presignedUrl });
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      res.status(500).json({ message: 'Failed to generate pre-signed URL' });
    }
  });
  //coupon routes
  router.get('/coupons', authenticateAdmin, async (req, res) => {
    try {
      const coupons = await Coupon.findAll();
      res.status(200).json(coupons);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch coupons' });
    }
  });
  router.get('/coupons/:id', authenticateAdmin, async (req, res) => {
    try {
      const couponId = req.params.id;
      const coupon = await Coupon.findByPk(couponId);
  
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
  
      res.status(200).json(coupon);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch coupon' });
    }
  });
  router.post('/coupons', authenticateAdmin, async (req, res) => {
    try {
      console.log(req.body);
      const { code, discountType, discountValue, description, startDate, endDate,isActive } = req.body;
  
      // Basic validation on server-side (consider using a validation library)
      if (!code || !discountType || !discountValue || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      const newCoupon = await Coupon.create({
        code,
        discountType,
        discountValue,
        description,
        startDate,
        endDate,
        isActive
      });
  
      res.status(201).json({ message: 'Discount coupon created successfully!', coupon: newCoupon });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.put('/coupons/:id', authenticateAdmin, async (req, res) => {
    console.log(req.body);
    try {
      const couponId = req.params.id;
      const { code, discountType, discountValue, description, startDate, endDate, isActive } = req.body;
  
      // Basic validation on server-side (consider using a validation library)
      if (!code || !discountType || !discountValue || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      const existingCoupon = await Coupon.findByPk(couponId);
  
      if (!existingCoupon) {
        return res.status(404).json({ message: 'Discount coupon not found' });
      }
  
      existingCoupon.code = code;
      existingCoupon.discountType = discountType;
      existingCoupon.discountValue = discountValue;
      existingCoupon.description = description;
      existingCoupon.startDate = startDate;
      existingCoupon.endDate = endDate;
      existingCoupon.isActive = isActive; 
  
      await existingCoupon.save();
  
      res.status(200).json({ message: 'Discount coupon updated successfully!', coupon: existingCoupon });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.delete('/coupons/:id', authenticateAdmin, async (req, res) => {
    try {
      const couponId = req.params.id;
  
      const existingCoupon = await Coupon.findByPk(couponId);
  
      if (!existingCoupon) {
        return res.status(404).json({ message: 'Discount coupon not found' });
      }
  
      await existingCoupon.destroy();
  
      res.status(200).json({ message: 'Discount coupon deleted successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
module.exports = router;
