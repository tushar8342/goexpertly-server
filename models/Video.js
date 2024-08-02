const { DataTypes } = require('sequelize');
const db = require('./db');
  const Video = db.define('Video', {
    id:{ 
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    courseId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Courses', // Reference to the Course model
          key: 'courseID'
        },
      },
  });

  module.exports = Video;
