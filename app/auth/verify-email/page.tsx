"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyStatus = "loading" | "success" | "error";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified successfully.");
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
      <div className='w-full max-w-md p-8 space-y-6 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-white'>Email Verification</h1>
          <p className='mt-2 text-gray-400'>{message}</p>
        </div>

        {status === "success" && (
          <div className='p-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md text-center'>
            You can now sign in to your account.
          </div>
        )}

        {status === "error" && (
          <div className='p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md text-center'>
            Please request a new verification email or contact support.
          </div>
        )}

        <div className='flex items-center justify-center space-x-4 text-sm'>
          <Link
            href='/auth/signin'
            className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
            Sign In
          </Link>
          <span className='text-gray-400'>|</span>
          <Link
            href='/auth/signup'
            className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple mx-auto mb-4'></div>
            <p className='text-white text-lg'>Loading...</p>
          </div>
        </div>
      }>
      <VerifyEmailInner />
    </Suspense>
  );
}
