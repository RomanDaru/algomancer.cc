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

    // Validate input
    if (!sanitized.name || !sanitized.email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(sanitized.email);
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
      email: sanitized.email,
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

    // Create user
    const result = await db.collection("users").insertOne({
      name: sanitized.name,
      username: sanitized.username || null, // Store username if provided, otherwise null
      email: sanitized.email,
      hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
    });

    return NextResponse.json(
      {
        id: result.insertedId,
        name: sanitized.name,
        username: sanitized.username || null,
        email: sanitized.email,
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
