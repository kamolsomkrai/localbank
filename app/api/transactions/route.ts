// app/api/transactions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("accountNumber") || "";
  const account = await prisma.account.findUnique({
    where: { number: accountNumber },
  });
  if (!account) {
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }
  const transactions = await prisma.transaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ account, transactions });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["STAFF", "ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });

  const { accountNumber, amount, type } = await req.json();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find account inside transaction for row-level consistency
      const account = await tx.account.findUnique({
        where: { number: accountNumber },
      });

      if (!account) {
        throw new Error("NOT_FOUND");
      }

      // Check for sufficient funds on withdrawal
      if (type === "WITHDRAW" && account.balance.lt(amount)) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Atomically update balance using increment/decrement
      const updatedAccount = await tx.account.update({
        where: { number: accountNumber },
        data: {
          balance:
            type === "DEPOSIT" ? { increment: amount } : { decrement: amount },
        },
      });

      // Create transaction record with the new balance
      const newTx = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount,
          type,
          staffId: session.user.id,
          balanceAfter: updatedAccount.balance,
        },
      });

      return { updatedAccount, newTx };
    });

    return NextResponse.json({
      balance: result.updatedAccount.balance,
      transaction: result.newTx,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
      }
      if (error.message === "INSUFFICIENT_FUNDS") {
        return NextResponse.json(
          { error: "ยอดถอนเกินยอดคงเหลือ" },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการทำรายการ" },
      { status: 500 }
    );
  }
}
