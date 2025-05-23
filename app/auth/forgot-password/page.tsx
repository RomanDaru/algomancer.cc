"use client";

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/app/lib/utils/validation";
import emailjs from "@emailjs/browser";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || "Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // If we have email data, send the reset email via EmailJS
      if (data.emailData) {
        try {
          await emailjs.send(
            "service_cxh2b2a", // Your EmailJS service ID
            "template_dx9xbk6", // Your password reset template ID
            data.emailData,
            "bwTGKiVLZWWg4QG2M" // Your EmailJS public key
          );
          console.log("Password reset email sent successfully");
        } catch (emailError) {
          console.error("Failed to send reset email:", emailError);
          // Still show success to user to prevent email enumeration
        }
      }

      setSuccess(data.message);
      setEmail(""); // Clear the form
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
      <div className='w-full max-w-md p-8 space-y-8 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-white'>Forgot Password</h1>
          <p className='mt-2 text-gray-400'>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          {error && (
            <div className='p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md'>
              {error}
            </div>
          )}

          {success && (
            <div className='p-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md'>
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-300'>
              Email Address
            </label>
            <input
              id='email'
              name='email'
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='mt-1 block w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple'
              placeholder='your@email.com'
            />
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-purple hover:bg-algomancy-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple disabled:opacity-50 disabled:cursor-not-allowed'>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>

          <div className='flex items-center justify-center space-x-4 text-sm'>
            <Link
              href='/auth/signin'
              className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
              Back to Sign In
            </Link>
            <span className='text-gray-400'>•</span>
            <Link
              href='/auth/signup'
              className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
