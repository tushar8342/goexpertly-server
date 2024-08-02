const { DataTypes } = require('sequelize');
const db = require('./db');
const Admin = db.define('Admin', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Admin;