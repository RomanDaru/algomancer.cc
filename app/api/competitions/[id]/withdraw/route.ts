import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";

/**
 * POST /api/competitions/[id]/withdraw
 * Withdraw user's submission from a competition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const competitionId = params.id;
    const { userId } = await request.json();

    // Verify the user is withdrawing their own submission
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only withdraw your own submissions" },
        { status: 403 }
      );
    }

    // Attempt to withdraw the submission
    const success = await competitionDbService.withdrawSubmission(
      competitionId,
      userId
    );

    if (!success) {
      return NextResponse.json(
        { error: "No submission found to withdraw" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Submission withdrawn successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error withdrawing submission:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to withdraw submission";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
