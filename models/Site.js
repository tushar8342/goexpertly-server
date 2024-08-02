const { DataTypes } = require('sequelize');
const db = require('./db');
const Course = require('./Course');
const Site = db.define('Site', {
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