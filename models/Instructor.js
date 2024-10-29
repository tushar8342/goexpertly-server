const { DataTypes } = require('sequelize');
const db = require('./db');
const Instructor = db.define('Instructor', {
  instructorID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true 
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true 
  },
});
module.exports = Instructor;