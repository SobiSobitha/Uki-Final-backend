const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Updated payment routes included
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const feedbackRoutes = require('./routes/FeedbackRoutes')
const Contact = require('./models/Contact');
const nodemailer = require('nodemailer');

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(cors({
    origin: 'http://localhost:3000', // Allow only your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'], // Specify allowed methods
    credentials: true, // Allow credentials
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Route handling
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes); // Added payment route handling
app.use('/api/admin', adminRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});
// app.post('/api/feedback/:eventId', (req, res) => {
//     const { eventId } = req.params;
//     const { feedback } = req.body;

//     if (!feedback) {
//         return res.status(400).json({ message: 'Feedback is required' });
//     }

//     // Assuming feedback gets saved to the database or processed here
//     console.log(`Feedback for event ${eventId}: ${feedback}`);

//     // Respond with success message as JSON
//     res.status(200).json({ message: 'Feedback submitted successfully' });
// });
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: 'info@voluntry.com', // your email
      pass: 'Voluntry63', // your email password or app password
    },
  });
  app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
  
    // Validate incoming data
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
  
    const contact = new Contact({ name, email, message });
  
    try {
      await contact.save();
      res.status(200).json({ message: 'Contact details received.' });
    } catch (error) {
      console.error('Error saving message:', error); // Log the specific error
      res.status(500).json({ message: 'Error saving message.' });
    }
  });
  app.get('/api/contact/messages', async (req, res) => {
    console.log("Fetching contact messages..."); // Add this line
    try {
      const messages = await Contact.find();
      console.log("Contact messages fetched:", messages); // Add this line
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      res.status(500).json({ message: 'Error fetching contact messages.' });
    }
  });
  

// Start the server
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
