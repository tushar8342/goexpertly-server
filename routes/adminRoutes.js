// routes/adminRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment=require('../models/Enrollment')
const Coupon  = require('../models/Coupon')
const Site  = require('../models/Site')
const Contact = require('../models/Contact')
const Video = require('../models/Video')
const Price = require('../models/Price');
const db = require('../models/db');

require('dotenv').config();
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
    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Pass the decoded payload to the next middleware/route handler
      req.admin = decoded;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Invalid token' });
    }
  };
  router.get('/inquires', authenticateAdmin, async (req, res) => {
    try {
      // Fetch all users from the database
      const contacts = await Contact.findAll();
  
      // Send the list of users in the response
      res.status(200).json(contacts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  // Route to delete a contact by ID
router.delete('/inquires/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID parameter
    if (!id || isNaN(id)) { // Check for valid numeric ID
      return res.status(400).json({ message: 'Invalid contact ID' });
    }

    // Find and delete the contact with the given ID
    const deletedContact = await Contact.destroy({
      where: {
        id,
      },
    });

    // Check if the contact was found and deleted
    if (!deletedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete contact' });
  }
});

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
router.put('/users/:userId',authenticateAdmin, async (req, res) => {
  const { userId } = req.params;
  const { email, fullName,phone } = req.body;
  try {
    const [updateRow,updatedRowsCount] = await User.update(
      { email, fullName,phone },
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
  try {
      const { title, imageSrc, instructor, duration, price, discountedPrice, rating, numReviews, detailsLink, background, description, who_will_benefit, areas_covered, siteId, webinarDate, why_register, level, target_companies, target_association, instructor_profile, archive,pricingData } = req.body;

    // Basic validation (consider using a validation library for more complex checks)
    if (!title || !description || !price) {
      return res.status(400).json({ message: 'Missing required fields: title, description, and price' });
    }
    const transaction = await db.transaction();
    const newCourse = await Course.create({
      title,
      imageSrc,
      instructor: instructor? instructor  : null, // Handle optional array field
      duration,
      price,
      discountedPrice,
      rating,
      numReviews,
      detailsLink,
      background: background ? background : null, // Handle optional array field
      description,
      who_will_benefit,
      areas_covered,
      webinarDate,
      siteId: siteId.length>0 ? siteId.join(',') : null,
      why_register, 
      level, 
      target_companies, 
      target_association, 
      instructor_profile, 
      archive,
      pricingData
    }, { transaction });
    for (const pricingEntry of pricingData) {
      await Price.create({
        courseId: newCourse.courseID,
        attendeeCount: pricingEntry.attendeeCount,
        price: pricingEntry.price,
        sessionType: pricingEntry.sessionType,
      }, { transaction });
    }
    await newCourse.addSite(siteId, { transaction });
    await transaction.commit(); 
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error occurred' });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: Site,
        as:'Sites',
        attributes: ['siteId', 'name'], // Include only necessary site attributes
      },
      {
        model: Price,
        as: 'Pricings',
      }
    ]
    });
    const coursesWithSiteId = courses.map((course) => {
      if (typeof course.siteId === 'string') {
        course.siteId = course.siteId.split(','); // Split if comma-separated
      } else {
        course.siteId = [course.siteId]; // Wrap single value in array (optional)
      }
      return course;
    });
    res.status(200).json(coursesWithSiteId);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});
// Search courses
router.get('/courses/search', async (req, res) => {
  try {
    const { keyword } = req.query;
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
      }, include: [{
        model: Site,
        as:'Sites',
        attributes: ['siteId', 'name'], // Include only necessary site attributes
      },
      {
        model: Price,
        as: 'Pricings',
      }
    ]
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
    const course = await Course.findByPk(courseId,{
      include: [{
        model: Site,
        as:'Sites',
        attributes: ['siteId', 'name'], // Include only necessary site attributes
      },
      {
        model: Price,
        as: 'Pricings',
      }
    ]
    });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const siteIdArray = await course.siteId.split(",");
    course.siteId=siteIdArray
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

// Update course information
router.put('/courses/:courseId', authenticateAdmin, async (req, res) => {
  const transaction = await db.transaction();
  const courseId = req.params.courseId;
  const { title, imageSrc, instructor, duration, price, discountedPrice, rating, numReviews, detailsLink, background, description, who_will_benefit, areas_covered, siteId, webinarDate, why_register, level, target_companies, target_association, instructor_profile, archive } = req.body;

  // Basic validation (consider using a validation library for more complex checks)
  if (!courseId) {
    return res.status(400).json({ message: 'Missing courseId' });
  }

  try {
    const transaction = await db.transaction();

    // Find the course by ID
    const courseToUpdate = await Course.findByPk(courseId, { transaction });

    if (!courseToUpdate) {
      return res.status(404).json({ message: 'Course not found' });
    }
    // Update course details (optional)
    if (title || imageSrc || description || instructors || duration || price || discountedPrice || rating || numReviews || detailsLink || features || what_you_will_learn || content||siteId||Pricings ) {
      courseToUpdate.update({
        title,
        imageSrc,
        instructor: instructor ? instructor : null,
        duration,
        price,
        discountedPrice,
        rating,
        numReviews,
        detailsLink,
        background: background ? background : null,
        description,
        who_will_benefit,
        areas_covered,
        webinarDate,
        siteId:siteId.length>0 ? siteId.join(',') : null,
        why_register, 
        level, 
        target_companies, 
        target_association, 
        instructor_profile, 
        archive,
      }, { transaction });
    }

    // Update site association
    await courseToUpdate.setSites(siteId, { transaction });

    // Update pricing data (if provided)
    // if (Pricings) {
    //   const priceUpdates = Pricings.map(priceData => ({
    //     where: { id: priceData.id },
    //     data: {
    //       attendeeCount: priceData.attendeeCount,
    //       price: priceData.price,
    //       sessionType: priceData.sessionType,
    //     },
    //   }));
    // console.log(priceUpdates)
    //   // Loop and update each price entry
    //   for (const updateData of priceUpdates) {
    //     await Price.update(updateData.data, { where: updateData.where, transaction });
    //   }
    // } 
    const updatedCourse = await Course.findByPk(courseId, { transaction });
    await transaction.commit();
    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    await transaction.rollback(); // Rollback if any error occurs
    res.status(500).json({ message: 'Internal server error occurred' });
  }
});

// Delete course
router.delete('/courses/:courseId', authenticateAdmin, async (req, res) => {
  const transaction = await db.transaction();
  const courseId = req.params.courseId;
  try {
    // Delete associated prices (within transaction)
    await Price.destroy({ where: { courseId }, transaction });

    // Delete the course
    const deletedRowCount = await Course.destroy({ where: { courseId }, transaction });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    await transaction.commit();
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
        { model: User, as: 'User', attributes: ['id', 'fullName','phone','siteId','email'] },
        { model: Course, as: 'Course', attributes: ['courseID', 'title'] },
      ],
      attributes: ['id', 'userId', 'courseId', 'invoiceUrl','sessionType'],
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
    const contentType = req.query.contentType || 'image/jpeg';
    const fileName = req.query.filename || 'course-image.jpg'; // Optional: Allow specifying filename
    const params = {
      Bucket:contentType==='mp4'? 'goexpertly-bucket/WEBINARS': 'goexpertly-bucket/instructors', // Replace with your bucket name
      Key: fileName,
      Expires: 3600, // Pre-signed URL expires in 1 hour
      ContentType:  contentType, // Replace with appropriate content type based on file extension
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
  // Create a new video
router.post('/recordings', authenticateAdmin, async (req, res) => {
  const { videoUrl, courseId } = req.body;

  // Basic validation
  if (!videoUrl) {
    return res.status(400).json({ message: 'Missing required field: videoUrl' });
  }
  if (!courseId) {
    return res.status(400).json({ message: 'Missing required field: courseId' });
  }
  try {
    const newVideo = await Video.create({ videoUrl, courseId });
    res.status(201).json(newVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error occurred' });
  }
});

// Get all videos for a specific course
router.get('/courses/:courseId/videos',authenticateAdmin, async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const videos = await Video.findAll({ where: { courseId } });
    res.status(200).json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

// Get a specific video by ID
router.get('/recordings/:videoId',authenticateAdmin, async (req, res) => {
  const videoId = req.params.videoId;

  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(200).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch video' });
  }
});

// Update a video
router.put('/recordings/:videoId', authenticateAdmin, async (req, res) => {
  const videoId = req.params.videoId;
  const { videoUrl } = req.body;

  // Basic validation
  if (!videoUrl) {
    return res.status(400).json({ message: 'Missing required field: videoUrl' });
  }

  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    video.videoUrl = videoUrl;
    await video.save();
    res.status(200).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update video' });
  }
});

// Delete a video
router.delete('/recordings/:videoId', authenticateAdmin, async (req, res) => {
  const videoId = req.params.videoId;

  try {
    const deletedCount = await Video.destroy({ where: { id: videoId } });
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});
router.get('/recordings', authenticateAdmin, async (req, res) => {
  try {
    const videos = await Video.findAll();
    if (!videos) {
      return res.status(404).json({ message: 'No videos found' });
    }
    // Create an array to store course data for each video
    const videosWithCourses = await Promise.all(videos.map(async (video) => {
      const course = await Course.findOne({ where: { courseId: video.courseId } });
      return {
        ...video.dataValues,
        ...course.dataValues
      };
    }));
    res.status(200).json(videosWithCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch courses and videos' });
  }
});
module.exports = router;
