import React, { useState } from "react";
import { signInWithMicrosoft, signInWithGoogle } from "../firebase";
import "./LoginPage.css";

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (provider: "microsoft" | "google") => {
    try {
      setIsLoading(true);
      setError(null);
      if (provider === "microsoft") {
        await signInWithMicrosoft();
      } else {
        await signInWithGoogle();
      }
    } catch (error: any) {
      setError(error.userMessage || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-utensils">
        <span className="fork">🍴</span>
        <span className="knife">🔪</span>
      </div>
      <div className="queens-logo">
        <div className="queens-text">Queen's University</div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <h1>TAMSACTIONS</h1>
          <p className="subtitle">
            The Meal Marketplace for Queen's University Students
          </p>
        </div>
        <div className="login-content">
          <button
            className="microsoft-button"
            onClick={() => handleSignIn("microsoft")}
            disabled={isLoading}
          >
            <svg
              className="provider-logo"
              width="28"
              height="28"
              viewBox="0 0 28 28"
            >
              <rect width="13" height="13" x="0" y="0" fill="#F35325" />
              <rect width="13" height="13" x="15" y="0" fill="#81BC06" />
              <rect width="13" height="13" x="0" y="15" fill="#05A6F0" />
              <rect width="13" height="13" x="15" y="15" fill="#FFBA08" />
            </svg>
            {isLoading ? "Signing in..." : "Sign in with Microsoft"}
          </button>
          <div className="divider">
            <span>or</span>
          </div>
          <button
            className="google-button"
            onClick={() => handleSignIn("google")}
            disabled={isLoading}
          >
            <svg
              className="provider-logo"
              width="28"
              height="28"
              viewBox="0 0 48 48"
            >
              <g>
                <path
                  fill="#4285F4"
                  d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6-6C36.1 5.1 30.4 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"
                />
                <path
                  fill="#34A853"
                  d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c2.7 0 5.2.9 7.2 2.4l6-6C36.1 5.1 30.4 3 24 3 15.1 3 7.4 8.7 6.3 14.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M24 43c6.2 0 11.4-2 15.2-5.4l-7-5.7C29.7 33.5 27 34.5 24 34.5c-5.6 0-10.3-3.8-12-9l-7.1 5.5C7.4 39.3 15.1 45 24 45z"
                />
                <path
                  fill="#EA4335"
                  d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-3.6 5.5-7.3 6.5l7 5.7C41.6 37.1 44 31.7 44 24c0-1.3-.1-2.7-.4-3.5z"
                />
              </g>
            </svg>
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
