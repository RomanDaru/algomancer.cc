"use client";

import { useState, useCallback, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordStrengthIndicator from "@/app/components/PasswordStrengthIndicator";
import {
  validatePassword,
  validateEmail,
  validateUsername,
} from "@/app/lib/utils/validation";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const register = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Clear previous errors
      setError("");
      setEmailError("");
      setUsernameError("");
      setPasswordError("");
      setConfirmPasswordError("");

      // Validate all fields
      let hasErrors = false;

      // Validate name
      if (!name.trim()) {
        setError("Name is required");
        hasErrors = true;
      }

      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error || "Invalid email");
        hasErrors = true;
      }

      // Validate username
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        setUsernameError(usernameValidation.error || "Invalid username");
        hasErrors = true;
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError("Password does not meet requirements");
        hasErrors = true;
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        hasErrors = true;
      }

      if (hasErrors) {
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            username,
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Something went wrong");
          return;
        }

        // Sign in the user after successful registration
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/",
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        router.push("/");
      } catch (error) {
        console.error(error);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [name, username, email, password, confirmPassword, router]
  );

  // Real-time validation handlers
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError && value) {
      const validation = validateEmail(value);
      if (validation.isValid) {
        setEmailError("");
      }
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError && value) {
      const validation = validateUsername(value);
      if (validation.isValid) {
        setUsernameError("");
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmPasswordError && value) {
      if (value === password) {
        setConfirmPasswordError("");
      }
    }
  };

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
      <div className='w-full max-w-md p-8 space-y-8 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-white'>Create an Account</h1>
          <p className='mt-2 text-gray-400'>Join the Algomancer community</p>
        </div>

        <form onSubmit={register} className='mt-8 space-y-6'>
          {error && (
            <div className='p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md'>
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-300'>
              Name <span className='text-red-500'>*</span>
            </label>
            <input
              id='name'
              name='name'
              type='text'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='mt-1 block w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple'
              placeholder='Your name'
            />
          </div>

          <div>
            <label
              htmlFor='username'
              className='block text-sm font-medium text-gray-300'>
              Username <span className='text-red-500'>*</span>
            </label>
            <input
              id='username'
              name='username'
              type='text'
              required
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple ${
                usernameError ? "border-red-500" : "border-algomancy-purple/30"
              }`}
              placeholder='Choose a username'
            />
            {usernameError && (
              <p className='mt-1 text-sm text-red-400'>{usernameError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-300'>
              Email <span className='text-red-500'>*</span>
            </label>
            <input
              id='email'
              name='email'
              type='email'
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple ${
                emailError ? "border-red-500" : "border-algomancy-purple/30"
              }`}
              placeholder='your@email.com'
            />
            {emailError && (
              <p className='mt-1 text-sm text-red-400'>{emailError}</p>
            )}
          </div>

          <PasswordStrengthIndicator
            password={password}
            value={password}
            onChange={setPassword}
            placeholder='••••••••'
            showStrength={true}
            showToggle={true}
          />
          {passwordError && (
            <p className='text-sm text-red-400 mt-1'>{passwordError}</p>
          )}

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-300 mb-1'>
              Confirm Password <span className='text-red-500'>*</span>
            </label>
            <input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              required
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className={`block w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple ${
                confirmPasswordError
                  ? "border-red-500"
                  : "border-algomancy-purple/30"
              }`}
              placeholder='••••••••'
            />
            {confirmPasswordError && (
              <p className='mt-1 text-sm text-red-400'>
                {confirmPasswordError}
              </p>
            )}
            {confirmPassword && password && confirmPassword === password && (
              <p className='mt-1 text-sm text-green-400 flex items-center'>
                <span className='w-1 h-1 bg-green-400 rounded-full mr-2 flex-shrink-0'></span>
                Passwords match
              </p>
            )}
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-purple hover:bg-algomancy-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple disabled:opacity-50 disabled:cursor-not-allowed'>
              {isLoading ? "Creating account..." : "Sign Up"}
            </button>
          </div>

          <div className='flex items-center justify-center'>
            <div className='text-sm'>
              <span className='text-gray-400'>Already have an account?</span>{" "}
              <Link
                href='/auth/signin'
                className='font-medium text-algomancy-purple hover:text-algomancy-purple-light'>
                Sign in
              </Link>
            </div>
          </div>

          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-700'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-algomancy-darker text-gray-400'>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='mt-6'>
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className='w-full flex justify-center py-2 px-4 border border-algomancy-purple/30 rounded-md shadow-sm text-sm font-medium text-white bg-algomancy-dark hover:bg-algomancy-dark/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-algomancy-purple'>
                <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                  <path
                    fill='currentColor'
                    d='M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z'
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
