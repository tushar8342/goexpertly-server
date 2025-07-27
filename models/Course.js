const { DataTypes } = require('sequelize');
const db = require('./db');
const Instructor = require('./Instructor');
const Course = db.define('Course', {
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
  instructor: { 
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
  background: { // Array of strings representing features
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  who_will_benefit:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  areas_covered:{
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
  },
  why_register:{
    type:DataTypes.TEXT,
    allowNull:true
  },
  level:{
    type:DataTypes.STRING(255),
    allowNull:true
  },
  target_companies:{
    type:DataTypes.STRING(255),
    allowNull:true
  },
  target_association:{
    type:DataTypes.STRING(255),
    allowNull:true
  },
  instructor_profile:{
    type:DataTypes.TEXT,
    allowNull:true
  }, 
  archieve:{
    type:DataTypes.BOOLEAN,
    allowNull:true
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Instructors',
      key: 'instructorID'
    }
  },
  category: {
  type: DataTypes.ENUM('hr', 'life_science'),
  allowNull: false,
  defaultValue: 'hr'
},
});

module.exports = Course;
