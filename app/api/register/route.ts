import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import mongoose from "@/app/lib/db/mongodb";
import {
  validatePassword,
  validateEmail,
  validateUsername,
} from "@/app/lib/utils/validation";
import {
  sanitizeUserRegistration,
  containsSuspiciousContent,
} from "@/app/lib/utils/sanitization";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { name, username, email, password } = await request.json();

    // Check for suspicious content before processing
    const inputs = [name, username, email].filter(Boolean);
    if (inputs.some((input) => containsSuspiciousContent(input))) {
      return NextResponse.json(
        { error: "Invalid characters detected in input" },
        { status: 400 }
      );
    }

    // Sanitize inputs comprehensively
    const sanitized = sanitizeUserRegistration({
      name,
      username,
      email,
    });

    const finalEmail = sanitized.email.toLowerCase();

    // Validate input
    if (!sanitized.name || !finalEmail || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(finalEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate username if provided
    if (sanitized.username) {
      const usernameValidation = validateUsername(sanitized.username);
      if (!usernameValidation.isValid) {
        return NextResponse.json(
          { error: usernameValidation.error || "Invalid username" },
          { status: 400 }
        );
      }
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password does not meet security requirements" },
        { status: 400 }
      );
    }

    // Connect to MongoDB using Mongoose
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "");
      } catch (connError) {
        console.error("MongoDB connection error:", connError);
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }
    }

    const db = mongoose.connection.db;

    // Check if user already exists with the same email
    const existingUserByEmail = await db.collection("users").findOne({
      email: finalEmail,
    });
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if username is already taken (if provided)
    if (sanitized.username) {
      const existingUserByUsername = await db
        .collection("users")
        .findOne({ username: sanitized.username });
      if (existingUserByUsername) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const result = await db.collection("users").insertOne({
      name: sanitized.name,
      username: sanitized.username || null, // Store username if provided, otherwise null
      email: finalEmail,
      hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      emailVerified: null,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: verificationTokenExpiry,
    });

    const verificationUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/auth/verify-email?token=${verificationToken}`;

    return NextResponse.json(
      {
        id: result.insertedId,
        name: sanitized.name,
        username: sanitized.username || null,
        email: finalEmail,
        emailData: {
          to_email: finalEmail,
          subject: "Confirm your Algomancer.cc account",
          heading: "Confirm your email",
          user_name: sanitized.name,
          message:
            "Thanks for registering. Please confirm your email to activate your account.",
          action_text: "Confirm email",
          action_url: verificationUrl,
          expiry_text: "This link will expire in 24 hours.",
          footer:
            "If you did not create this account, you can ignore this email.<br>This email was sent from <strong>Algomancer.cc</strong>",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in register route:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
