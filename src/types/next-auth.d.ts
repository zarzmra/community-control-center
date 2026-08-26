import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "member";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "member";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: "admin" | "member";
  }
}
