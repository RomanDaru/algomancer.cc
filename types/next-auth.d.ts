import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's MongoDB ID */
      id: string;
      /** The user's username (optional) */
      username?: string | null;
      /** The user's admin status (only for roman.daru.ml@gmail.com) */
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    /** The user's username (optional) */
    username?: string | null;
    /** The user's admin status (only for roman.daru.ml@gmail.com) */
    isAdmin?: boolean;
  }
}
