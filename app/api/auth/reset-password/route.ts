import { NextResponse } from "next/server";
import mongoose from "@/app/lib/db/mongodb";
import { validatePassword } from "@/app/lib/utils/validation";
import bcrypt from "bcrypt";
import { hashToken } from "@/app/lib/utils/tokenHash";

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
        { error: passwordValidation.feedback[0] || "Invalid password" },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const db = mongoose.connection.db;

    // Find user with valid reset token
    const user = await db.collection("users").findOne({
      resetTokenHash: tokenHash,
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
          resetTokenHash: "",
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

    const tokenHash = hashToken(token);

    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const db = mongoose.connection.db;

    // Check if token is valid and not expired
    const user = await db.collection("users").findOne({
      resetTokenHash: tokenHash,
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
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
