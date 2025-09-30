// app/api/stats/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import {
  startOfMonth,
  endOfMonth,
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  getMonth,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";

    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfToday();

    switch (range) {
      case "today":
        startDate = startOfToday();
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "year":
        startDate = startOfYear(now);
        break;
      case "month":
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [
      dailyDeposits,
      dailyWithdrawals,
      dailyNewAccounts,
      totalAccounts,
      totalBalance,
      allTransactionsInRange,
      newAccountsInRange,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "DEPOSIT",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "WITHDRAW",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.account.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.account.count(),
      prisma.account.aggregate({ _sum: { balance: true } }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        orderBy: { createdAt: "asc" },
        select: { type: true, amount: true, createdAt: true, accountId: true },
      }),
      prisma.account.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
    ]);

    // --- START: Data Aggregation for Charts ---
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i, // 0 = Jan, 1 = Feb, etc.
      deposits: 0,
      withdrawals: 0,
      newAccounts: 0,
    }));

    for (const tx of allTransactionsInRange) {
      const month = getMonth(new Date(tx.createdAt));
      if (tx.type === "DEPOSIT") {
        monthlyData[month].deposits += Number(tx.amount);
      } else if (tx.type === "WITHDRAW") {
        monthlyData[month].withdrawals += Number(tx.amount);
      }
    }

    for (const acc of newAccountsInRange) {
      const month = getMonth(new Date(acc.createdAt));
      monthlyData[month].newAccounts += 1;
    }
    // --- END: Data Aggregation for Charts ---

    const depositsInRange = monthlyData.reduce(
      (sum, data) => sum + data.deposits,
      0
    );
    const withdrawalsInRange = monthlyData.reduce(
      (sum, data) => sum + data.withdrawals,
      0
    );
    const totalNewAccountsInRange = newAccountsInRange.length;

    const recentTransactionsData = await prisma.transaction.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { account: { select: { number: true, accountName: true } } },
    });

    return NextResponse.json({
      dailySummary: {
        deposits: dailyDeposits._sum.amount || 0,
        withdrawals: dailyWithdrawals._sum.amount || 0,
        newAccounts: dailyNewAccounts,
        netFlow:
          Number(dailyDeposits._sum.amount || 0) -
          Number(dailyWithdrawals._sum.amount || 0),
      },
      mainStats: {
        totalAccounts,
        totalBalance: totalBalance._sum.balance || 0,
        newAccounts: totalNewAccountsInRange,
        depositAmount: depositsInRange,
        withdrawAmount: withdrawalsInRange,
      },
      chartData: monthlyData, // Send aggregated data instead of raw transactions
      recentTransactions: recentTransactionsData,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
