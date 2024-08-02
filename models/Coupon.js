const { DataTypes } = require('sequelize');
const db = require('./db');
  const Coupon = db.define('Coupon', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensure unique coupon codes
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed_amount'),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  module.exports = Coupon;
