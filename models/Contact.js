const { DataTypes } = require('sequelize');
const db = require('./db');
const Contact = db.define('Contact', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    current_role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  module.exports = Contact;