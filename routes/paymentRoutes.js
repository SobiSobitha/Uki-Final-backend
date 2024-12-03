// const express = require('express');
// const router = express.Router();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// // Payment route for Stripe checkout session
// router.post('/create-payment', async (req, res) => {
//   const { selectedPlan } = req.body;

//   try {
//     const price = getPrice(selectedPlan); // Get the price based on the selected plan

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: {
//               name: selectedPlan,
//             },
//             unit_amount: price * 100, // Convert price to cents
//           },
//           quantity: 1,
//         },
//       ],
//       mode: 'payment',
//       success_url: 'http://localhost:3000/complete',
//       cancel_url: 'http://localhost:3000/cancel',
//     });

//     res.json({ sessionId: session.id });
//   } catch (error) {
//     console.error('Error creating payment session:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Helper function to get price based on plan
// const getPrice = (selectedPlan) => {
//   const plans = {
//     basic: 50, // Pricing for the basic plan
//     premium: 100, // Pricing for the premium plan
//     pro: 200, // Pricing for the pro plan
//   };

//   return plans[selectedPlan] || 50; // Default to 50 if no plan matches
// };

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const stripe = require('stripe')('pk_test_51QCeVMBHM9K4XfXk4XrccLUj3myyNHCMkQOjfAUbBC0IaHptv4Zo1jO1KPb9a1XOw3AvX1dxIHeHZfiZrhX68QwF00MfyraEnO'); // Use your Stripe secret key

// /**
//  * Create a payment session for the selected plan
//  * @route POST /api/payments/create-payment
//  */
// router.post('/create-event-payment', async (req, res) => {
//     const { token, planDetails } = req.body; // Assuming frontend sends token and planDetails

//     try {
//         const charge = await stripe.charges.create({
//             amount: planDetails.price, // Price in cents
//             currency: 'usd',
//             source: token.id, // Stripe token from the frontend
//             description: planDetails.name,
//         });

//         res.status(200).json({
//             message: 'Payment successful',
//             charge
//         });
//     } catch (error) {
//         console.error('Payment error:', error);
//         res.status(500).json({
//             message: 'Payment failed',
//             error
//         });
//     }
// });

// module.exports = router;


// /routes/paymentRoutes.js
// const express = require('express');
// const stripe = require('stripe')('sk_test_51QDhbPCtNZOcTVjL2bUivLcrU14o5njnFCC2o1M8uiHquiqjSmMkCEDSfDgqAhcTXGXx4j8NaYo9sJPwzHg8RZgS001Mh4lUei');
// const Payment = require('../models/Payment');
// const router = express.Router();

// router.post('/api/payments/create-event-payment', async (req, res) => {
//   const { userId, planName, amount, token } = req.body;

//   try {
//     // Create a charge with Stripe
//     const charge = await stripe.charges.create({
//       amount: amount,
//       currency: 'usd',
//       source: token,
//       description: `Payment for ${planName}`,
//     });

//     const payment = new Payment({
//       userId: userId,
//       planName: planName,
//       amount: amount,
//       currency: 'usd',
//       stripePaymentId: charge.id,
//       status: 'completed',
//     });

//     await payment.save();
//     res.status(200).json({ message: 'Payment successful', payment });
//   } catch (error) {
//     console.error('Payment error details:', error); // Log full error
//     res.status(500).json({ error: error.message || 'Payment failed' });
//   }
  
// });

// module.exports = router;
const express = require('express');
const paymentController = require('../controllers/paymentController.js'); // Default import
const { protect } = require("../middleware/authMiddleware.js"); // Import the protect middleware

const router = express.Router();

// Route to create a payment intent
router.post('/api/payments/create-event-payment', protect, paymentController.createPaymentIntent); // Remove '/api/payments' from the route

// Route to handle successful payments
router.post('/payment-success', paymentController.handlePaymentSuccess);

// Route to get subscription status
router.get('/subscription-status/:userId', paymentController.getSubscriptionStatus);

module.exports = router;
