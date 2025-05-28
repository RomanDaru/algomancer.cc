import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Check if the current user is an admin
 * Only roman.daru.ml@gmail.com has admin access
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Check if the current user is the specific admin user
 * Only roman.daru.ml@gmail.com has admin access
 */
export async function isSpecificAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.email === "roman.daru.ml@gmail.com" && session?.user?.isAdmin === true;
  } catch (error) {
    console.error("Error checking specific admin status:", error);
    return false;
  }
}

/**
 * Get the current session with admin status
 */
export async function getAdminSession() {
  try {
    const session = await getServerSession(authOptions);
    return {
      session,
      isAdmin: session?.user?.isAdmin === true,
      isSpecificAdmin: session?.user?.email === "roman.daru.ml@gmail.com" && session?.user?.isAdmin === true,
    };
  } catch (error) {
    console.error("Error getting admin session:", error);
    return {
      session: null,
      isAdmin: false,
      isSpecificAdmin: false,
    };
  }
}
