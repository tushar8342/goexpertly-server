const { DataTypes } = require('sequelize');
const db = require('./db');
const Course = require('./Course');
const Pricing = db.define('Pricing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'courseID'
      }
    },
    attendeeCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    sessionType: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  });
  
  // Define relationships between Course and Pricing models
  Course.hasMany(Pricing, { foreignKey: 'courseId' });
  Pricing.belongsTo(Course, { foreignKey: 'courseId' });
  
  module.exports = Pricing;
  