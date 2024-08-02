const { DataTypes } = require('sequelize');
const db = require('./db');
const User = require('./User');
const Course = require('./Course');

const Enrollment = db.define('Enrollments', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users', // Reference to the User model
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Courses', // Reference to the Course model
      key: 'courseID'
    },
  },
  invoiceUrl: {
    type: DataTypes.STRING, 
    allowNull: true, 
  },
  siteId: {
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  priceId:{
    type: DataTypes.STRING, 
    allowNull: false
  },
  sessionType:{
    type: DataTypes.STRING, 
    allowNull: false
  }
});
Enrollment.belongsTo(User, { as: 'User', foreignKey: 'userId' });
Enrollment.belongsTo(Course, { as: 'Course', foreignKey: 'courseId' });
module.exports = Enrollment;
