const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); 
const User = require('./User');
const Course = require('./Course');
const sequelize = new Sequelize(process.env.DATABASE_URL);

const Enrollment = sequelize.define('Enrollments', {
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
  }
});
Enrollment.belongsTo(User, { as: 'User', foreignKey: 'userId' });
Enrollment.belongsTo(Course, { as: 'Course', foreignKey: 'courseId' });
module.exports = Enrollment;
