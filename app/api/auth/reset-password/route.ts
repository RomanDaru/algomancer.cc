import { NextResponse } from "next/server";
import mongoose from "@/app/lib/db/mongodb";
import { validatePassword } from "@/app/lib/utils/validation";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 }
      );
    }

    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const db = mongoose.connection.db;

    // Find user with valid reset token
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and remove reset token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
        },
      }
    );

    return NextResponse.json({
      message: "Password has been reset successfully",
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// GET route to verify reset token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const db = mongoose.connection.db;

    // Check if token is valid and not expired
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email, // Return email for display purposes
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
