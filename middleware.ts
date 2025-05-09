// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  // ละเว้นหน้า signIn เราจะ redirect ไป /login
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    // ทุกหน้า ยกเว้น login และหน้าสมัคร
    "/((?!login|staff/register|customers/register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
