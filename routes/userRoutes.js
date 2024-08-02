const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const stripeCheckout = require("stripe-checkout");
const Course = require("../models/Course");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Coupon  = require('../models/Coupon')
const Contact  = require('../models/Contact')
const Video = require('../models/Video')
const Pricing = require('../models/Price')
const sendGridMail = require("@sendgrid/mail");
const AWS = require('aws-sdk');
const PDFDocument = require('pdfkit');
const stream = require('stream');
const path = require('path');
const { log } = require("console");
// Define the path to the logo image
const logoPath = path.join(__dirname, 'logo.png');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, 
});
const s3 = new AWS.S3();

const router = express.Router();

const FRONTEND_URL_MAP = {
  1: 'http://localhost:3000',
  2: 'https://www.eductre.com',
  3: 'https://www.gradeage.com',
  4: 'https://www.theprofess.com',
  5: 'https://www.mytutorstation.com',
  6: 'https://www.wishlearners.com',
  7: 'https://www.wiservisions.com',
  8: 'https://www.meritcourses.com',
  9: 'https://www.learnyng.com',
  10: 'https://www.tutorshour.com',
};
const siteNameMap = {
  1: 'GoExpertly', // Hide for siteId 1
  2: 'Eductre',
  3: 'Gradeage',
  4: 'Theprofess',
  5: 'Mytutorstation', 
  6: 'Wishlearners', 
  7: 'Wiservisions', 
  8: 'Meritcourses',
  9: 'Learnyng',
  10: 'Tutorshour',
};
  const logoPathToCopySite=(siteId) =>{ 
    return path.join(__dirname, `logo-${siteNameMap[siteId]}.png`);}
router.post("/signup", async (req, res) => {
  const { email, password, fullName,phone,siteId } = req.body;

  try {
    const existingUser = await User.findOne({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      siteId:siteId?siteId:1
    });
    if (!newUser) { // Handle potential errors during user creation
      return res.status(500).json({ message: "Failed to create user" });
    }
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET
    );
    res.status(201).json({newUser: { id: newUser.id, fullName: newUser.fullName }, token});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sign Up Failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET
    );
    res.status(200).json({ token, userId: user.id,fullName:user.fullName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});
const authenticateUser = (req, res, next) => {
  // Extract token from the Authorization header
  const authHeader  = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed token' });
  }
  // Extract the token part from the header
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user=decoded
    // Pass the decoded payload to the next middleware/route handler
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
// Route to get user details and enrolled courses
router.get('/:userId', authenticateUser, async (req, res) => {
  try {
    const paramUserId = parseInt(req.params.userId, 10);
    const { userId } = req.user;
   // Validate matching userIds
   if (paramUserId !== userId) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }
    // Find user and enrollments in a single database query
    const [user, enrollments] = await Promise.all([
      User.findByPk(userId),
      Enrollment.findAll({ where: { userId } })
    ]);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle empty enrollments gracefully
    if (!enrollments) {
      enrollments = [];
    }

    // Fetch course details efficiently
    const detailedCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const pricing = await Pricing.findByPk(enrollment.priceId);
        const course = await Course.findByPk(enrollment.courseId);
        let videoLink = null;
        const allowedSessionTypes = [
          "Recorded session",
          "Live Plus Recorded session",
          "Recorded Plus Transcript session"
        ];
        if (allowedSessionTypes.includes(pricing.sessionType)) {
          const video = await Video.findOne({ where: { courseId: enrollment.courseId } });
          videoLink = video?.videoUrl || null;
          console.log(videoLink);
        }
        //const videoLink = 'https://goexpertly-bucket.s3.amazonaws.com/WEBINARS/Best+of+Dolby+Vision+12K+HDR+120fps.mp4';
        return { ...enrollment.dataValues, ...course.dataValues, videoLink }; // Combine enrollment and course data
      })
    );

    // Return user details and enrolled courses (including detailed courses)
    res.json({ user, enrolledCourses: detailedCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.post("/reset-password",authenticateUser, async (req, res) => {
  const {oldPassword, newPassword } = req.body;
  const {email} = req.user
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid old password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Password reset failed" });
  }
});

router.post("/enroll",authenticateUser, async (req, res) => {
  const {cartItems, couponCode,siteId } = req.body;
  const {userId} = req.user
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const coursePrices = [];
    const sessionPricesIds = [];
    for (const item of cartItems) {
      const course = await Course.findByPk(item.courseID);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      // Find the user-selected pricing option based on item.priceId
      const sessionPrice = await Pricing.findByPk(item.selectedPricing.id);
      const coursePrice = sessionPrice ? sessionPrice.price * 100 : (course.discountedPrice || course.price) * 100; 
      coursePrices.push(coursePrice);
      sessionPricesIds.push(sessionPrice.id);
    }

    // Validate and apply coupon (if provided)
    let discountApplied = false;
    let totalAmount = coursePrices.reduce((sum, price) => sum + price, 0);
    let coupon;
    if (couponCode) {
      coupon = await Coupon.findOne({ where: { code: couponCode, isActive: true } }); // Find active coupon by code
      if (coupon) {
        discountApplied = true;
        if (coupon.discountType === "percentage") {
          const discountAmount = totalAmount * (coupon.discountValue / 100);
          totalAmount -= discountAmount;
        } else if (coupon.discountType === "fixed_amount") {
          const discountAmount = Math.min(totalAmount, coupon.discountValue * 100); // Limit discount to total amount
          totalAmount -= discountAmount;
        } else {
          return res.status(400).json({ message: "Invalid coupon discount type" });
        }
      } else {
        return res.status(404).json({ message: "Invalid or inactive coupon code" });
      }
    }
    let courseInfoString = cartItems.reduce((acc, item) => `${acc}${item.courseID},`,"");
    if (courseInfoString.length > 0) {
      courseInfoString = courseInfoString.slice(0, -1); // Remove the last two characters (", ")
    }
    const FRONTEND_URL = siteId ? FRONTEND_URL_MAP[siteId] : FRONTEND_URL_MAP[1];
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      metadata: {
        userId,
        courseInfoString,
        couponCode,
        siteId:siteId?siteId:1,
        priceIds:sessionPricesIds.join(",")
      },
      line_items: cartItems.map((item, index) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${coursePrices[index]} - ${ item.course_name}`, // Include price in title
            description: `Name: ${item.creator}, Session Type: ${item.selectedPricing.sessionType}`,
          },
          unit_amount: discountApplied ? Math.round(coursePrices[index] * (1 - coupon.discountValue / 100)) : coursePrices[index],
        },
        quantity: 1,
      })),
      mode: "payment",
      success_url: `${FRONTEND_URL}/payment-success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancel`,
      billing_address_collection: 'required',
    });
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create enrollment session" });
  }
});

router.get("/enrollment/success", async (req, res) => {
  const sessionId = req.query.session_id;
  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    //console.log(checkoutSession);
    if (checkoutSession.payment_status === "paid") {
      const userId = checkoutSession.metadata.userId;
      const couponCode=checkoutSession.metadata.couponCode;
      const courseIdsString = checkoutSession.metadata.courseInfoString;
      const courseIds = courseIdsString.split(",");
      const addressData = checkoutSession.customer_details.address
      const siteId = checkoutSession.metadata.siteId
    // Extract price IDs from metadata (considering potential errors)
    console.log(checkoutSession.metadata);
    let priceIds;
    try {
      priceIds = checkoutSession.metadata.priceIds.includes(',')? 
      priceIds = checkoutSession.metadata.priceIds.split(','):
      priceIds = [checkoutSession.metadata.priceIds];
    } catch (error) {
      console.error("Error parsing priceIds:", error);
      priceIds = []; // Handle gracefully if parsing fails
    }        // Loop through course IDs and create enrollments
    console.log(priceIds);
      const enrollments = [];
      const rowData = [];
      for (const courseId of courseIds) {
      const priceId = priceIds.shift();
      let coursePrice;
      try {
        coursePrice = await Pricing.findByPk(priceId);
      } catch (error) {
        console.error("Error finding price for course:", courseId, error);
        coursePrice = null; // Handle case where price lookup fails
      }
      sessionType = coursePrice.sessionType;
      const enrollment = await Enrollment.create({ userId, courseId,siteId,priceId,sessionType }, { returning: true });
      enrollments.push(enrollment); // Add enrollment object to the array
      
      // Populate rowData dynamically
      const course = await Course.findByPk(enrollment.courseId);
      console.log(coursePrice);
      rowData.push({
        webinarName: course.title,
        format:coursePrice ? coursePrice.sessionType : "Unknown", 
        unitPrice: coursePrice?.price||course.discountedPrice||course.price,
        discount: 0,
        description:course.description,
        sessionType: coursePrice ? coursePrice.sessionType : "Unknown"        });
      }
      const now = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber=`${enrollments[0].id}${now}`
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await Course.findByPk(enrollment.courseId);
          return { course, enrollment }; // Return an object with course and enrollment details
        })
      );
      // Apply coupon logic (assuming couponCode is retrieved from checkoutSession)
      let totalOriginalPrice = 0;
      let totalDiscount = 0;
      const coupon = await Coupon.findOne({
        where: {
          code: couponCode,
          isActive: true,
        },
      });

      if (coupon) {
        for (const item of rowData) {
          const unitPriceNumber = parseFloat(item.unitPrice);
          let discountedPrice = unitPriceNumber;
          if (coupon.discountType === 'percentage') {
            discountedPrice = unitPriceNumber * (coupon.discountValue / 100);
          } else if (coupon.discountType === 'fixed_amount') {
            discountedPrice = Math.max(unitPriceNumber - coupon.discountValue, 0); // Ensure price doesn't go below zero
          }
          item.discount = discountedPrice; // Update total price in rowData with discount applied

          totalOriginalPrice += unitPriceNumber;
          totalDiscount += discountedPrice;
        }
      } else {
        // No coupon applied, use original prices
        for (const item of rowData) {  
          const unitPriceNumber = parseFloat(item.unitPrice);
          totalOriginalPrice += unitPriceNumber;
        }
      }
const total = totalOriginalPrice.toFixed(2)-totalDiscount.toFixed(2);
      // Generate PDF
      const doc = new PDFDocument();
      const pdfStream = new stream.PassThrough();
      const uploadParams = {
        Bucket: 'goexpertly-bucket/invoices',
        Key: `invoice_${orderNumber}.pdf`,
        Body: pdfStream,
        ContentType: 'application/pdf',
      };

      // Upload to S3
      const s3Upload = s3.upload(uploadParams).promise();

      pdfStream.on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).json({ message: "Failed to process PDF stream" });
      });

      // Pipe the document to the stream
      doc.pipe(pdfStream);
      // Pipe the PDF into a writable stream
      doc.image(logoPath, 25,5, { width: 150 }); // Adjust position and size as needed
      if (siteId !== "1") { 
        doc.image(logoPathToCopySite(siteId), 300, 5, { width: 150 });
      }
      // Move the cursor down to start writing text below the logo
      doc.moveDown(3);
    // Header
      doc.fontSize(12);

      // Address and Contact Info
      doc
        .text("1968 S Coast Hwy", 50, 150) // Position next to the logo
        .text("30 N Gould St STE R,", 50)
        .text("Sheridan WY 82801", 50)
        .text("Telephone: +1 (407) 413 9004", 50)
        .text("support@goexpertly.com", 50)
        .text("https://goexpertly.com", 50);


    // Order Information
    doc
    .font("Helvetica-Bold")
    .text("Date: ", 300, 150)
    .font("Helvetica")
    .text(new Date().toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 410, 150)
    .font("Helvetica-Bold")
    .text("Order ID: ", 300, 170)
    .font("Helvetica")
    .text(`${orderNumber}`, 410, 170)
    .font("Helvetica-Bold")
    .text("Payment Method: ", 300, 190)
    .font("Helvetica")
    .text("Stripe/Card (Paid)", 410, 190)
    .moveDown(3);

    // Customer Information
    doc
    .font("Helvetica-Bold")
    .text("Customer", 50, 250, { underline: true })
    .moveDown(0.5)
    .font("Helvetica")
    .text(user.fullName, { align: "left" })
    // .text("9806995591")
    .text(user.email)
    doc
    .font("Helvetica-Bold")
    .text("Bill To", 300, 250, { underline: true })
    .moveDown(0.5)
    .font("Helvetica")
    .text(addressData.line1)
    .moveDown(0.2) 
    if (addressData.line2) {
      doc.text(addressData.line2).moveDown(0.2); // Add line2 with spacing
    }
    doc.text(`${addressData.city}, ${addressData.state} ${addressData.postal_code}`)
    .moveDown(3);
    // Course Information
   // Table Header
const tableHeaderX = 50; // X position for the table header
const tableHeaderY = doc.y; // Y position for the table header
const columnWidth = 130; // Width for each column

doc
  .font("Helvetica-Bold")
  .text("Webinar Name", tableHeaderX, tableHeaderY, {
    width: columnWidth,
    align: "left",
  }) // Adjust the width and alignment as needed
  .text("Format", tableHeaderX + columnWidth, tableHeaderY, {
    width: columnWidth,
    align: "center",
  })
  .text("Unit Price", tableHeaderX + columnWidth * 2, tableHeaderY, {
    width: columnWidth,
    align: "center",
  })
  .text("Total", tableHeaderX + columnWidth * 3, tableHeaderY, {
    width: columnWidth,
    align: "right",
  })
  .moveDown(0.5)
  .font("Helvetica");

const rowHeight = 20; // Height for each row

rowData.forEach((row, index) => {
  const rowY = doc.y + index * rowHeight; // Calculate Y position for each row

  doc
    .text(row.webinarName, tableHeaderX, rowY, {
      width: columnWidth,
      align: "left",
    }) // Adjust the width and alignment as needed
    .text(row.format, tableHeaderX + columnWidth, rowY, {
      width: columnWidth,
      align: "center",
    })
    .text(`$${row.unitPrice}`, tableHeaderX + columnWidth * 2, rowY, {
      width: columnWidth,
      align: "center",
    })
    .text(`$${row.unitPrice}`, tableHeaderX + columnWidth * 3, rowY, {
      width: columnWidth,
      align: "right",
    });
    doc.moveDown(2);
});

// Sub-Total, Discount, Total
const subTotalY = doc.y + rowHeight * rowData.length + 20; // Calculate Y position for the sub-total section
doc.moveDown(1);
doc
  .font("Helvetica-Bold")
  .text("Sub-Total:", columnWidth * 3, subTotalY, {
    width: columnWidth,
    align: "right",
  })
  .font("Helvetica")
  .text(`$${totalOriginalPrice.toFixed(2)}`, 20 + columnWidth * 4, subTotalY, {
    width: columnWidth,
    align: "left",
  })
  .moveDown(0.5)
  .font("Helvetica-Bold")
  .text("Discount:", columnWidth * 3, subTotalY + rowHeight, {
    width: columnWidth,
    align: "right",
  })
  .font("Helvetica")
  .text(`$${totalDiscount.toFixed(2)}`, 20 + columnWidth * 4, subTotalY + rowHeight, {
    width: columnWidth,
    align: "left",
  })
  .moveDown(0.5)
  .font("Helvetica-Bold")
  .text("Total:", columnWidth * 3, subTotalY + rowHeight * 2, {
    width: columnWidth,
    align: "right",
  })
  .font("Helvetica")
  .text(`$${total.toFixed(2)}`, 20 + columnWidth * 4, subTotalY + rowHeight * 2, {
    width: columnWidth,
    align: "left",
  })
  .moveDown(5);

// Footer
const siteName= siteNameMap[siteId]
const footerText = siteId === "1" ? '' : `${siteName} is owned and operated by Expertly LLC. (Kindly note: the charge on your card will be from Expertly)`;
doc
  .fontSize(10)
  .text(
    footerText,
    50
  )

doc.end();
      // Wait for the upload to finish
      const s3Response = await s3Upload;
      // Fetch the file from S3 to get the buffer for the email attachment
      const fileStream = s3.getObject({
        Bucket: 'goexpertly-bucket/invoices',
        Key: `invoice_${orderNumber}.pdf`
      }).createReadStream();

      let buffer = Buffer.from([]);
      fileStream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      });
     fileStream.on('end', async () => {
      const msg = {
        to: checkoutSession.customer_email,
        from: "support@goexpertly.com",
        subject: "Course Enrollment Successful",
        text: `Hello,

        You have successfully enrolled in the following courses:

        ${rowData.map((row) => `* ${row.webinarName}\n  Course Description: ${row.description}\n`).join('\n')}

        Thank you for your purchase!

        **Kindly note - For live session the invitation to join will be sent 24 hours prior to the training and for recorded session the training would be available within 24hrs of the completion of the training.**
        
        Best regards,
        Your Course Team`,
        html: `<strong>Hello,</strong><br><br>You have successfully enrolled in the following courses:<br><br>

        ${rowData.map((row) => `* <strong>${row.webinarName}</strong><br>  Course Description: ${row.description}<br>`).join('<br>')}

        Thank you for your purchase!<br><br>
        **Kindly note - For live session the invitation to join will be sent 24 hours prior to the training and for recorded session the training would be available within 24hrs of the completion of the training.**<br><br>
        Best regards,<br>
        Your Course Team`,
        attachments: [
          {
            content:buffer.toString('base64'),
            filename: `invoice_${orderNumber}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
      };
      
      await sendGridMail.send(msg);
      for (const enrollment of enrollments) {
        await enrollment.update({ invoiceUrl: s3Response.Location });
      }
      res.status(200).json({
        message: "Enrollment successful",
        enrolledCourses,
      });
    });

    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ message: "Failed to fetch PDF from S3" });
    });
    } else {
      console.error("Payment failed on Stripe Checkout");
      res.status(500).json({ message: "Enrollment failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to process enrollment" });
  }
});

router.post('/coupons/apply', async (req, res) => {
  try {
    const { code, cartItems } = req.body; // Assuming cartItems is an array of objects

    if (!code || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const today = new Date();

    const coupon = await Coupon.findOne({
      where: {
        code,
        isActive: true,
      },
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    let totalOriginalPrice = 0;
    let totalDiscountedPrice = 0;

    for (const item of cartItems) {
      const { courseID, quantity=1 } = item;
      // Fetch product details (assuming you have a Product model)
      const course = await Course.findByPk(courseID);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Calculate discounted price
      const coursePrice = item?.selectedPricing?.price||course.discountedPrice||course.price;
      let discountedPrice =coursePrice;
        if (coupon.discountType === 'percentage') {
          discountedPrice = coursePrice * (coupon.discountValue / 100);
        } else if (coupon.discountType === 'fixed_amount') {
          discountedPrice = Math.max(coursePrice - coupon.discountValue, 0); // Ensure price doesn't go below zero
        }
      

      totalOriginalPrice += coursePrice * quantity;
      totalDiscountedPrice += discountedPrice * quantity;

      // Update the item object with the discounted price for frontend display (optional)
      item.discountedPrice = discountedPrice;
    }
    const finalPrice = (totalOriginalPrice-totalDiscountedPrice).toFixed(2);
    res.status(200).json({
      message: 'Coupon applied successfully!',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalTotal: totalOriginalPrice,
      discountedTotal: totalDiscountedPrice,
      finalPrice: finalPrice,
      cartItems, // Include cart items with optional discountedPrice field
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.post('/contactus', async (req, res) => {
  try {
    // Validate required fields
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Create the contact data for database storage
    const newContactData = {
      name: `${firstName} ${lastName}`,
      email,
      message,
      current_role: req.body.currentRole || null,
      company_name: req.body.companyName || null,
      company_address: req.body.companyAddress || null,
      city: req.body.city || null,
      country: req.body.country || null,
    };
    const newContact = await Contact.create(newContactData);
    // Create the email content
    const msg = {
      to: 'syed.p@goexpertly.com', 
      from: "support@goexpertly.com", // Use the sender's email for a personalized touch
      subject: `Contact Us Inquiry from ${firstName} ${lastName}`,
      text: `
        **Name:** ${firstName} ${lastName}
        **Email:** ${email}
        **Current Role:** ${req.body.currentRole || 'N/A'} 
        **Company Name:** ${req.body.companyName || 'N/A'} 
        **Company Address:** ${req.body.companyAddress || 'N/A'}
        **City:** ${req.body.city || 'N/A'}  
        **Country:** ${req.body.country || 'N/A'}  
        **Message:** ${message}
      `,
    };

    // Send the email with error handling
    await sendGridMail.send(msg)
      .then(() => {
        res.status(200).json({ message: 'Your message has been sent successfully!' });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ message: 'Internal server error. Please try again later.' });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;
