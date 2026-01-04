import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/app/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { validateUsername } from "@/app/lib/utils/validation";

/**
 * PUT /api/user/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("Starting profile update process");
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log("No user ID in session");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("User ID from session:", session.user.id);

    // Parse request body
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { name, username } = body;
    const usernameValue = typeof username === "string" ? username : "";

    // Validate input
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const usernameValidation = validateUsername(usernameValue);
    if (!usernameValidation.isValid) {
      return NextResponse.json(
        { error: usernameValidation.error || "Invalid username" },
        { status: 400 }
      );
    }

    console.log("Connecting to database");
    // Connect to the database
    let db;
    try {
      const connection = await connectToDatabase();
      if (!connection || !connection.db) {
        console.error("Failed to get database connection");
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }
      db = connection.db;
      console.log("Connected to database successfully");
    } catch (error) {
      console.error("Error connecting to database:", error);
      return NextResponse.json(
        {
          error:
            "Database connection error: " +
            (error instanceof Error ? error.message : String(error)),
        },
        { status: 500 }
      );
    }

    // Check if username is already taken (if provided and changed)
    if (usernameValue) {
      console.log("Checking if username is already taken:", usernameValue);
      try {
        const existingUserByUsername = await db.collection("users").findOne({
          _id: { $ne: new ObjectId(session.user.id) },
          username: usernameValue,
        });

        if (existingUserByUsername) {
          console.log("Username already taken");
          return NextResponse.json(
            { error: "Username already taken" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Error checking username:", error);
        return NextResponse.json(
          { error: "Error checking username availability" },
          { status: 500 }
        );
      }
    }

    // Update user profile
    console.log("Updating user profile");
    try {
      // Update user profile
      const userId = new ObjectId(session.user.id);
      console.log("User ID as ObjectId:", userId.toString());

      const result = await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            name,
            username: usernameValue || null,
            updatedAt: new Date(),
          },
        }
      );

      console.log("Update result:", JSON.stringify(result, null, 2));

      if (result.matchedCount === 0) {
        console.log("User not found");
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get the updated user
      console.log("Getting updated user");
      const updatedUser = await db.collection("users").findOne({
        _id: userId,
      });

      console.log("Updated user:", updatedUser ? "Found" : "Not found");

      if (!updatedUser) {
        console.log("Updated user not found");
        return NextResponse.json(
          { error: "Failed to retrieve updated user" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username || null,
        email: updatedUser.email,
      });
    } catch (error) {
      console.error("Error in database operations:", error);
      return NextResponse.json(
        {
          error:
            "Database error: " +
            (error instanceof Error ? error.message : String(error)),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in profile update process:", error);
    return NextResponse.json(
      {
        error:
          "Failed to update profile: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
