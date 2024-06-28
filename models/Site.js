const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); 
const sequelize = new Sequelize(process.env.DATABASE_URL);
const Course = require('./Course');
const Site = sequelize.define('Site', {
    siteId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: { // Optional field for a human-readable site name
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Other site-specific fields (optional)
  });
  
  Course.belongsToMany(Site, { through: 'CourseSite' });
  Site.belongsToMany(Course, { through: 'CourseSite' });
  module.exports = Site;