import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cardDbService } from "@/app/lib/db/services/cardDbService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const usage = await cardDbService.getCardUsage(resolvedParams.id);

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Error getting card usage:", error);
    return NextResponse.json(
      { error: "Failed to get card usage" },
      { status: 500 }
    );
  }
}
