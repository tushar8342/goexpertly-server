// models/User.js
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
  },
// single pre-signup course reference (optional)
  preSignupCourseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Courses',  // table name
      key: 'courseID'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  timestamps: true,
  tableName: 'Users'
});

User.associate = function(models) {
  // set up belongsTo using targetKey courseID
  User.belongsTo(models.Course, {
    as: 'preSignupCourse',
    foreignKey: 'preSignupCourseId',
    targetKey: 'courseID'
  });
};

module.exports = User;
