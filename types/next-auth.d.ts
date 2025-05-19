// src/types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in User type
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "STAFF" | "ADMIN";
  }

  /**
   * Extends the built-in Session type
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "STAFF" | "ADMIN";
    };
  }

  /**
   * Extends the built-in JWT type
   */
  interface JWT {
    id: string;
    role: "STAFF" | "ADMIN";
  }
}
