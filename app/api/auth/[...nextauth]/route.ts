import NextAuth from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { ObjectId } from "mongodb";
import mongoose from "@/app/lib/db/mongodb";
import { connectToDatabase } from "@/app/lib/db/mongodb";

// Create a MongoDB client promise for the adapter using our unified connection
// Note: MongoDBAdapter requires a MongoClient, but we're using Mongoose
// We'll create a compatible client promise
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve across HMR
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        // Check if this is the admin user (only roman.daru.ml@gmail.com)
        const isAdmin = profile.email === "roman.daru.ml@gmail.com";

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          username: null, // Google doesn't provide a username
          image: profile.picture,
          isAdmin: isAdmin,
        };
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          // Use unified database connection
          const connection = await connectToDatabase();
          const db = connection.db;
          const user = await db.collection("users").findOne({
            email: credentials.email,
          });

          if (!user || !user.hashedPassword) {
            throw new Error("Email does not exist");
          }

          const isCorrectPassword = await compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isCorrectPassword) {
            throw new Error("Incorrect password");
          }

          // Check if this is the admin user (only roman.daru.ml@gmail.com)
          const isAdmin = user.email === "roman.daru.ml@gmail.com";

          // Update admin status in database if needed
          if (isAdmin && !user.isAdmin) {
            await db
              .collection("users")
              .updateOne(
                { _id: user._id },
                { $set: { isAdmin: true, updatedAt: new Date() } }
              );
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username || null,
            image: user.image,
            isAdmin: isAdmin,
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth, check and update admin status
      if (
        account?.provider === "google" &&
        user.email === "roman.daru.ml@gmail.com"
      ) {
        try {
          // Use unified database connection
          const connection = await connectToDatabase();
          const db = connection.db;

          // Update admin status in database
          await db.collection("users").updateOne(
            { email: user.email },
            {
              $set: {
                isAdmin: true,
                updatedAt: new Date(),
              },
            },
            { upsert: false }
          );

          // Update the user object for this session
          user.isAdmin = true;
        } catch (error) {
          console.error("Error updating admin status:", error);
        }
      }

      return true;
    },
    async session({ session, token, user }) {
      // When using JWT strategy
      if (token) {
        if (token?.sub) {
          session.user.id = token.sub;
        }

        // Include username in session if available in token
        if (token?.username !== undefined) {
          session.user.username = token.username;
        }

        // Include admin status in session if available in token
        if (token?.isAdmin !== undefined) {
          session.user.isAdmin = token.isAdmin;
        }
      }

      // When using database strategy
      if (user) {
        session.user.id = user.id;
        session.user.username = user.username || null;
        session.user.isAdmin = user.isAdmin || false;
      }

      return session;
    },
    async jwt({ token, user, trigger }) {
      // Always check admin status for roman.daru.ml@gmail.com
      if (token.email === "roman.daru.ml@gmail.com") {
        try {
          // Use unified database connection
          const connection = await connectToDatabase();
          const db = connection.db;
          if (db) {
            const dbUser = await db.collection("users").findOne({
              email: token.email,
            });

            if (dbUser) {
              token.isAdmin = dbUser.isAdmin || false;
            }
          } else {
            token.isAdmin = token.email === "roman.daru.ml@gmail.com";
          }
        } catch (error) {
          console.error("Error checking admin status in JWT:", error);
          // Fallback: set admin status based on email
          token.isAdmin = token.email === "roman.daru.ml@gmail.com";
        }
      }

      if (user) {
        token.id = user.id;
        // Include username in token
        token.username = user.username;
        // Include admin status in token
        token.isAdmin = user.isAdmin || false;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
