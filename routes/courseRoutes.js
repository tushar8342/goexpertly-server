const express = require('express');
const Course = require('../models/Course');

const router = express.Router();

// Endpoint to retrieve a list of available courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve courses' });
  }
});

// Endpoint to retrieve details of a specific course
router.get('/courses/:course_id', async (req, res) => {
  const courseId = req.params.course_id;
  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve course details' });
  }
});


// Endpoint to retrieve lessons within a course
router.get('/courses/:course_id/lessons', async (req, res) => {
  // Implementation for retrieving lessons within a course
});

// Endpoint to retrieve details of a specific lesson
router.get('/courses/:course_id/lessons/:lesson_id', async (req, res) => {
  // Implementation for retrieving details of a specific lesson
});

module.exports = router;
