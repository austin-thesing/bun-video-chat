import { Auth } from "@auth/core";
import { KyselyAdapter } from "@auth/kysely-adapter";
import Credentials from "@auth/core/providers/credentials";
import { db } from "./database.ts";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "your-secret-key-change-in-production"
);

export const authConfig = {
  adapter: KyselyAdapter(db),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        action: { label: "Action", type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const action = credentials.action as string;

        if (action === "register") {
          // Registration logic
          const existingUser = await db
            .selectFrom("users")
            .selectAll()
            .where("email", "=", credentials.email as string)
            .executeTakeFirst();

          if (existingUser) {
            throw new Error("User already exists");
          }

          const existingUsername = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", credentials.username as string)
            .executeTakeFirst();

          if (existingUsername) {
            throw new Error("Username already taken");
          }

          const hashedPassword = await bcrypt.hash(credentials.password as string, 12);
          const userId = crypto.randomUUID();

          const user = await db
            .insertInto("users")
            .values({
              id: userId,
              email: credentials.email as string,
              username: credentials.username as string,
              name: credentials.username as string,
              password_hash: hashedPassword,
              created_at: new Date().toISOString(),
            })
            .returning(["id", "email", "username", "name"])
            .executeTakeFirst();

          return user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
          } : null;
        } else {
          // Login logic - support both email and username
          const loginIdentifier = credentials.email as string;
          const isEmail = loginIdentifier.includes("@");
          
          const user = await db
            .selectFrom("users")
            .selectAll()
            .where(isEmail ? "email" : "username", "=", loginIdentifier)
            .executeTakeFirst();

          if (!user || !user.password_hash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
};

export async function createJWT(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function handleAuthRequest(request: Request): Promise<Response> {
  return await Auth(request, authConfig);
}