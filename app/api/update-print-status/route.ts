// app/api/update-print-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log("--- Print Status Update Request ---");

  try {
    const { transactionIds, printed } = await req.json();
    console.log("Transaction IDs:", transactionIds);
    console.log("New Status:", printed);

    if (!transactionIds || !Array.isArray(transactionIds)) {
      throw new Error("Invalid transaction IDs");
    }

    const result = await prisma.$transaction(async (tx) => {
      // ตรวจสอบก่อนว่ามี transaction เหล่านี้จริงหรือไม่
      const existing = await tx.transaction.findMany({
        where: { id: { in: transactionIds } },
        select: { id: true },
      });

      if (existing.length !== transactionIds.length) {
        throw new Error("Some transactions not found");
      }

      return await tx.transaction.updateMany({
        where: { id: { in: transactionIds } },
        data: { printed },
      });
    });

    console.log("Update result:", result);
    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถอัปเดตสถานะการพิมพ์",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
