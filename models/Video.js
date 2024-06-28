const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); 
const sequelize = new Sequelize(process.env.DATABASE_URL);

  const Video = sequelize.define('Video', {
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
