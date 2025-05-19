import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      totalAccounts,
      totalBalance,
      monthlyNewAccounts,
      lastMonthNewAccounts,
      depositAmount,
      withdrawAmount,
      transactions,
    ] = await Promise.all([
      prisma.account.count(),
      prisma.account.aggregate({ _sum: { balance: true } }),
      prisma.account.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.account.count({
        where: {
          createdAt: {
            gte: startOfMonth(
              new Date(now.getFullYear(), now.getMonth() - 1, 1)
            ),
            lte: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
          },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "DEPOSIT" },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "WITHDRAW" },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { account: true, staff: true },
      }),
    ]);

    const growthRate =
      lastMonthNewAccounts > 0
        ? ((monthlyNewAccounts - lastMonthNewAccounts) / lastMonthNewAccounts) *
          100
        : 100;

    return NextResponse.json({
      totalAccounts,
      totalBalance: totalBalance._sum.balance || 0,
      monthlyNewAccounts,
      growthRate,
      depositAmount: depositAmount._sum.amount || 0,
      withdrawAmount: withdrawAmount._sum.amount || 0,
      transactions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
