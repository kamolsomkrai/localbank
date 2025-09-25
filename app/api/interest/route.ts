// app/api/interest/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอ" }, { status: 403 });
  }
  const staffId = session.user.id;

  try {
    const { type } = await req.json();
    const now = new Date();

    if (type === "savings") {
      const currentMonth = now.getMonth();
      if (currentMonth !== 5 && currentMonth !== 11) {
        return NextResponse.json(
          {
            error:
              "สามารถคำนวณดอกเบี้ยออมทรัพย์ได้เฉพาะสิ้นเดือนมิถุนายนและธันวาคมเท่านั้น",
          },
          { status: 400 }
        );
      }

      // --- CHANGE START: Define and Check Period ---
      const periodIdentifier = `${now.getFullYear()}-H${
        currentMonth === 5 ? 1 : 2
      }-SAVINGS`;
      const existingLog = await prisma.interestCalculationLog.findUnique({
        where: { periodIdentifier },
      });

      if (existingLog) {
        return NextResponse.json(
          {
            error: `ดอกเบี้ยสำหรับรอบนี้ (${periodIdentifier}) ได้ถูกคำนวณไปแล้ว`,
          },
          { status: 409 } // 409 Conflict: indicates a conflict with the current state of the resource
        );
      }
      // --- CHANGE END ---

      let totalInterestPaid = 0;
      let accountsAffected = 0;
      const accounts = await prisma.account.findMany({
        where: { type: "SAVINGS" },
      });

      await prisma.$transaction(async (tx) => {
        for (const account of accounts) {
          const interestRate = 0.00001;
          const interestAmount = Number(account.balance) * interestRate * 0.5;

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

      // --- CHANGE START: Create Log on Success ---
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
      // --- CHANGE END ---

      return NextResponse.json({
        message: `คำนวณดอกเบี้ยออมทรัพย์สำเร็จ`,
        accountsAffected,
        totalInterestPaid,
      });
    } else if (type === "fixed") {
      // --- CHANGE START: Define and Check Period ---
      const periodIdentifier = `${now.getFullYear()}-FIXED`;
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
      // --- CHANGE END ---

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
            const interestRate = 0.02;
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

      // --- CHANGE START: Create Log on Success ---
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
      // --- CHANGE END ---

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
