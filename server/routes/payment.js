import dotenv from "dotenv";
dotenv.config();

// To handle stripe payments
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Use test key in development, live key in production
const stripeKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_SECRET_KEY
  : (process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY);

const stripe = new Stripe(stripeKey);

router.post('/create-intent', async (req, res) => {
    const { amount } = req.body;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
      });
  
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
        console.error("Stripe Error:", error);        // Log entire error object
        console.error("Stripe Error message:", error.message);  // Log just the message
        res.status(500).json({ error: error.message }); // Send the real message back in response
    }
});

export default router;
