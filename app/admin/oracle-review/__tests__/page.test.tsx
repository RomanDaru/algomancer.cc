/** @jest-environment node */
import { getServerSession } from "next-auth/next";
import { cardDbService } from "@/app/lib/db/services/cardDbService";
import Page from "../page";

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
jest.mock("@/app/lib/db/services/cardDbService", () => ({ cardDbService: { getAllCards: jest.fn().mockResolvedValue([]) } }));
jest.mock("../OracleReviewClient", () => () => null);

describe("oracle review page authorization", () => {
  beforeEach(() => jest.clearAllMocks());
  it.each([null, { user: { id: "user", isAdmin: false } }])("does not read catalog data for a non-admin session", async session => {
    jest.mocked(getServerSession).mockResolvedValue(session);
    await expect(Page()).rejects.toThrow("redirect:");
    expect(cardDbService.getAllCards).not.toHaveBeenCalled();
  });
  it("loads the catalog read-only for an administrator", async () => {
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: "admin", isAdmin: true } });
    const page = await Page();
    expect(cardDbService.getAllCards).toHaveBeenCalledTimes(1);
    expect(page.props.userId).toBe("admin");
    expect(page.props.oracle).toHaveLength(536);
  });
});
