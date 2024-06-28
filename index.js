const express = require('express');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes')
const { sequelize } = require('./models/User');
const { sequelize: adminSequelize } = require('./models/Admin');
const { sequelize: courseSequelize } = require('./models/Course');
const { sequelize: enrollmentSequelize } = require('./models/Enrollment');
const { sequelize: couponSequelize } = require('./models/Coupon');
const { sequelize: siteSequelize } = require('./models/Site');
const { sequelize: contactSequelize } = require('./models/Contact');
const { sequelize: videoSequelize } = require('./models/Video');
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(cors({
  "origin": "*",
  // origin: 'https://expertly.onrender.com/',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Specify allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

const port = process.env.PORT || 3000;

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GoExpertly API Documentation',
    version: '1.0.0',
    description: 'API documentation for your Node.js application',
  },
  components:{
    securitySchemes:{ 
      bearerAuth:{
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }          
    }
  },


  servers: [
    {
      url:  process.env.SERVER , // Adjust this URL according to your server configuration
    },
  ],
};

// Options for the Swagger JSDoc
const options = {
  swaggerDefinition,
  apis: ['./docs/*.js'], // Path to the files containing Swagger annotations
};

// Initialize Swagger JSDoc
const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/course', courseRoutes);
// Synchronize Sequelize models with database
sequelize.sync()
  .then(() => {
    console.log('User model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing User model:', error);
  });

adminSequelize.sync()
  .then(() => {
    console.log('Admin model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Admin model:', error);
  });

courseSequelize.sync()
  .then(() => {
    console.log('Course model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Course model:', error);
  });
  enrollmentSequelize.sync()
  .then(() => {
    console.log('Enrollment model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Enrollment model:', error);
  });
  couponSequelize.sync()
  .then(() => {
    console.log('Coupon model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Coupon model:', error);
  });
  siteSequelize.sync()
  .then(() => {
    console.log('Site model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Site model:', error);
  });
  contactSequelize.sync()
  .then(() => {
    console.log('Contact model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Contact model:', error);
  });
  videoSequelize.sync()
  .then(() => {
    console.log('Video model synchronized with database');
  })
  .catch((error) => {
    console.error('Error synchronizing Video model:', error);
  });
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
