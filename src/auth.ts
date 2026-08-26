import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import authConfig from "@/auth.config";
import { query } from "@/lib/db";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "member";
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string"
          ? credentials.email.trim().toLowerCase()
          : "";
        const password = typeof credentials?.password === "string"
          ? credentials.password
          : "";

        if (!email || !password) return null;

        const result = await query<AuthUser>(
          `SELECT id, name, email, password_hash, role FROM users WHERE email = $1 LIMIT 1`,
          [email],
        );
        const user = result.rows[0];

        if (!user || !(await compare(password, user.password_hash))) {
          return null;
        }

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        };
      },
    }),
  ],
});
