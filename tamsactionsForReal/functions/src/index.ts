/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from "stripe";
import cors = require('cors');

admin.initializeApp();

const corsMiddleware = cors({ origin: true });
const stripe = new Stripe("YOUR_STRIPE_SECRET_KEY", { apiVersion: "2023-10-16" });

export const createPaymentIntent = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({ error: { message: 'Method not allowed' } });
        return;
      }

      const { amount, currency = 'usd' } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: { message: 'Invalid amount' } });
        return;
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Stripe expects amount in cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Send client secret to client
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        error: {
          message: 'An error occurred while creating the payment intent.',
        },
      });
    }
  });
});

export const createStripeCheckoutSession = functions.https.onRequest(async (req, res) => {
  try {
    const { amount, tamAmount, pricePerTam, userEmail } = req.body;

    // Validate input
    if (!amount || !tamAmount || !pricePerTam || !userEmail) {
      res.status(400).send("Missing required fields");
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tamAmount} TAMs`,
              description: `Purchase of ${tamAmount} TAMs at $${pricePerTam} each`,
            },
            unit_amount: Math.round(amount * 100), // cents
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: "https://YOUR_APP_URL/dashboard?success=true",
      cancel_url: "https://YOUR_APP_URL/dashboard?canceled=true",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
