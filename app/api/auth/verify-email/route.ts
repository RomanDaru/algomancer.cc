import { NextResponse } from "next/server";
import mongoose from "@/app/lib/db/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || "");
    }

    const db = mongoose.connection.db;

    const user = await db.collection("users").findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (!user.emailVerificationTokenExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (new Date(user.emailVerificationTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationTokenExpiry: "",
        },
      }
    );

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying email" },
      { status: 500 }
    );
  }
}
