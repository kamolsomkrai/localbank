// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STAFF" | "CUSTOMER";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: "STAFF" | "CUSTOMER";
  }
}
