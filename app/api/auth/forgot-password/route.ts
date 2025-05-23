import { NextResponse } from "next/server";
import mongoose from "@/app/lib/db/mongodb";
import { validateEmail } from "@/app/lib/utils/validation";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const db = mongoose.connection.db;

    // Check if user exists
    const user = await db.collection("users").findOne({ email });

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    let emailData = null;

    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await db.collection("users").updateOne(
        { email },
        {
          $set: {
            resetToken,
            resetTokenExpiry,
            updatedAt: new Date(),
          },
        }
      );

      // Create reset URL
      const resetUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/auth/reset-password?token=${resetToken}`;

      // For development: Log the reset URL to console
      console.log("Password reset requested for:", email);
      console.log("Reset URL:", resetUrl);

      // Prepare email data for client-side sending
      emailData = {
        to_email: email,
        user_name: user.name,
        reset_url: resetUrl,
      };
    }

    // Return success with reset data for client-side email sending
    return NextResponse.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
      emailData,
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
