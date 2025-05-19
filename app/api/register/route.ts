import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import mongoose from "@/app/lib/db/mongodb";

export async function POST(request: Request) {
  try {
    const { name, username, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Username is optional but if provided, it must be at least 3 characters
    if (username && username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
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
    const existingUserByEmail = await db.collection("users").findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if username is already taken (if provided)
    if (username) {
      const existingUserByUsername = await db
        .collection("users")
        .findOne({ username });
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
      name,
      username: username || null, // Store username if provided, otherwise null
      email,
      hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
    });

    return NextResponse.json(
      {
        id: result.insertedId,
        name,
        username: username || null,
        email,
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
