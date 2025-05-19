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
  if (!session?.user || session.user.role !== "STAFF")
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });

  const { accountNumber, amount, type } = await req.json();
  const account = await prisma.account.findUnique({
    where: { number: accountNumber },
  });
  if (!account)
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });

  if (type === "WITHDRAW" && account.balance.lt(amount)) {
    return NextResponse.json(
      { error: "ยอดถอนเกินยอดคงเหลือ" },
      { status: 400 }
    );
  }

  // Calculate new balance
  const balanceAfter =
    type === "DEPOSIT"
      ? account.balance.plus(amount)
      : account.balance.minus(amount);

  const [updatedAccount, newTx] = await prisma.$transaction([
    prisma.account.update({
      where: { number: accountNumber },
      data: {
        balance: balanceAfter,
      },
    }),
    prisma.transaction.create({
      data: {
        accountId: account.id,
        amount,
        type,
        staffId: session.user.id,
        balanceAfter: balanceAfter, // Store the balance after transaction
      },
    }),
  ]);

  return NextResponse.json({
    balance: updatedAccount.balance,
    transaction: newTx,
  });
}
