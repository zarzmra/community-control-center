import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "admin" | "member";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "admin" | "member";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "member";
  }
}
