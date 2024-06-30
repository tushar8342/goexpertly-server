const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); 
const sequelize = new Sequelize(process.env.DATABASE_URL);

const Course = sequelize.define('Course', {
  courseID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  imageSrc: {  // New field for image URL
    type: DataTypes.STRING(255),
    allowNull: true
  },
  instructors: { // Array of instructor names
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duration: { // Duration in minutes
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountedPrice: { // Discounted price, if applicable
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  rating: {
    type: DataTypes.FLOAT, // Can store decimals for ratings
    allowNull: true
  },
  numReviews: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  detailsLink: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  features: { // Array of strings representing features
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  what_you_will_learn:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  content:{
    type: DataTypes.TEXT,
    allowNull: true
  },
 siteId: {
    type: DataTypes.STRING(255), 
    allowNull: false,
  },
  webinarDate: {
    type: DataTypes.DATE, 
    allowNull: true
  }
});

module.exports = Course;
