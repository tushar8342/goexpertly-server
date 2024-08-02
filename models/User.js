const { DataTypes } = require('sequelize');
const db = require('./db');
const User = db.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING, 
    allowNull: false 
  },
  phone: {
    type: DataTypes.STRING, 
    allowNull: false 
  },  
  siteId: {
    type: DataTypes.INTEGER, 
    allowNull: false 
  }
});

module.exports = User;
