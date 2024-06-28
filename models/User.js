const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); 

const sequelize = new Sequelize(process.env.DATABASE_URL);

const User = sequelize.define('User', {
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
