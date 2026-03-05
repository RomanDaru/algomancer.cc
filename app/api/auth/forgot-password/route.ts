import { NextResponse } from "next/server";
import mongoose from "@/app/lib/db/mongodb";
import { validateEmail } from "@/app/lib/utils/validation";
import crypto from "crypto";
import { sendActionEmail } from "@/app/lib/emailjs";
import { hashToken } from "@/app/lib/utils/tokenHash";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    // Validate email
    const emailValidation = validateEmail(normalizedEmail);
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
    const user = await db.collection("users").findOne({
      email: normalizedEmail,
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists

    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = hashToken(resetToken);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await db.collection("users").updateOne(
        { email: normalizedEmail },
        {
          $set: {
            resetTokenHash,
            resetTokenExpiry,
            updatedAt: new Date(),
          },
        }
      );

      // Create reset URL
      const resetUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/auth/reset-password?token=${resetToken}`;

      await sendActionEmail({
        to_email: normalizedEmail,
        subject: "Reset Your Algomancer.cc Password",
        heading: "Reset Your Password",
        user_name: user.name || "Algomancer player",
        message:
          "You requested a password reset for your Algomancer.cc account. Click the button below to reset your password:",
        action_text: "Reset My Password",
        action_url: resetUrl,
        expiry_text: "This link will expire in 1 hour for security reasons.",
        footer:
          "If you didn't request this reset, please ignore this email.<br>This email was sent from <strong>Algomancer.cc</strong>",
      });
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
