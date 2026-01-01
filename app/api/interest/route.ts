// app/api/interest/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Default rates if not found in database
const DEFAULT_RATES = {
  SAVINGS: 0.00001, // 0.001%
  FIXED: 0.02,      // 2%
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });
  }
  const staffId = session.user.id;

  try {
    const { type, lateCalculation, targetYear } = await req.json();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Determine the calculation year
    let calculationYear: number;
    
    if (currentMonth === 11) {
      // December - normal calculation for current year
      calculationYear = currentYear;
    } else if (lateCalculation && targetYear) {
      // Late calculation - must be for previous year
      const previousYear = currentYear - 1;
      if (targetYear !== previousYear) {
        return NextResponse.json(
          { error: `สามารถคำนวณย้อนหลังได้เฉพาะปี ${previousYear} เท่านั้น` },
          { status: 400 }
        );
      }
      calculationYear = targetYear;
    } else {
      return NextResponse.json(
        {
          error: "สามารถคำนวณดอกเบี้ยได้เฉพาะสิ้นปี (เดือนธันวาคม) เท่านั้น",
          requiresLateCalculation: true,
          previousYear: currentYear - 1,
        },
        { status: 400 }
      );
    }

    if (type === "savings") {
      const periodIdentifier = `${calculationYear}-SAVINGS`;
      const existingLog = await prisma.interestCalculationLog.findUnique({
        where: { periodIdentifier },
      });

      if (existingLog) {
        return NextResponse.json(
          {
            error: `ดอกเบี้ยสำหรับรอบนี้ (${periodIdentifier}) ได้ถูกคำนวณไปแล้ว`,
          },
          { status: 409 }
        );
      }

      // Get interest rate from database or use default
      const rateRecord = await prisma.interestRate.findUnique({
        where: { accountType: "SAVINGS" },
      });
      const interestRate = rateRecord?.rate ?? DEFAULT_RATES.SAVINGS;

      let totalInterestPaid = 0;
      let accountsAffected = 0;
      const accounts = await prisma.account.findMany({
        where: { type: "SAVINGS" },
      });

      await prisma.$transaction(async (tx) => {
        for (const account of accounts) {
          const interestAmount = Number(account.balance) * interestRate;

          if (interestAmount > 0) {
            totalInterestPaid += interestAmount;
            accountsAffected++;
            const newBalance = Number(account.balance) + interestAmount;

            await tx.transaction.create({
              data: {
                amount: interestAmount,
                type: "INTEREST",
                balanceAfter: newBalance,
                account: { connect: { id: account.id } },
                staff: { connect: { id: staffId } },
              },
            });
            await tx.account.update({
              where: { id: account.id },
              data: { balance: newBalance },
            });
          }
        }
      });

      await prisma.interestCalculationLog.create({
        data: {
          type: "SAVINGS",
          periodIdentifier,
          staffId,
          status: "SUCCESS",
          accountsAffected,
          totalInterestPaid,
        },
      });

      return NextResponse.json({
        message: `คำนวณดอกเบี้ยออมทรัพย์สำเร็จ`,
        accountsAffected,
        totalInterestPaid,
      });
    } else if (type === "fixed") {
      const periodIdentifier = `${calculationYear}-FIXED`;
      const existingLog = await prisma.interestCalculationLog.findUnique({
        where: { periodIdentifier },
      });

      if (existingLog) {
        return NextResponse.json(
          {
            error: `ดอกเบี้ยสำหรับรอบนี้ (${periodIdentifier}) ได้ถูกคำนวณไปแล้ว`,
          },
          { status: 409 }
        );
      }

      // Get interest rate from database or use default
      const rateRecord = await prisma.interestRate.findUnique({
        where: { accountType: "FIXED" },
      });
      const interestRate = rateRecord?.rate ?? DEFAULT_RATES.FIXED;

      // Check for penalty withdrawal after Jan 10
      const penaltyStartDate = new Date(now.getFullYear(), 0, 11);
      let totalInterestPaid = 0;
      let accountsAffected = 0;
      const accounts = await prisma.account.findMany({
        where: { type: "FIXED" },
      });

      await prisma.$transaction(async (tx) => {
        for (const account of accounts) {
          const penaltyWithdrawal = await tx.transaction.findFirst({
            where: {
              accountId: account.id,
              type: "WITHDRAW",
              createdAt: { gte: penaltyStartDate },
            },
          });

          if (!penaltyWithdrawal) {
            const interestAmount = Number(account.balance) * interestRate;

            if (interestAmount > 0) {
              totalInterestPaid += interestAmount;
              accountsAffected++;
              const newBalance = Number(account.balance) + interestAmount;

              await tx.transaction.create({
                data: {
                  amount: interestAmount,
                  type: "INTEREST",
                  balanceAfter: newBalance,
                  account: { connect: { id: account.id } },
                  staff: { connect: { id: staffId } },
                },
              });
              await tx.account.update({
                where: { id: account.id },
                data: { balance: newBalance },
              });
            }
          }
        }
      });

      await prisma.interestCalculationLog.create({
        data: {
          type: "FIXED",
          periodIdentifier,
          staffId,
          status: "SUCCESS",
          accountsAffected,
          totalInterestPaid,
        },
      });

      return NextResponse.json({
        message: "ตรวจสอบและจ่ายดอกเบี้ยเงินฝากประจำสำเร็จ",
        accountsAffected,
        totalInterestPaid,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid type specified" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Interest calculation failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
