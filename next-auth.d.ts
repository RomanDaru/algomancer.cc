import NextAuth, { DefaultSession } from "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    username: string | null;
    isAdmin: boolean;
  }
}

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
