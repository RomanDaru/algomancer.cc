import { createHash } from "node:crypto";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cardDbService } from "@/app/lib/db/services/cardDbService";
import oracle from "@/data/oracle/2026-09-21.json";
import OracleReviewClient from "./OracleReviewClient";

export const dynamic = "force-dynamic";

export default async function OracleReviewPage() {
  // Check here as well as in the layout, before reading the review data.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!session.user.isAdmin) redirect("/");

  const cards = await cardDbService.getAllCards();
  return <OracleReviewClient
    userId={session.user.id}
    cards={cards}
    oracle={oracle}
    batchId={createHash("sha256").update(JSON.stringify(oracle)).digest("hex")}
  />;
}
