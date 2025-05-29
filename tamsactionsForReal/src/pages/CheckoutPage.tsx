import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import "./CheckoutPage.css";

const stripePromise = loadStripe(
  "pk_test_51R2LwII1IKSpNneXH9s6LPdJ4PefsMIlRshlSZmCqutceEMYpnZbb8CbE62lD6JopxYNbTUXCykusgc2uY4sItQK00iwPih28b"
);

interface CheckoutFormProps {
  tamAmount: number;
  pricePerTam: number;
  totalPrice: number;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  tamAmount,
  pricePerTam,
  totalPrice,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!auth.currentUser) {
      setError("You must be signed in to make a purchase.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      // Call your Firebase function to create a Stripe Checkout session
      const response = await fetch(
        "https://us-central1-tamsactions.cloudfunctions.net/createStripeCheckoutSession",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalPrice, // e.g. 374.50
            tamAmount,
            pricePerTam,
            userEmail: auth.currentUser.email,
          }),
        }
      );
      const session = await response.json();
      if (!session.id) {
        throw new Error("Failed to create Stripe session");
      }
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Checkout error:", error);
      setError(
        "An error occurred while initiating the checkout. Please try again."
      );
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-summary">
        <h3>Order Summary</h3>
        <div className="summary-details">
          <div className="summary-row">
            <span>Amount:</span>
            <span>{tamAmount} TAMs</span>
          </div>
          <div className="summary-row">
            <span>Price per TAM:</span>
            <span>${pricePerTam.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        disabled={processing}
        className={`pay-button ${processing ? "processing" : ""}`}
      >
        {processing ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
      </button>
    </form>
  );
};

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tamAmount, pricePerTam, totalPrice } = location.state || {};

  // Handle successful payment return
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isSuccess = searchParams.get("success") === "true";
    const returnedListingId = searchParams.get("listingId");
    const returnedTamAmount = searchParams.get("tamAmount");

    if (isSuccess && returnedListingId && returnedTamAmount) {
      const updateBalanceAndListing = async () => {
        try {
          const listingRef = doc(db, "listings", returnedListingId);
          const buyerRef = doc(db, "users", auth.currentUser!.uid);
          const buyerDoc = await getDoc(buyerRef);
          const currentBalance = buyerDoc.data()?.tamBalance || 0;

          await Promise.all([
            updateDoc(listingRef, {
              status: "completed",
            }),
            updateDoc(buyerRef, {
              tamBalance: currentBalance + parseInt(returnedTamAmount),
            }),
          ]);

          navigate("/dashboard", {
            state: {
              message:
                "Payment successful! TAMs have been added to your balance.",
            },
          });
        } catch (error) {
          console.error("Error updating balance:", error);
        }
      };

      updateBalanceAndListing();
    }
  }, [location, navigate]);

  if (!tamAmount || !pricePerTam || !totalPrice) {
    return (
      <div className="checkout-container">
        <div className="error-message">
          Invalid checkout session. Please try again.
        </div>
        <button onClick={() => navigate("/dashboard")} className="back-button">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <button onClick={() => navigate("/dashboard")} className="back-button">
        ← Back to Dashboard
      </button>
      <div className="checkout-content">
        <h2>Complete Your Purchase</h2>
        <CheckoutForm
          tamAmount={tamAmount}
          pricePerTam={pricePerTam}
          totalPrice={totalPrice}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;
