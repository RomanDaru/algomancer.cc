"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validatePassword } from "@/app/lib/utils/validation";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No reset token provided");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setTokenValid(true);
          setUserEmail(data.email);
        } else {
          setError(data.error || "Invalid or expired reset token");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setError("Failed to verify reset token");
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || "Invalid password");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(data.message);

      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='w-full max-w-md p-8 space-y-8 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-algomancy-purple mx-auto'></div>
            <p className='mt-4 text-gray-400'>Verifying reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='w-full max-w-md p-8 space-y-8 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-white'>
              Invalid Reset Link
            </h1>
            <p className='mt-2 text-gray-400'>
              This password reset link is invalid or has expired.
            </p>
            {error && (
              <div className='mt-4 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md'>
                {error}
              </div>
            )}
            <div className='mt-6 space-y-3'>
              <Link
                href='/auth/forgot-password'
                className='block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-purple hover:bg-algomancy-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple text-center'>
                Request New Reset Link
              </Link>
              <Link
                href='/auth/signin'
                className='block text-center font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
      <div className='w-full max-w-md p-8 space-y-8 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-white'>Reset Password</h1>
          <p className='mt-2 text-gray-400'>
            Enter a new password for {userEmail}
          </p>
        </div>

        {success ? (
          <div className='text-center space-y-4'>
            <div className='p-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md'>
              {success}
            </div>
            <p className='text-gray-400'>
              Redirecting to sign in page in 3 seconds...
            </p>
            <Link
              href='/auth/signin'
              className='inline-block font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
              Sign in now
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className='mt-8 space-y-6'
            autoComplete='off'>
            {error && (
              <div className='p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md'>
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-300'>
                New Password
              </label>
              <input
                id='password'
                name='new-password'
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='new-password'
                className='mt-1 block w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple'
                placeholder='Enter new password'
              />
              {password && (
                <div className='mt-2'>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        password.length >= 8 &&
                        /[A-Z]/.test(password) &&
                        /[a-z]/.test(password) &&
                        /[0-9]/.test(password)
                          ? "bg-green-500"
                          : password.length >= 6
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min((password.length / 8) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p
                    className={`mt-1 text-xs ${
                      password.length >= 8 &&
                      /[A-Z]/.test(password) &&
                      /[a-z]/.test(password) &&
                      /[0-9]/.test(password)
                        ? "text-green-400"
                        : password.length >= 6
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}>
                    Password strength:{" "}
                    {password.length >= 8 &&
                    /[A-Z]/.test(password) &&
                    /[a-z]/.test(password) &&
                    /[0-9]/.test(password)
                      ? "Strong"
                      : password.length >= 6
                      ? "Medium"
                      : "Weak"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-300'>
                Confirm New Password
              </label>
              <input
                id='confirmPassword'
                name='confirm-password'
                type='password'
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete='new-password'
                className='mt-1 block w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple'
                placeholder='Confirm new password'
              />
              {confirmPassword && password && (
                <p
                  className={`mt-1 text-sm flex items-center ${
                    confirmPassword === password
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                  <span
                    className={`w-1 h-1 rounded-full mr-2 flex-shrink-0 ${
                      confirmPassword === password
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}></span>
                  {confirmPassword === password
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={
                  isLoading ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword
                }
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-purple hover:bg-algomancy-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple disabled:opacity-50 disabled:cursor-not-allowed'>
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>

            <div className='text-center'>
              <Link
                href='/auth/signin'
                className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
