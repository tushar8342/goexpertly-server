// routes/adminRoutes.js
/**
 * @swagger
 * tags:
 *   name: Admin Authentication
 *   description: Admin authentication endpoints
 */
/**
 * @swagger
 * /admin/signup:
 *   post:
 *     summary: Register a new admin
 *     description: Register a new admin with email and password
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Login with email and password
 *     description: Login with email and password to obtain a JWT token
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []  # Use JWT token from admin login
 *     responses:
 *       '200':
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: 'models\User.js'
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */

// routes/userRoutes.js
/**
 * @swagger
 * tags:
 *   name: User Authentication
 *   description: User authentication endpoints
 */
/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with email and password
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login with email and password
 *     description: Login with email and password to obtain a JWT token
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset the password for a regular user
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: OK - Password reset successful
 *       '401':
 *         description: Unauthorized - Invalid old password
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/users/{userId}:
 *   put:
 *     summary: Update user information
 *     description: Update user information by admin
 *     tags: [Admin Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 * 
 *   delete:
 *     summary: Delete user
 *     description: Delete user by admin
 *     tags: [Admin Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieve a list of all courses
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []  # Use JWT token from admin login
 *     responses:
 *       '200':
 *         description: A list of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/courses/{course_id}:
 *   get:
 *     summary: Get course details
 *     description: Retrieve details of a specific course
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []  # Use JWT token from admin login
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       '200':
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *       '404':
 *         description: Course not found
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/courses:
 *   post:
 *     summary: Create a new course
 *     description: Create a new course with title, description, instructor ID, and price
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []  # Use JWT token from admin login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the course.
 *                 maxLength: 255  # Optional: Limit title length
 *               description:
 *                 type: string
 *                 description: Detailed description of the course.
 *               imageSrc:  # New field for image URL
 *                 type: string
 *                 description: URL of the course image.
 *               instructors:  # Array of instructor names (optional)
 *                 type: array
 *                 items:
 *                   type: string
 *               duration:      # Duration in minutes (optional)
 *                 type: integer
 *               price:
 *                 type: number
 *                 description: Price of the course.
 *                 format: float
 *               discountedPrice:  # Discounted price (optional)
 *                 type: number
 *                 format: float
 *               rating:        # Average rating (optional)
 *                 type: number
 *                 format: float
 *               numReviews:     # Number of reviews (optional)
 *                 type: integer
 *               detailsLink:    # Link to course details page (optional)
 *                 type: string
 *               features:       # Array of features (optional)
 *                 type: array
 *                 items:
 *                   type: string
 *               what_you_will_learn:
 *                 type: string
 *                 description: Detailed description of the what will you learn.
 *               content:
 *                 type: string
 *                 description: Detailed description of the content. 
 *                  
 *     responses:
 *       '201':
 *         description: Course created successfully.
 *       '400':
 *         description: Bad request (e.g., missing required field, invalid data type)
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/courses/{course_id}:
 *   put:
 *     summary: Update course details
 *     description: Update details of a specific course
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []  # Use JWT token from admin login
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instructorID:
 *                 type: integer
 *               price:
 *                 type: integer
 *                 format: float 
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Course not found
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/courses/{course_id}:
 *   delete:
 *     summary: Delete course
 *     description: Delete a specific course
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []  # Use JWT token from admin login
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Course not found
 *       '500':
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/courses/search:
 *   get:
 *     summary: Search courses
 *     description: Search for courses by title
 *     tags: [Course Management]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Title of the course to search for
 *     responses:
 *       '200':
 *         description: A list of courses matching the search query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *       '500':
 *         description: Internal server error
 */