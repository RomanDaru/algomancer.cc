import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      username?: string | null;
      isAdmin?: boolean;
      includePrivateLogsInCommunityStats?: boolean;
      achievementXp?: number;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string | null;
    isAdmin?: boolean;
    includePrivateLogsInCommunityStats?: boolean;
    achievementXp?: number;
  }
}
